import { Router } from 'express'
import {
  createRecruitmentSchema,
  updateRecruitmentSchema,
  recruitmentQuerySchema,
  createApplicationSchema,
  createOfferSchema,
} from '@machi/shared'
import { validateRequest } from '../middlewares/validateRequest'
import { requireAuth, requireOnboarding, optionalAuth } from '../middlewares/auth'
import { prisma } from '../lib/prisma'
import { Area, RecruitmentStatus, ApplicationStatus, OfferStatus } from '@prisma/client'

const router = Router()

// ============================================
// 募集一覧・詳細
// ============================================

// GET /api/recruitments - 募集一覧
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const query = recruitmentQuerySchema.parse(req.query)
    const { page, limit, area, categoryId, status } = query

    const where = {
      status: status as RecruitmentStatus,
      ...(area ? { area: area as Area } : {}),
      ...(categoryId ? { categoryId } : {}),
    }

    const [recruitments, total] = await Promise.all([
      prisma.recruitment.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
              area: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
            },
          },
          _count: {
            select: {
              applications: {
                where: { status: 'APPROVED' },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.recruitment.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        items: recruitments.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          datetime: r.datetime,
          datetimeFlex: r.datetimeFlex,
          area: r.area,
          location: r.location,
          minPeople: r.minPeople,
          maxPeople: r.maxPeople,
          currentPeople: r._count.applications + 1, // +1 for creator
          status: r.status,
          createdAt: r.createdAt,
          creator: r.creator,
          category: r.category,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/recruitments/me - 自分の募集一覧
router.get('/me', requireAuth, requireOnboarding, async (req, res, next) => {
  try {
    const recruitments = await prisma.recruitment.findMany({
      where: { creatorId: req.user!.id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        _count: {
          select: {
            applications: {
              where: { status: 'APPROVED' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      success: true,
      data: recruitments.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        datetime: r.datetime,
        datetimeFlex: r.datetimeFlex,
        area: r.area,
        location: r.location,
        minPeople: r.minPeople,
        maxPeople: r.maxPeople,
        currentPeople: r._count.applications + 1,
        status: r.status,
        createdAt: r.createdAt,
        category: r.category,
      })),
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/recruitments/:id - 募集詳細
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params

    const recruitment = await prisma.recruitment.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            bio: true,
            area: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        applications: {
          where: { status: 'APPROVED' },
          include: {
            applicant: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    })

    if (!recruitment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Recruitment not found',
        },
      })
    }

    // ユーザーの申請・オファー状況を確認
    let userApplication = null
    let userOffer = null

    if (req.user) {
      userApplication = await prisma.application.findUnique({
        where: {
          recruitmentId_applicantId: {
            recruitmentId: id,
            applicantId: req.user.id,
          },
        },
      })

      userOffer = await prisma.offer.findUnique({
        where: {
          recruitmentId_receiverId: {
            recruitmentId: id,
            receiverId: req.user.id,
          },
        },
      })
    }

    res.json({
      success: true,
      data: {
        id: recruitment.id,
        title: recruitment.title,
        description: recruitment.description,
        datetime: recruitment.datetime,
        datetimeFlex: recruitment.datetimeFlex,
        area: recruitment.area,
        location: recruitment.location,
        minPeople: recruitment.minPeople,
        maxPeople: recruitment.maxPeople,
        currentPeople: recruitment.applications.length + 1,
        status: recruitment.status,
        createdAt: recruitment.createdAt,
        creator: recruitment.creator,
        category: recruitment.category,
        members: [
          {
            id: recruitment.creator.id,
            nickname: recruitment.creator.nickname,
            avatarUrl: recruitment.creator.avatarUrl,
            role: 'OWNER',
          },
          ...recruitment.applications.map((a) => ({
            id: a.applicant.id,
            nickname: a.applicant.nickname,
            avatarUrl: a.applicant.avatarUrl,
            role: 'MEMBER',
          })),
        ],
        isOwner: req.user?.id === recruitment.creatorId,
        hasApplied: !!userApplication,
        applicationStatus: userApplication?.status || null,
        hasReceivedOffer: !!userOffer,
        offerStatus: userOffer?.status || null,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/recruitments - 募集作成
router.post(
  '/',
  requireAuth,
  requireOnboarding,
  validateRequest(createRecruitmentSchema),
  async (req, res, next) => {
    try {
      const { title, categoryId, description, datetime, datetimeFlex, area, location, minPeople, maxPeople } =
        req.body

      // カテゴリの存在確認
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      })

      if (!category) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CATEGORY',
            message: 'Invalid category',
          },
        })
      }

      const recruitment = await prisma.recruitment.create({
        data: {
          creatorId: req.user!.id,
          categoryId,
          title,
          description,
          datetime: datetime ? new Date(datetime) : null,
          datetimeFlex,
          area: area as Area,
          location,
          minPeople,
          maxPeople,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
            },
          },
        },
      })

      res.status(201).json({
        success: true,
        data: {
          id: recruitment.id,
          title: recruitment.title,
          description: recruitment.description,
          datetime: recruitment.datetime,
          datetimeFlex: recruitment.datetimeFlex,
          area: recruitment.area,
          location: recruitment.location,
          minPeople: recruitment.minPeople,
          maxPeople: recruitment.maxPeople,
          currentPeople: 1,
          status: recruitment.status,
          createdAt: recruitment.createdAt,
          category: recruitment.category,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// PUT /api/recruitments/:id - 募集更新
router.put(
  '/:id',
  requireAuth,
  validateRequest(updateRecruitmentSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params

      const recruitment = await prisma.recruitment.findUnique({
        where: { id },
      })

      if (!recruitment) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Recruitment not found',
          },
        })
      }

      if (recruitment.creatorId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Not authorized to update this recruitment',
          },
        })
      }

      const { title, description, datetime, datetimeFlex, location, minPeople, maxPeople } = req.body

      const updated = await prisma.recruitment.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(datetime !== undefined && { datetime: datetime ? new Date(datetime) : null }),
          ...(datetimeFlex !== undefined && { datetimeFlex }),
          ...(location !== undefined && { location }),
          ...(minPeople !== undefined && { minPeople }),
          ...(maxPeople !== undefined && { maxPeople }),
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
            },
          },
        },
      })

      res.json({
        success: true,
        data: {
          id: updated.id,
          title: updated.title,
          description: updated.description,
          datetime: updated.datetime,
          datetimeFlex: updated.datetimeFlex,
          area: updated.area,
          location: updated.location,
          minPeople: updated.minPeople,
          maxPeople: updated.maxPeople,
          status: updated.status,
          createdAt: updated.createdAt,
          category: updated.category,
        },
      })
    } catch (error) {
      next(error)
    }
  }
)

// PUT /api/recruitments/:id/close - 募集を締め切る
router.put('/:id/close', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params

    const recruitment = await prisma.recruitment.findUnique({
      where: { id },
    })

    if (!recruitment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Recruitment not found',
        },
      })
    }

    if (recruitment.creatorId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized',
        },
      })
    }

    if (recruitment.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Recruitment is not open',
        },
      })
    }

    await prisma.recruitment.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    })

    res.json({
      success: true,
      data: { message: 'Recruitment closed' },
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/recruitments/:id - 募集キャンセル
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params

    const recruitment = await prisma.recruitment.findUnique({
      where: { id },
    })

    if (!recruitment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Recruitment not found',
        },
      })
    }

    if (recruitment.creatorId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized',
        },
      })
    }

    await prisma.recruitment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    res.json({
      success: true,
      data: { message: 'Recruitment cancelled' },
    })
  } catch (error) {
    next(error)
  }
})

// ============================================
// 参加申請
// ============================================

// POST /api/recruitments/:id/apply - 参加申請
router.post('/:id/apply', requireAuth, requireOnboarding, async (req, res, next) => {
  try {
    const { id } = req.params
    const { message } = req.body

    const recruitment = await prisma.recruitment.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            applications: {
              where: { status: 'APPROVED' },
            },
          },
        },
      },
    })

    if (!recruitment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Recruitment not found',
        },
      })
    }

    if (recruitment.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'RECRUITMENT_CLOSED',
          message: 'Recruitment is not open',
        },
      })
    }

    if (recruitment.creatorId === req.user!.id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SELF_APPLICATION',
          message: 'Cannot apply to own recruitment',
        },
      })
    }

    // 定員チェック
    const currentPeople = recruitment._count.applications + 1 // +1 for creator
    if (currentPeople >= recruitment.maxPeople) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FULL',
          message: 'Recruitment is full',
        },
      })
    }

    // 既に申請済みかチェック
    const existingApplication = await prisma.application.findUnique({
      where: {
        recruitmentId_applicantId: {
          recruitmentId: id,
          applicantId: req.user!.id,
        },
      },
    })

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_APPLIED',
          message: 'Already applied to this recruitment',
        },
      })
    }

    const application = await prisma.application.create({
      data: {
        recruitmentId: id,
        applicantId: req.user!.id,
        message,
      },
    })

    res.status(201).json({
      success: true,
      data: {
        id: application.id,
        status: application.status,
        message: application.message,
        createdAt: application.createdAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/recruitments/:id/applications - 申請一覧（募集主のみ）
router.get('/:id/applications', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params

    const recruitment = await prisma.recruitment.findUnique({
      where: { id },
    })

    if (!recruitment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Recruitment not found',
        },
      })
    }

    if (recruitment.creatorId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized',
        },
      })
    }

    const applications = await prisma.application.findMany({
      where: { recruitmentId: id },
      include: {
        applicant: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            bio: true,
            area: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      success: true,
      data: applications.map((a) => ({
        id: a.id,
        status: a.status,
        message: a.message,
        createdAt: a.createdAt,
        respondedAt: a.respondedAt,
        applicant: a.applicant,
      })),
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/recruitments/:recruitmentId/applications/:applicationId - 申請に対応
router.put('/:recruitmentId/applications/:applicationId', requireAuth, async (req, res, next) => {
  try {
    const { recruitmentId, applicationId } = req.params
    const { action } = req.body as { action: 'APPROVE' | 'REJECT' }

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ACTION',
          message: 'Invalid action',
        },
      })
    }

    const recruitment = await prisma.recruitment.findUnique({
      where: { id: recruitmentId },
    })

    if (!recruitment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Recruitment not found',
        },
      })
    }

    if (recruitment.creatorId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized',
        },
      })
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    })

    if (!application || application.recruitmentId !== recruitmentId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Application not found',
        },
      })
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_RESPONDED',
          message: 'Application already responded',
        },
      })
    }

    const newStatus: ApplicationStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: newStatus,
        respondedAt: new Date(),
      },
    })

    res.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        respondedAt: updated.respondedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// ============================================
// オファー
// ============================================

// POST /api/recruitments/:id/offer - オファー送信
router.post('/:id/offer', requireAuth, requireOnboarding, async (req, res, next) => {
  try {
    const { id } = req.params
    const { receiverId, message } = req.body

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_RECEIVER',
          message: 'Receiver ID is required',
        },
      })
    }

    const recruitment = await prisma.recruitment.findUnique({
      where: { id },
    })

    if (!recruitment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Recruitment not found',
        },
      })
    }

    if (recruitment.creatorId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized',
        },
      })
    }

    if (recruitment.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'RECRUITMENT_CLOSED',
          message: 'Recruitment is not open',
        },
      })
    }

    // 既にオファー済みかチェック
    const existingOffer = await prisma.offer.findUnique({
      where: {
        recruitmentId_receiverId: {
          recruitmentId: id,
          receiverId,
        },
      },
    })

    if (existingOffer) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_OFFERED',
          message: 'Already sent offer to this user',
        },
      })
    }

    const offer = await prisma.offer.create({
      data: {
        recruitmentId: id,
        senderId: req.user!.id,
        receiverId,
        message,
      },
    })

    res.status(201).json({
      success: true,
      data: {
        id: offer.id,
        status: offer.status,
        message: offer.message,
        createdAt: offer.createdAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/recruitments/:recruitmentId/offers/:offerId - オファーに応答
router.put('/:recruitmentId/offers/:offerId', requireAuth, async (req, res, next) => {
  try {
    const { recruitmentId, offerId } = req.params
    const { action } = req.body as { action: 'ACCEPT' | 'DECLINE' }

    if (!['ACCEPT', 'DECLINE'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ACTION',
          message: 'Invalid action',
        },
      })
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    })

    if (!offer || offer.recruitmentId !== recruitmentId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Offer not found',
        },
      })
    }

    if (offer.receiverId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized',
        },
      })
    }

    if (offer.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_RESPONDED',
          message: 'Offer already responded',
        },
      })
    }

    const newStatus: OfferStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED'

    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: {
        status: newStatus,
        respondedAt: new Date(),
      },
    })

    // オファー承諾時、自動的に参加承認として申請を作成
    if (action === 'ACCEPT') {
      await prisma.application.upsert({
        where: {
          recruitmentId_applicantId: {
            recruitmentId,
            applicantId: req.user!.id,
          },
        },
        create: {
          recruitmentId,
          applicantId: req.user!.id,
          status: 'APPROVED',
          respondedAt: new Date(),
        },
        update: {
          status: 'APPROVED',
          respondedAt: new Date(),
        },
      })
    }

    res.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        respondedAt: updated.respondedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/recruitments/me/offers - 受け取ったオファー一覧
router.get('/me/offers', requireAuth, async (req, res, next) => {
  try {
    const offers = await prisma.offer.findMany({
      where: { receiverId: req.user!.id },
      include: {
        recruitment: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                icon: true,
              },
            },
            creator: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      success: true,
      data: offers.map((o) => ({
        id: o.id,
        status: o.status,
        message: o.message,
        createdAt: o.createdAt,
        respondedAt: o.respondedAt,
        recruitment: {
          id: o.recruitment.id,
          title: o.recruitment.title,
          category: o.recruitment.category,
          creator: o.recruitment.creator,
        },
      })),
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/recruitments/me/applications - 自分の申請一覧
router.get('/me/applications', requireAuth, async (req, res, next) => {
  try {
    const applications = await prisma.application.findMany({
      where: { applicantId: req.user!.id },
      include: {
        recruitment: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                icon: true,
              },
            },
            creator: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      success: true,
      data: applications.map((a) => ({
        id: a.id,
        status: a.status,
        message: a.message,
        createdAt: a.createdAt,
        respondedAt: a.respondedAt,
        recruitment: {
          id: a.recruitment.id,
          title: a.recruitment.title,
          category: a.recruitment.category,
          creator: a.recruitment.creator,
        },
      })),
    })
  } catch (error) {
    next(error)
  }
})

export { router as recruitmentsRouter }
