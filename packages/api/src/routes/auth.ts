import { Router } from 'express'
import { signUpSchema, signInSchema } from '@machi/shared'
import { validateRequest } from '../middlewares/validateRequest'
import { supabaseAdmin, supabase } from '../lib/supabase'
import { prisma } from '../lib/prisma'

const router = Router()

// POST /api/auth/signup - メール・パスワードで新規登録
router.post('/signup', validateRequest(signUpSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Supabase Authで登録
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 開発中は自動確認
    })

    if (authError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: authError.message,
        },
      })
    }

    // ユーザーをDBに保存
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email: authData.user.email!,
        isOnboarded: false,
      },
    })

    res.status(201).json({
      success: true,
      data: {
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          isOnboarded: user.isOnboarded,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/signin - メール・パスワードでログイン
router.post('/signin', validateRequest(signInSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Supabase Authでログイン
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: authError.message,
        },
      })
    }

    // DBからユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: authData.user.id },
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
          message: 'User not found in database',
        },
      })
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          area: user.area,
          isOnboarded: user.isOnboarded,
          interests: user.interests.map((i) => ({
            id: i.category.id,
            name: i.category.name,
          })),
        },
        session: {
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
          expiresAt: authData.session.expires_at,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/signout - ログアウト
router.post('/signout', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      // トークンを無効化（Supabaseのセッション終了）
      await supabaseAdmin.auth.admin.signOut(token)
    }

    res.json({
      success: true,
      data: {
        message: 'Logout successful',
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/refresh - トークンリフレッシュ
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Refresh token is required',
        },
      })
    }

    const { data: authData, error: authError } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (authError || !authData.session) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'REFRESH_FAILED',
          message: authError?.message || 'Failed to refresh session',
        },
      })
    }

    res.json({
      success: true,
      data: {
        session: {
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
          expiresAt: authData.session.expires_at,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/auth/me - 現在のユーザー情報取得
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
      })
    }

    const token = authHeader.substring(7)

    // Supabaseでトークン検証
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !authUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      })
    }

    // DBからユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
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
          message: 'User not found in database',
        },
      })
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          area: user.area,
          isOnboarded: user.isOnboarded,
          createdAt: user.createdAt,
          interests: user.interests.map((i) => ({
            id: i.category.id,
            name: i.category.name,
          })),
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/auth/oauth/google - Google OAuth URL取得
router.get('/oauth/google', async (req, res, next) => {
  try {
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback`

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'OAUTH_ERROR',
          message: error.message,
        },
      })
    }

    res.json({
      success: true,
      data: {
        url: data.url,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/oauth/callback - OAuth コールバック処理
router.post('/oauth/callback', async (req, res, next) => {
  try {
    const { accessToken, refreshToken } = req.body

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required',
        },
      })
    }

    // トークンからユーザー情報を取得
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser(accessToken)

    if (authError || !authUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
        },
      })
    }

    // DBにユーザーが存在するか確認、なければ作成
    let user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        interests: {
          include: {
            category: true,
          },
        },
      },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: authUser.id,
          email: authUser.email!,
          nickname: authUser.user_metadata?.name || null,
          avatarUrl: authUser.user_metadata?.avatar_url || null,
          isOnboarded: false,
        },
        include: {
          interests: {
            include: {
              category: true,
            },
          },
        },
      })
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          area: user.area,
          isOnboarded: user.isOnboarded,
          interests: user.interests.map((i) => ({
            id: i.category.id,
            name: i.category.name,
          })),
        },
        session: {
          accessToken,
          refreshToken,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

export { router as authRouter }
