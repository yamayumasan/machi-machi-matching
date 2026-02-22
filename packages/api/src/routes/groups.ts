import { Router } from 'express'
import { createMessageSchema, createReviewSchema, updateReviewSchema } from '@machi/shared'
import { validateRequest } from '../middlewares/validateRequest'
import { requireAuth, requireOnboarding } from '../middlewares/auth'
import { prisma } from '../lib/prisma'
import { notifyGroupCreated, notifyReviewReceived } from '../services/notificationService'
import { checkContent } from '../lib/contentFilter'

const router = Router()

// ============================================
// グループ一覧・詳細
// ============================================

// GET /api/groups - 参加中のグループ一覧
router.get('/', requireAuth, requireOnboarding, async (req, res, next) => {
  try {
    const userId = req.user!.id

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: { userId },
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

    // 各グループの未読数を計算
    const groupsWithUnread = await Promise.all(
      groups.map(async (g) => {
        const myMembership = g.members.find((m) => m.userId === userId)
        const lastReadAt = myMembership?.lastReadAt || new Date(0)

        const unreadCount = await prisma.message.count({
          where: {
            groupId: g.id,
            createdAt: { gt: lastReadAt },
            senderId: { not: userId }, // 自分のメッセージは除外
          },
        })

        return {
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
          unreadCount,
          updatedAt: g.updatedAt,
        }
      })
    )

    res.json({
      success: true,
      data: groupsWithUnread,
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

      // 全メンバーに通知を送信
      try {
        const memberIds = [
          recruitment.creatorId,
          ...recruitment.applications.map((a) => a.applicantId),
        ]
        await notifyGroupCreated(memberIds, group.id, group.name, recruitmentId)
      } catch (notifyError) {
        console.error('Failed to send group created notification:', notifyError)
      }

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

    // 最新のメッセージを取得した場合はlastReadAtを更新
    if (!before && messages.length > 0) {
      await prisma.groupMember.update({
        where: {
          groupId_userId: {
            groupId: id,
            userId: req.user!.id,
          },
        },
        data: { lastReadAt: new Date() },
      })
    }

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

      // NGワードチェック
      const contentCheck = checkContent(content)
      if (!contentCheck.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CONTENT_VIOLATION',
            message: contentCheck.reason || '不適切なコンテンツが含まれています',
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

// ============================================
// レビュー
// ============================================

// GET /api/groups/:id/reviewable-members - レビュー可能なメンバー一覧
router.get('/:id/reviewable-members', requireAuth, requireOnboarding, async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    // メンバーかチェック
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId,
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

    // グループの他のメンバーを取得
    const members = await prisma.groupMember.findMany({
      where: {
        groupId: id,
        userId: { not: userId },
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    })

    // 既にレビュー済みかどうかをチェック
    const existingReviews = await prisma.review.findMany({
      where: {
        groupId: id,
        reviewerId: userId,
      },
    })

    const reviewedUserIds = new Map(existingReviews.map((r) => [r.revieweeId, r.id]))

    const reviewableMembers = members.map((m) => ({
      userId: m.user.id,
      nickname: m.user.nickname,
      avatarUrl: m.user.avatarUrl,
      alreadyReviewed: reviewedUserIds.has(m.user.id),
      existingReviewId: reviewedUserIds.get(m.user.id) || null,
    }))

    res.json({
      success: true,
      data: reviewableMembers,
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/groups/:id/reviews - レビュー作成
router.post(
  '/:id/reviews',
  requireAuth,
  requireOnboarding,
  validateRequest(createReviewSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { revieweeId, rating, comment, isAnonymous } = req.body
      const reviewerId = req.user!.id

      // 自分へのレビューは不可
      if (revieweeId === reviewerId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REVIEWEE',
            message: '自分自身をレビューすることはできません',
          },
        })
      }

      // レビュワーがメンバーかチェック
      const reviewerMembership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: id,
            userId: reviewerId,
          },
        },
      })

      if (!reviewerMembership) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'NOT_MEMBER',
            message: 'You are not a member of this group',
          },
        })
      }

      // レビュー対象がメンバーかチェック
      const revieweeMembership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: id,
            userId: revieweeId,
          },
        },
      })

      if (!revieweeMembership) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REVIEWEE',
            message: '指定されたユーザーはこのグループのメンバーではありません',
          },
        })
      }

      // 既にレビュー済みかチェック
      const existingReview = await prisma.review.findUnique({
        where: {
          groupId_reviewerId_revieweeId: {
            groupId: id,
            reviewerId,
            revieweeId,
          },
        },
      })

      if (existingReview) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ALREADY_REVIEWED',
            message: '既にこのユーザーをレビュー済みです',
          },
        })
      }

      // コメントのNGワードチェック
      if (comment) {
        const contentCheck = checkContent(comment)
        if (!contentCheck.isValid) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'CONTENT_VIOLATION',
              message: contentCheck.reason || '不適切なコンテンツが含まれています',
            },
          })
        }
      }

      const review = await prisma.review.create({
        data: {
          groupId: id,
          reviewerId,
          revieweeId,
          rating,
          comment,
          isAnonymous,
        },
        include: {
          reviewer: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
            },
          },
          reviewee: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      // 通知を送信
      try {
        await notifyReviewReceived(revieweeId, id, review.group.name, rating, isAnonymous)
      } catch (notifyError) {
        console.error('Failed to send review notification:', notifyError)
      }

      res.status(201).json({
        success: true,
        data: {
          id: review.id,
          groupId: review.groupId,
          rating: review.rating,
          comment: review.comment,
          isAnonymous: review.isAnonymous,
          reviewee: review.reviewee,
          createdAt: review.createdAt,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// GET /api/groups/:id/reviews - グループのレビュー一覧
router.get('/:id/reviews', requireAuth, requireOnboarding, async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    // メンバーかチェック
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId,
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

    const reviews = await prisma.review.findMany({
      where: { groupId: id },
      include: {
        reviewer: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 匿名レビューの場合はレビュワー情報を隠す（自分が書いた場合は見える）
    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      isAnonymous: r.isAnonymous,
      reviewer: r.isAnonymous && r.reviewerId !== userId ? null : r.reviewer,
      reviewee: r.reviewee,
      isOwn: r.reviewerId === userId,
      createdAt: r.createdAt,
    }))

    res.json({
      success: true,
      data: formattedReviews,
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/groups/:groupId/reviews/:reviewId - レビュー更新
router.put(
  '/:groupId/reviews/:reviewId',
  requireAuth,
  requireOnboarding,
  validateRequest(updateReviewSchema),
  async (req, res, next) => {
    try {
      const { groupId, reviewId } = req.params
      const { rating, comment, isAnonymous } = req.body
      const userId = req.user!.id

      const review = await prisma.review.findUnique({
        where: { id: reviewId },
      })

      if (!review) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Review not found',
          },
        })
      }

      if (review.groupId !== groupId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_GROUP',
            message: 'Review does not belong to this group',
          },
        })
      }

      if (review.reviewerId !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '自分のレビューのみ編集できます',
          },
        })
      }

      // コメントのNGワードチェック
      if (comment) {
        const contentCheck = checkContent(comment)
        if (!contentCheck.isValid) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'CONTENT_VIOLATION',
              message: contentCheck.reason || '不適切なコンテンツが含まれています',
            },
          })
        }
      }

      const updatedReview = await prisma.review.update({
        where: { id: reviewId },
        data: {
          ...(rating !== undefined && { rating }),
          ...(comment !== undefined && { comment }),
          ...(isAnonymous !== undefined && { isAnonymous }),
        },
        include: {
          reviewee: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
            },
          },
        },
      })

      res.json({
        success: true,
        data: {
          id: updatedReview.id,
          groupId: updatedReview.groupId,
          rating: updatedReview.rating,
          comment: updatedReview.comment,
          isAnonymous: updatedReview.isAnonymous,
          reviewee: updatedReview.reviewee,
          updatedAt: updatedReview.updatedAt,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// DELETE /api/groups/:groupId/reviews/:reviewId - レビュー削除
router.delete(
  '/:groupId/reviews/:reviewId',
  requireAuth,
  requireOnboarding,
  async (req, res, next) => {
    try {
      const { groupId, reviewId } = req.params
      const userId = req.user!.id

      const review = await prisma.review.findUnique({
        where: { id: reviewId },
      })

      if (!review) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Review not found',
          },
        })
      }

      if (review.groupId !== groupId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_GROUP',
            message: 'Review does not belong to this group',
          },
        })
      }

      if (review.reviewerId !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '自分のレビューのみ削除できます',
          },
        })
      }

      await prisma.review.delete({
        where: { id: reviewId },
      })

      res.json({
        success: true,
        data: { message: 'Review deleted successfully' },
      })
    } catch (error) {
      next(error)
    }
  }
)

export { router as groupsRouter }
