import { Router } from 'express'
import { createWantToDoSchema, updateWantToDoSchema, paginationSchema } from '@machi/shared'
import { validateRequest } from '../middlewares/validateRequest'
import { requireAuth, requireOnboarding, optionalAuth } from '../middlewares/auth'
import { prisma } from '../lib/prisma'
import { Area } from '@prisma/client'

const router = Router()

// 有効期限を計算するヘルパー関数
const calculateExpiresAt = (timing: string): Date => {
  const now = new Date()
  switch (timing) {
    case 'THIS_WEEK':
      // 今週の日曜日23:59:59
      const daysUntilSunday = 7 - now.getDay()
      const sunday = new Date(now)
      sunday.setDate(now.getDate() + daysUntilSunday)
      sunday.setHours(23, 59, 59, 999)
      return sunday
    case 'NEXT_WEEK':
      // 来週の日曜日23:59:59
      const nextSunday = new Date(now)
      nextSunday.setDate(now.getDate() + (14 - now.getDay()))
      nextSunday.setHours(23, 59, 59, 999)
      return nextSunday
    case 'THIS_MONTH':
      // 今月の最終日23:59:59
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      endOfMonth.setHours(23, 59, 59, 999)
      return endOfMonth
    case 'ANYTIME':
    default:
      // 3ヶ月後
      const threeMonths = new Date(now)
      threeMonths.setMonth(now.getMonth() + 3)
      return threeMonths
  }
}

// GET /api/want-to-dos - やりたいこと一覧取得
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = paginationSchema.parse(req.query)
    const { categoryId, area, timing } = req.query as {
      categoryId?: string
      area?: string
      timing?: string
    }

    const where: any = {
      status: 'ACTIVE',
      expiresAt: { gt: new Date() },
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (area) {
      where.user = { area }
    }

    if (timing) {
      where.timing = timing
    }

    const [wantToDos, total] = await Promise.all([
      prisma.wantToDo.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
              area: true,
            },
          },
          category: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.wantToDo.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        items: wantToDos.map((w) => ({
          id: w.id,
          timing: w.timing,
          comment: w.comment,
          expiresAt: w.expiresAt,
          createdAt: w.createdAt,
          category: {
            id: w.category.id,
            name: w.category.name,
            icon: w.category.icon,
          },
          user: w.user,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/want-to-dos/me - 自分のやりたいこと一覧
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const wantToDos = await prisma.wantToDo.findMany({
      where: {
        userId: req.user!.id,
        status: { not: 'DELETED' },
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      success: true,
      data: wantToDos.map((w) => ({
        id: w.id,
        timing: w.timing,
        comment: w.comment,
        status: w.status,
        expiresAt: w.expiresAt,
        createdAt: w.createdAt,
        category: {
          id: w.category.id,
          name: w.category.name,
          icon: w.category.icon,
        },
      })),
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/want-to-dos - やりたいこと作成
router.post(
  '/',
  requireAuth,
  requireOnboarding,
  validateRequest(createWantToDoSchema),
  async (req, res, next) => {
    try {
      const { categoryId, timing, comment, latitude, longitude, locationName } = req.body

      // カテゴリ存在チェック
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      })

      if (!category) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: 'Category not found',
          },
        })
      }

      // 同じカテゴリで既にアクティブなやりたいことがあるかチェック
      const existing = await prisma.wantToDo.findFirst({
        where: {
          userId: req.user!.id,
          categoryId,
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
        },
      })

      if (existing) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ALREADY_EXISTS',
            message: 'Active want-to-do already exists for this category',
          },
        })
      }

      const expiresAt = calculateExpiresAt(timing)

      const wantToDo = await prisma.wantToDo.create({
        data: {
          userId: req.user!.id,
          categoryId,
          timing,
          comment,
          latitude,
          longitude,
          locationName,
          expiresAt,
        },
        include: {
          category: true,
        },
      })

      res.status(201).json({
        success: true,
        data: {
          id: wantToDo.id,
          timing: wantToDo.timing,
          comment: wantToDo.comment,
          status: wantToDo.status,
          expiresAt: wantToDo.expiresAt,
          createdAt: wantToDo.createdAt,
          category: {
            id: wantToDo.category.id,
            name: wantToDo.category.name,
            icon: wantToDo.category.icon,
          },
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// GET /api/want-to-dos/:id - やりたいこと詳細
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params

    const wantToDo = await prisma.wantToDo.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            bio: true,
            area: true,
          },
        },
        category: true,
      },
    })

    if (!wantToDo || wantToDo.status === 'DELETED') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Want-to-do not found',
        },
      })
    }

    res.json({
      success: true,
      data: {
        id: wantToDo.id,
        timing: wantToDo.timing,
        comment: wantToDo.comment,
        status: wantToDo.status,
        expiresAt: wantToDo.expiresAt,
        createdAt: wantToDo.createdAt,
        category: {
          id: wantToDo.category.id,
          name: wantToDo.category.name,
          icon: wantToDo.category.icon,
        },
        user: wantToDo.user,
        isOwner: req.user?.id === wantToDo.userId,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/want-to-dos/:id - やりたいこと更新
router.put(
  '/:id',
  requireAuth,
  validateRequest(updateWantToDoSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { timing, comment } = req.body

      const wantToDo = await prisma.wantToDo.findUnique({
        where: { id },
      })

      if (!wantToDo || wantToDo.status === 'DELETED') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Want-to-do not found',
          },
        })
      }

      if (wantToDo.userId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own want-to-do',
          },
        })
      }

      const updateData: any = {}
      if (timing !== undefined) {
        updateData.timing = timing
        updateData.expiresAt = calculateExpiresAt(timing)
      }
      if (comment !== undefined) {
        updateData.comment = comment
      }

      const updated = await prisma.wantToDo.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
        },
      })

      res.json({
        success: true,
        data: {
          id: updated.id,
          timing: updated.timing,
          comment: updated.comment,
          status: updated.status,
          expiresAt: updated.expiresAt,
          createdAt: updated.createdAt,
          category: {
            id: updated.category.id,
            name: updated.category.name,
            icon: updated.category.icon,
          },
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// DELETE /api/want-to-dos/:id - やりたいこと削除
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params

    const wantToDo = await prisma.wantToDo.findUnique({
      where: { id },
    })

    if (!wantToDo || wantToDo.status === 'DELETED') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Want-to-do not found',
        },
      })
    }

    if (wantToDo.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only delete your own want-to-do',
        },
      })
    }

    await prisma.wantToDo.update({
      where: { id },
      data: { status: 'DELETED' },
    })

    res.json({
      success: true,
      data: {
        message: 'Want-to-do deleted successfully',
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/want-to-dos/matching - マッチング候補取得
router.get('/matching/suggestions', requireAuth, requireOnboarding, async (req, res, next) => {
  try {
    // ユーザーの興味カテゴリを取得
    const userInterests = await prisma.userCategory.findMany({
      where: { userId: req.user!.id },
      select: { categoryId: true },
    })

    const categoryIds = userInterests.map((i) => i.categoryId)

    if (categoryIds.length === 0) {
      return res.json({
        success: true,
        data: {
          items: [],
          message: 'No interests set. Please update your profile.',
        },
      })
    }

    // 同じエリア、同じカテゴリのやりたいことを取得
    const userArea = req.user!.area as Area | null
    const suggestions = await prisma.wantToDo.findMany({
      where: {
        categoryId: { in: categoryIds },
        ...(userArea ? { user: { area: userArea } } : {}),
        userId: { not: req.user!.id },
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            area: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    res.json({
      success: true,
      data: {
        items: suggestions.map((w) => ({
          id: w.id,
          timing: w.timing,
          comment: w.comment,
          expiresAt: w.expiresAt,
          createdAt: w.createdAt,
          category: w.category,
          user: w.user,
        })),
      },
    })
  } catch (error) {
    next(error)
  }
})

export { router as wantToDosRouter }
