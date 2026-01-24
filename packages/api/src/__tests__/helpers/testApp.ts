import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'

// テスト用ユーザー型
export interface TestUser {
  id: string
  email: string
  nickname: string | null
  avatarUrl: string | null
  bio: string | null
  area: string | null
  isOnboarded: boolean
}

// デフォルトのテストユーザー
export const defaultTestUser: TestUser = {
  id: 'test-user-id-1',
  email: 'test@example.com',
  nickname: 'テストユーザー',
  avatarUrl: null,
  bio: 'テスト用のユーザーです',
  area: '東京都渋谷区',
  isOnboarded: true,
}

// テスト用の認証済みユーザーを設定するミドルウェア
export function mockAuthMiddleware(user: TestUser | null = defaultTestUser) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (user) {
      req.user = user
    }
    next()
  }
}

// テスト用Expressアプリを作成
export function createTestApp(): Express {
  const app = express()

  app.use(cors())
  app.use(express.json())

  return app
}

// エラーハンドラー
export function testErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('Test error:', err.message)
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message,
    },
  })
}
