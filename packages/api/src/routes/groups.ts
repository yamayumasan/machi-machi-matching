import { Router } from 'express'
import { createMessageSchema } from '@machi/shared'
import { validateRequest } from '../middlewares/validateRequest'
import { requireAuth, requireOnboarding } from '../middlewares/auth'
import { prisma } from '../lib/prisma'

const router = Router()

// ============================================
// グループ一覧・詳細
// ============================================

// GET /api/groups - 参加中のグループ一覧
router.get('/', requireAuth, requireOnboarding, async (req, res, next) => {
  try {
    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: { userId: req.user!.id },
        },
      },
      include: {
        recruitment: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                icon: true,
              },
            },
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                nickname: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    res.json({
      success: true,
      data: groups.map((g) => ({
        id: g.id,
        name: g.name,
        recruitment: {
          id: g.recruitment.id,
          title: g.recruitment.title,
          category: g.recruitment.category,
        },
        members: g.members.map((m) => ({
          id: m.user.id,
          nickname: m.user.nickname,
          avatarUrl: m.user.avatarUrl,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
        lastMessage: g.messages[0]
          ? {
              id: g.messages[0].id,
              content: g.messages[0].content,
              senderId: g.messages[0].senderId,
              senderNickname: g.messages[0].sender.nickname,
              createdAt: g.messages[0].createdAt,
            }
          : null,
        updatedAt: g.updatedAt,
      })),
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/groups/:id - グループ詳細
router.get('/:id', requireAuth, requireOnboarding, async (req, res, next) => {
  try {
    const { id } = req.params

    // メンバーかチェック
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId: req.user!.id,
        },
      },
    })

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_MEMBER',
          message: 'You are not a member of this group',
        },
      })
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        recruitment: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                icon: true,
              },
            },
            creator: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
              },
            },
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
                bio: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    })

    if (!group) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Group not found',
        },
      })
    }

    res.json({
      success: true,
      data: {
        id: group.id,
        name: group.name,
        recruitment: {
          id: group.recruitment.id,
          title: group.recruitment.title,
          description: group.recruitment.description,
          datetime: group.recruitment.datetime,
          datetimeFlex: group.recruitment.datetimeFlex,
          location: group.recruitment.location,
          category: group.recruitment.category,
          creator: group.recruitment.creator,
        },
        members: group.members.map((m) => ({
          id: m.user.id,
          nickname: m.user.nickname,
          avatarUrl: m.user.avatarUrl,
          bio: m.user.bio,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
        myRole: membership.role,
        createdAt: group.createdAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/groups/create-from-recruitment/:recruitmentId - 募集からグループ作成
router.post(
  '/create-from-recruitment/:recruitmentId',
  requireAuth,
  requireOnboarding,
  async (req, res, next) => {
    try {
      const { recruitmentId } = req.params

      const recruitment = await prisma.recruitment.findUnique({
        where: { id: recruitmentId },
        include: {
          applications: {
            where: { status: 'APPROVED' },
          },
          group: true,
        },
      })

      if (!recruitment) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Recruitment not found',
          },
        })
      }

      if (recruitment.creatorId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only the creator can create a group',
          },
        })
      }

      if (recruitment.group) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'GROUP_EXISTS',
            message: 'Group already exists for this recruitment',
          },
        })
      }

      // グループ作成とメンバー追加をトランザクションで
      const group = await prisma.$transaction(async (tx) => {
        const newGroup = await tx.group.create({
          data: {
            recruitmentId,
            name: recruitment.title,
          },
        })

        // 募集者をオーナーとして追加
        await tx.groupMember.create({
          data: {
            groupId: newGroup.id,
            userId: recruitment.creatorId,
            role: 'OWNER',
          },
        })

        // 承認された申請者をメンバーとして追加
        for (const app of recruitment.applications) {
          await tx.groupMember.create({
            data: {
              groupId: newGroup.id,
              userId: app.applicantId,
              role: 'MEMBER',
            },
          })
        }

        // 募集をクローズ
        await tx.recruitment.update({
          where: { id: recruitmentId },
          data: {
            status: 'COMPLETED',
            closedAt: new Date(),
          },
        })

        return newGroup
      })

      res.status(201).json({
        success: true,
        data: {
          id: group.id,
          name: group.name,
          message: 'Group created successfully',
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// ============================================
// メッセージ
// ============================================

// GET /api/groups/:id/messages - メッセージ一覧
router.get('/:id/messages', requireAuth, requireOnboarding, async (req, res, next) => {
  try {
    const { id } = req.params
    const { before, limit = '50' } = req.query

    // メンバーかチェック
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId: req.user!.id,
        },
      },
    })

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_MEMBER',
          message: 'You are not a member of this group',
        },
      })
    }

    const messages = await prisma.message.findMany({
      where: {
        groupId: id,
        ...(before ? { createdAt: { lt: new Date(before as string) } } : {}),
      },
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit as string, 10), 100),
    })

    res.json({
      success: true,
      data: messages.reverse().map((m) => ({
        id: m.id,
        content: m.content,
        sender: m.sender,
        createdAt: m.createdAt,
        isOwn: m.senderId === req.user!.id,
      })),
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/groups/:id/messages - メッセージ送信
router.post(
  '/:id/messages',
  requireAuth,
  requireOnboarding,
  validateRequest(createMessageSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { content } = req.body

      // メンバーかチェック
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: id,
            userId: req.user!.id,
          },
        },
      })

      if (!membership) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'NOT_MEMBER',
            message: 'You are not a member of this group',
          },
        })
      }

      const message = await prisma.message.create({
        data: {
          groupId: id,
          senderId: req.user!.id,
          content,
        },
        include: {
          sender: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
            },
          },
        },
      })

      // グループの更新日時を更新
      await prisma.group.update({
        where: { id },
        data: { updatedAt: new Date() },
      })

      res.status(201).json({
        success: true,
        data: {
          id: message.id,
          content: message.content,
          sender: message.sender,
          createdAt: message.createdAt,
          isOwn: true,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

export { router as groupsRouter }
