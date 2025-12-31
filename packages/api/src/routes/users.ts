import { Router } from 'express'
import { updateUserSchema, updateUserCategoriesSchema, onboardingSchema } from '@machi/shared'
import { validateRequest } from '../middlewares/validateRequest'
import { requireAuth, requireOnboarding, optionalAuth } from '../middlewares/auth'
import { prisma } from '../lib/prisma'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

// GET /api/users/me - 自分のプロフィール取得
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        interests: {
          include: {
            category: true,
          },
        },
      },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      })
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        area: user.area,
        latitude: user.latitude,
        longitude: user.longitude,
        locationName: user.locationName,
        isOnboarded: user.isOnboarded,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        interests: user.interests.map((i) => ({
          id: i.category.id,
          name: i.category.name,
        })),
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/users/me - プロフィール更新
router.put('/me', requireAuth, validateRequest(updateUserSchema), async (req, res, next) => {
  try {
    const { nickname, bio, area, latitude, longitude, locationName } = req.body

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(nickname !== undefined && { nickname }),
        ...(bio !== undefined && { bio }),
        ...(area !== undefined && { area }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(locationName !== undefined && { locationName }),
      },
    })

    res.json({
      success: true,
      data: {
        id: user.id,
        nickname: user.nickname,
        bio: user.bio,
        area: user.area,
        latitude: user.latitude,
        longitude: user.longitude,
        locationName: user.locationName,
        updatedAt: user.updatedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/users/me/onboarding - オンボーディング完了
router.post(
  '/me/onboarding',
  requireAuth,
  validateRequest(onboardingSchema),
  async (req, res, next) => {
    try {
      const { nickname, bio, area, categoryIds, latitude, longitude, locationName } = req.body

      // トランザクションでユーザー更新とカテゴリ設定を行う
      const user = await prisma.$transaction(async (tx) => {
        // ユーザー情報を更新
        const updatedUser = await tx.user.update({
          where: { id: req.user!.id },
          data: {
            nickname,
            bio,
            area,
            latitude,
            longitude,
            locationName,
            isOnboarded: true,
          },
        })

        // 既存のカテゴリを削除
        await tx.userCategory.deleteMany({
          where: { userId: req.user!.id },
        })

        // 新しいカテゴリを追加
        await tx.userCategory.createMany({
          data: categoryIds.map((categoryId: string) => ({
            userId: req.user!.id,
            categoryId,
          })),
        })

        return updatedUser
      })

      // カテゴリ情報を取得
      const interests = await prisma.userCategory.findMany({
        where: { userId: user.id },
        include: { category: true },
      })

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          bio: user.bio,
          area: user.area,
          latitude: user.latitude,
          longitude: user.longitude,
          locationName: user.locationName,
          isOnboarded: user.isOnboarded,
          interests: interests.map((i) => ({
            id: i.category.id,
            name: i.category.name,
          })),
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// GET /api/users/me/categories - 自分のカテゴリ取得
router.get('/me/categories', requireAuth, async (req, res, next) => {
  try {
    const interests = await prisma.userCategory.findMany({
      where: { userId: req.user!.id },
      include: { category: true },
    })

    res.json({
      success: true,
      data: interests.map((i) => ({
        id: i.category.id,
        name: i.category.name,
      })),
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/users/me/categories - カテゴリ更新
router.put(
  '/me/categories',
  requireAuth,
  validateRequest(updateUserCategoriesSchema),
  async (req, res, next) => {
    try {
      const { categoryIds } = req.body

      // トランザクションでカテゴリを更新
      await prisma.$transaction(async (tx) => {
        // 既存のカテゴリを削除
        await tx.userCategory.deleteMany({
          where: { userId: req.user!.id },
        })

        // 新しいカテゴリを追加
        await tx.userCategory.createMany({
          data: categoryIds.map((categoryId: string) => ({
            userId: req.user!.id,
            categoryId,
          })),
        })
      })

      // 更新後のカテゴリを取得
      const interests = await prisma.userCategory.findMany({
        where: { userId: req.user!.id },
        include: { category: true },
      })

      res.json({
        success: true,
        data: interests.map((i) => ({
          id: i.category.id,
          name: i.category.name,
        })),
      })
    } catch (error) {
      next(error)
    }
  }
)

// PUT /api/users/me/avatar - アバター更新
router.put('/me/avatar', requireAuth, async (req, res, next) => {
  try {
    const { avatarUrl } = req.body

    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Avatar URL is required',
        },
      })
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl },
    })

    res.json({
      success: true,
      data: {
        avatarUrl: user.avatarUrl,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/users/:id - 他ユーザーのプロフィール取得
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        interests: {
          include: {
            category: true,
          },
        },
      },
    })

    if (!user || !user.isOnboarded) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      })
    }

    // 公開情報のみ返す
    res.json({
      success: true,
      data: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        area: user.area,
        interests: user.interests.map((i) => ({
          id: i.category.id,
          name: i.category.name,
        })),
      },
    })
  } catch (error) {
    next(error)
  }
})

export { router as usersRouter }
