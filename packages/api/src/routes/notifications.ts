import { Router } from 'express'
import { notificationQuerySchema } from '@machi/shared'
import { requireAuth } from '../middlewares/auth'
import { prisma } from '../lib/prisma'

const router = Router()

// ============================================
// 通知一覧・詳細
// ============================================

// GET /api/notifications - 通知一覧
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const query = notificationQuerySchema.parse(req.query)
    const { page, limit, unreadOnly } = query

    const where = {
      userId: req.user!.id,
      ...(unreadOnly ? { isRead: false } : {}),
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ])

    res.json({
      success: true,
      data: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/notifications/unread-count - 未読数取得
router.get('/unread-count', requireAuth, async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user!.id,
        isRead: false,
      },
    })

    res.json({
      success: true,
      data: { count },
    })
  } catch (error) {
    next(error)
  }
})

// ============================================
// 既読操作
// ============================================

// POST /api/notifications/:id/read - 単一通知を既読にする
router.post('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params

    const notification = await prisma.notification.findUnique({
      where: { id },
    })

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification not found',
        },
      })
    }

    if (notification.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You cannot mark this notification as read',
        },
      })
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    })

    res.json({
      success: true,
      data: {
        id: updated.id,
        isRead: updated.isRead,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/notifications/read-all - 全て既読にする
router.post('/read-all', requireAuth, async (req, res, next) => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId: req.user!.id,
        isRead: false,
      },
      data: { isRead: true },
    })

    res.json({
      success: true,
      data: {
        updatedCount: result.count,
      },
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/notifications/:id - 通知を削除
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params

    const notification = await prisma.notification.findUnique({
      where: { id },
    })

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification not found',
        },
      })
    }

    if (notification.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You cannot delete this notification',
        },
      })
    }

    await prisma.notification.delete({
      where: { id },
    })

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export { router as notificationsRouter }
