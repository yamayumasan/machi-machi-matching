import { Router } from 'express'
import multer from 'multer'
import { updateUserSchema, updateUserCategoriesSchema, onboardingSchema } from '@machi/shared'
import { validateRequest } from '../middlewares/validateRequest'
import { requireAuth, requireOnboarding, optionalAuth } from '../middlewares/auth'
import { prisma } from '../lib/prisma'
import { supabaseAdmin } from '../lib/supabase'

// multer設定（メモリストレージ、5MB制限）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.'))
    }
  },
})

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

// POST /api/users/me/avatar - アバター画像アップロード
router.post('/me/avatar', requireAuth, upload.single('avatar'), async (req, res, next) => {
  try {
    const file = req.file

    if (!file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Avatar image file is required',
        },
      })
    }

    const userId = req.user!.id
    const ext = file.mimetype.split('/')[1] === 'jpeg' ? 'jpg' : file.mimetype.split('/')[1]
    const fileName = `${userId}/${Date.now()}.${ext}`
    const bucketName = 'avatars'

    // 古いアバターを削除（あれば）
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    })

    if (currentUser?.avatarUrl) {
      // Supabase Storage URLからパスを抽出
      const oldPath = currentUser.avatarUrl.split(`${bucketName}/`)[1]
      if (oldPath) {
        await supabaseAdmin.storage.from(bucketName).remove([oldPath])
      }
    }

    // Supabase Storageにアップロード
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      })

    if (uploadError) {
      console.error('Avatar upload error:', uploadError)
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Failed to upload avatar image',
        },
      })
    }

    // 公開URLを取得
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    const avatarUrl = urlData.publicUrl

    // ユーザーのavatarUrlを更新
    const user = await prisma.user.update({
      where: { id: userId },
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

// DELETE /api/users/me/avatar - アバター画像削除
router.delete('/me/avatar', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id
    const bucketName = 'avatars'

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    })

    if (currentUser?.avatarUrl) {
      // Supabase Storage URLからパスを抽出
      const oldPath = currentUser.avatarUrl.split(`${bucketName}/`)[1]
      if (oldPath) {
        await supabaseAdmin.storage.from(bucketName).remove([oldPath])
      }
    }

    // ユーザーのavatarUrlをnullに更新
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    })

    res.status(204).send()
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

// POST /api/users/push-token - プッシュトークン登録
router.post('/push-token', requireAuth, async (req, res, next) => {
  try {
    const { token, platform } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Push token is required',
        },
      })
    }

    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        pushToken: token,
        pushPlatform: platform || 'unknown',
      },
    })

    res.json({
      success: true,
      data: { message: 'Push token registered' },
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/users/push-token - プッシュトークン削除
router.delete('/push-token', requireAuth, async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        pushToken: null,
        pushPlatform: null,
      },
    })

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export { router as usersRouter }
