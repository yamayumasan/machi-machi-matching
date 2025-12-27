import { Router } from 'express'
import { signUpSchema, signInSchema } from '@machi/shared'
import { validateRequest } from '../middlewares/validateRequest'

const router = Router()

// POST /api/auth/signup
router.post('/signup', validateRequest(signUpSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body

    // TODO: Supabase Authで登録処理
    // TODO: ユーザーをDBに保存

    res.status(201).json({
      success: true,
      data: {
        message: 'User registered successfully',
        user: {
          id: 'temp-id',
          email,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/signin
router.post('/signin', validateRequest(signInSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body

    // TODO: Supabase Authでログイン処理

    res.json({
      success: true,
      data: {
        message: 'Login successful',
        user: {
          id: 'temp-id',
          email,
        },
        session: {
          accessToken: 'temp-token',
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/signout
router.post('/signout', async (req, res, next) => {
  try {
    // TODO: Supabase Authでログアウト処理

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

// GET /api/auth/me
router.get('/me', async (req, res, next) => {
  try {
    // TODO: JWTからユーザー情報を取得

    res.json({
      success: true,
      data: {
        user: null,
      },
    })
  } catch (error) {
    next(error)
  }
})

export { router as authRouter }
