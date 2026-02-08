import { Router } from 'express'
import { z } from 'zod'
import { validateRequest } from '../middlewares/validateRequest'
import { requireAuth } from '../middlewares/auth'
import { prisma } from '../lib/prisma'

const router = Router()

// 報告理由のEnum
const ReportReasons = [
  'SPAM',
  'HARASSMENT',
  'INAPPROPRIATE_CONTENT',
  'FAKE_PROFILE',
  'OFFENSIVE_LANGUAGE',
  'OTHER',
] as const

// 報告対象のEnum
const ReportTargets = ['USER', 'RECRUITMENT', 'MESSAGE'] as const

// バリデーションスキーマ
const createReportSchema = z.object({
  reportedUserId: z.string().min(1, '報告対象ユーザーを指定してください'),
  targetType: z.enum(ReportTargets),
  targetId: z.string().optional(),
  reason: z.enum(ReportReasons),
  description: z.string().max(500).optional(),
})

// POST /api/moderation/reports - 報告を作成
router.post('/reports', requireAuth, validateRequest(createReportSchema), async (req, res, next) => {
  try {
    const { reportedUserId, targetType, targetId, reason, description } = req.body
    const reporterId = req.user!.id

    // 自分自身を報告することはできない
    if (reporterId === reportedUserId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: '自分自身を報告することはできません',
        },
      })
    }

    // 報告対象ユーザーが存在するか確認
    const reportedUser = await prisma.user.findUnique({
      where: { id: reportedUserId },
    })

    if (!reportedUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '報告対象ユーザーが見つかりません',
        },
      })
    }

    // 同じ内容での重複報告をチェック
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId,
        reportedUserId,
        targetType,
        targetId: targetId || null,
        status: 'PENDING',
      },
    })

    if (existingReport) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_REPORT',
          message: 'すでにこの内容で報告済みです',
        },
      })
    }

    const report = await prisma.report.create({
      data: {
        reporterId,
        reportedUserId,
        targetType,
        targetId,
        reason,
        description,
      },
    })

    res.status(201).json({
      success: true,
      data: {
        id: report.id,
        message: '報告を受け付けました。ご協力ありがとうございます。',
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/moderation/blocks - ユーザーをブロック
router.post('/blocks', requireAuth, async (req, res, next) => {
  try {
    const { userId: blockedUserId } = req.body
    const blockerId = req.user!.id

    if (!blockedUserId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'ブロック対象ユーザーを指定してください',
        },
      })
    }

    // 自分自身をブロックすることはできない
    if (blockerId === blockedUserId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: '自分自身をブロックすることはできません',
        },
      })
    }

    // ブロック対象ユーザーが存在するか確認
    const blockedUser = await prisma.user.findUnique({
      where: { id: blockedUserId },
    })

    if (!blockedUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'ユーザーが見つかりません',
        },
      })
    }

    // 既にブロック済みかチェック
    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedUserId: {
          blockerId,
          blockedUserId,
        },
      },
    })

    if (existingBlock) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_BLOCKED',
          message: 'すでにブロック済みです',
        },
      })
    }

    await prisma.block.create({
      data: {
        blockerId,
        blockedUserId,
      },
    })

    res.status(201).json({
      success: true,
      data: {
        message: 'ユーザーをブロックしました',
      },
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/moderation/blocks/:userId - ブロック解除
router.delete('/blocks/:userId', requireAuth, async (req, res, next) => {
  try {
    const blockedUserId = req.params.userId
    const blockerId = req.user!.id

    const block = await prisma.block.findUnique({
      where: {
        blockerId_blockedUserId: {
          blockerId,
          blockedUserId,
        },
      },
    })

    if (!block) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BLOCK_NOT_FOUND',
          message: 'ブロックが見つかりません',
        },
      })
    }

    await prisma.block.delete({
      where: {
        id: block.id,
      },
    })

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

// GET /api/moderation/blocks - ブロックリスト取得
router.get('/blocks', requireAuth, async (req, res, next) => {
  try {
    const blockerId = req.user!.id

    const blocks = await prisma.block.findMany({
      where: { blockerId },
      include: {
        blocked: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      success: true,
      data: blocks.map((block) => ({
        id: block.id,
        user: {
          id: block.blocked.id,
          nickname: block.blocked.nickname,
          avatarUrl: block.blocked.avatarUrl,
        },
        createdAt: block.createdAt,
      })),
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/moderation/blocks/:userId/status - 特定ユーザーのブロック状態を確認
router.get('/blocks/:userId/status', requireAuth, async (req, res, next) => {
  try {
    const targetUserId = req.params.userId
    const currentUserId = req.user!.id

    const [isBlocked, isBlockedBy] = await Promise.all([
      // 自分がブロックしているか
      prisma.block.findUnique({
        where: {
          blockerId_blockedUserId: {
            blockerId: currentUserId,
            blockedUserId: targetUserId,
          },
        },
      }),
      // 相手からブロックされているか
      prisma.block.findUnique({
        where: {
          blockerId_blockedUserId: {
            blockerId: targetUserId,
            blockedUserId: currentUserId,
          },
        },
      }),
    ])

    res.json({
      success: true,
      data: {
        isBlocked: !!isBlocked,
        isBlockedBy: !!isBlockedBy,
      },
    })
  } catch (error) {
    next(error)
  }
})

export { router as moderationRouter }
