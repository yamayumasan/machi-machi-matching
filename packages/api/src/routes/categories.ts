import { Router } from 'express'
import { CATEGORIES } from '@machi/shared'

const router = Router()

// GET /api/categories
router.get('/', async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: CATEGORIES.map((category, index) => ({
        ...category,
        sortOrder: index,
      })),
    })
  } catch (error) {
    next(error)
  }
})

export { router as categoriesRouter }
