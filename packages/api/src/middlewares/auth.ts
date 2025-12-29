import { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase'
import { prisma } from '../lib/prisma'

// Express.Requestを拡張してユーザー情報を追加
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        nickname: string | null
        avatarUrl: string | null
        bio: string | null
        area: string | null
        isOnboarded: boolean
      }
    }
  }
}

// 認証必須ミドルウェア
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
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

    // リクエストにユーザー情報を追加
    req.user = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      area: user.area,
      isOnboarded: user.isOnboarded,
    }

    next()
  } catch (error) {
    next(error)
  }
}

// オンボーディング完了必須ミドルウェア
export const requireOnboarding = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    })
  }

  if (!req.user.isOnboarded) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ONBOARDING_REQUIRED',
        message: 'Please complete onboarding first',
      },
    })
  }

  next()
}

// オプショナル認証ミドルウェア（認証なしでもアクセス可能）
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return next()
    }

    const token = authHeader.substring(7)

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser(token)

    if (authUser) {
      const user = await prisma.user.findUnique({
        where: { id: authUser.id },
      })

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          area: user.area,
          isOnboarded: user.isOnboarded,
        }
      }
    }

    next()
  } catch {
    // エラーが発生しても続行（オプショナルなので）
    next()
  }
}
