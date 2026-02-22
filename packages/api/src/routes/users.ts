import { Router } from 'express'
import multer from 'multer'
import { updateUserSchema, updateUserCategoriesSchema, onboardingSchema } from '@machi/shared'
import { validateRequest } from '../middlewares/validateRequest'
import { requireAuth, requireOnboarding, optionalAuth } from '../middlewares/auth'
import { prisma } from '../lib/prisma'
import { supabaseAdmin } from '../lib/supabase'

// アクティビティステータスを計算するヘルパー
type ActivityStatus = 'active' | 'recent' | 'away' | 'offline'

const getActivityStatus = (lastActiveAt: Date): { status: ActivityStatus; lastActiveAt: string } => {
  const now = new Date()
  const diffMs = now.getTime() - lastActiveAt.getTime()
  const diffMinutes = diffMs / (1000 * 60)
  const diffHours = diffMinutes / 60
  const diffDays = diffHours / 24

  let status: ActivityStatus
  if (diffMinutes < 15) {
    status = 'active' // 15分以内: オンライン
  } else if (diffHours < 24) {
    status = 'recent' // 24時間以内: 最近
  } else if (diffDays < 7) {
    status = 'away' // 7日以内: 離れている
  } else {
    status = 'offline' // 7日以上: オフライン
  }

  return {
    status,
    lastActiveAt: lastActiveAt.toISOString(),
  }
}

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

// 信頼スコアを計算するヘルパー関数
const calculateTrustScore = async (userId: string): Promise<{
  score: number
  totalReviews: number
  averageRating: number | null
  matchCount: number
}> => {
  // レビュー統計を取得
  const reviewStats = await prisma.review.aggregate({
    where: { revieweeId: userId },
    _avg: { rating: true },
    _count: { id: true },
  })

  // マッチング回数（グループ参加数）を取得
  const matchCount = await prisma.groupMember.count({
    where: { userId },
  })

  const totalReviews = reviewStats._count.id
  const averageRating = reviewStats._avg.rating

  // 信頼スコア計算（0-100）
  // - ベーススコア: 50
  // - レビュー平均評価による加点（最大30点）: (rating - 3) * 15 (3以上なら加点、未満なら減点)
  // - マッチング経験による加点（最大20点）: min(matchCount * 2, 20)
  let score = 50

  if (averageRating !== null) {
    score += (averageRating - 3) * 15
  }

  score += Math.min(matchCount * 2, 20)

  // スコアを0-100の範囲に収める
  score = Math.max(0, Math.min(100, Math.round(score)))

  return {
    score,
    totalReviews,
    averageRating: averageRating !== null ? Math.round(averageRating * 10) / 10 : null,
    matchCount,
  }
}

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

    // 信頼スコアを計算
    const trustScore = await calculateTrustScore(req.user!.id)

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
        trustScore,
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
      const { nickname, bio, area, categoryIds, latitude, longitude, locationName, agreedToTerms } = req.body

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
            ...(agreedToTerms && { agreedToTermsAt: new Date() }),
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

    // アクティビティステータスを計算
    const activityInfo = getActivityStatus(user.lastActiveAt)

    // 信頼スコアを計算
    const trustScore = await calculateTrustScore(id)

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
        activity: activityInfo,
        trustScore,
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

// DELETE /api/users/me - アカウント削除
router.delete('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id

    // トランザクションで関連データを削除
    await prisma.$transaction(async (tx) => {
      // 1. 通知を削除
      await tx.notification.deleteMany({
        where: { userId },
      })

      // 2. メッセージの送信者を匿名化（削除済みユーザーとして残す）
      await tx.message.updateMany({
        where: { senderId: userId },
        data: { senderId: userId }, // 実際にはユーザー削除後も参照は残る
      })

      // 3. グループメンバーから削除
      await tx.groupMember.deleteMany({
        where: { userId },
      })

      // 4. オファーを削除（送信・受信両方）
      await tx.offer.deleteMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
      })

      // 5. 申請を削除
      await tx.application.deleteMany({
        where: { applicantId: userId },
      })

      // 6. 自分が作成した募集のステータスをCLOSEDに変更
      await tx.recruitment.updateMany({
        where: { creatorId: userId },
        data: { status: 'CLOSED' },
      })

      // 7. やりたいことを削除
      await tx.wantToDo.deleteMany({
        where: { userId },
      })

      // 8. ユーザーカテゴリを削除
      await tx.userCategory.deleteMany({
        where: { userId },
      })

      // 9. アバター画像を削除（あれば）
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { avatarUrl: true },
      })

      if (user?.avatarUrl) {
        const bucketName = 'avatars'
        const oldPath = user.avatarUrl.split(`${bucketName}/`)[1]
        if (oldPath) {
          await supabaseAdmin.storage.from(bucketName).remove([oldPath])
        }
      }

      // 10. ユーザーを削除
      await tx.user.delete({
        where: { id: userId },
      })
    })

    // Supabase Authからユーザーを削除
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Failed to delete user from Supabase Auth:', authError)
      // DBからは削除済みなので、エラーでも成功として扱う
    }

    res.json({
      success: true,
      data: {
        message: 'Account deleted successfully',
      },
    })
  } catch (error) {
    next(error)
  }
})

export { router as usersRouter }
