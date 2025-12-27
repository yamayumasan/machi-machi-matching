import { Router } from 'express'
import { updateUserSchema, updateUserCategoriesSchema } from '@machi/shared'
import { validateRequest } from '../middlewares/validateRequest'

const router = Router()

// GET /api/users/me
router.get('/me', async (req, res, next) => {
  try {
    // TODO: 認証ミドルウェアからユーザー情報を取得

    res.json({
      success: true,
      data: {
        id: 'temp-id',
        email: 'user@example.com',
        nickname: 'テストユーザー',
        avatarUrl: null,
        bio: null,
        area: 'TOKYO',
        categories: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/users/me
router.put('/me', validateRequest(updateUserSchema), async (req, res, next) => {
  try {
    const { nickname, bio, area } = req.body

    // TODO: ユーザー情報を更新

    res.json({
      success: true,
      data: {
        id: 'temp-id',
        nickname,
        bio,
        area,
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/users/me/categories
router.get('/me/categories', async (req, res, next) => {
  try {
    // TODO: ユーザーのカテゴリを取得

    res.json({
      success: true,
      data: [],
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/users/me/categories
router.put('/me/categories', validateRequest(updateUserCategoriesSchema), async (req, res, next) => {
  try {
    const { categoryIds } = req.body

    // TODO: ユーザーのカテゴリを更新

    res.json({
      success: true,
      data: {
        categoryIds,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/users/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    // TODO: ユーザー情報を取得

    res.json({
      success: true,
      data: {
        id,
        nickname: 'ユーザー',
        avatarUrl: null,
        bio: null,
        area: 'TOKYO',
      },
    })
  } catch (error) {
    next(error)
  }
})

export { router as usersRouter }
