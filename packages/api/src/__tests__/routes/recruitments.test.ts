import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import request from 'supertest'
import express, { Request, Response, NextFunction } from 'express'

// テスト用ユーザー
const testUser = {
  id: 'test-user-id-1',
  email: 'test@example.com',
  nickname: 'テストユーザー',
  avatarUrl: null,
  bio: 'テスト用のユーザーです',
  area: '東京都渋谷区',
  isOnboarded: true,
}

// Prismaモック
const mockPrisma = {
  recruitment: {
    findMany: jest.fn<() => Promise<unknown>>(),
    findUnique: jest.fn<() => Promise<unknown>>(),
    create: jest.fn<() => Promise<unknown>>(),
    update: jest.fn<() => Promise<unknown>>(),
    count: jest.fn<() => Promise<number>>(),
  },
  category: {
    findUnique: jest.fn<() => Promise<unknown>>(),
  },
  application: {
    findUnique: jest.fn<() => Promise<unknown>>(),
    findMany: jest.fn<() => Promise<unknown>>(),
    create: jest.fn<() => Promise<unknown>>(),
  },
  offer: {
    findUnique: jest.fn<() => Promise<unknown>>(),
  },
}

// ESMモジュールをモック
jest.unstable_mockModule('../../lib/prisma.js', () => ({
  prisma: mockPrisma,
}))

jest.unstable_mockModule('../../lib/supabase.js', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
  },
}))

jest.unstable_mockModule('../../middlewares/auth.js', () => ({
  requireAuth: (req: Request, _res: Response, next: NextFunction) => {
    req.user = testUser
    next()
  },
  requireOnboarding: (_req: Request, _res: Response, next: NextFunction) => next(),
  optionalAuth: (req: Request, _res: Response, next: NextFunction) => {
    req.user = testUser
    next()
  },
}))

jest.unstable_mockModule('../../middlewares/validateRequest.js', () => ({
  validateRequest: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}))

jest.unstable_mockModule('../../services/notificationService.js', () => ({
  notifyApplicationReceived: jest.fn(),
  notifyApplicationApproved: jest.fn(),
  notifyApplicationRejected: jest.fn(),
  notifyOfferReceived: jest.fn(),
  notifyOfferAccepted: jest.fn(),
  notifyOfferDeclined: jest.fn(),
  notifyGroupCreated: jest.fn(),
  notifyMemberJoined: jest.fn(),
}))

// モジュールをモック後にインポート
const { recruitmentsRouter } = await import('../../routes/recruitments.js')

// テスト用アプリ作成関数
function createTestApp() {
  const app = express()
  app.use(express.json())
  return app
}

// エラーハンドラー
function testErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('Test error:', err.message)
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: err.message },
  })
}

describe('Recruitments API', () => {
  let app: express.Express

  beforeEach(() => {
    jest.clearAllMocks()
    app = createTestApp()
    app.use('/api/recruitments', recruitmentsRouter)
    app.use(testErrorHandler)
  })

  describe('GET /api/recruitments', () => {
    it('should return list of recruitments', async () => {
      const mockRecruitments = [
        {
          id: 'recruitment-1',
          title: 'テスト募集1',
          description: '説明1',
          datetime: new Date('2024-01-15T10:00:00Z'),
          datetimeFlex: null,
          area: 'SHIBUYA',
          location: '渋谷駅周辺',
          latitude: 35.658,
          longitude: 139.701,
          locationName: '渋谷駅',
          minPeople: 2,
          maxPeople: 5,
          status: 'OPEN',
          createdAt: new Date('2024-01-01T00:00:00Z'),
          creator: {
            id: 'user-1',
            nickname: 'テストユーザー',
            avatarUrl: null,
            area: 'SHIBUYA',
          },
          category: {
            id: 'category-1',
            name: 'カフェ',
            icon: 'coffee',
          },
          _count: {
            applications: 1,
          },
        },
      ]

      mockPrisma.recruitment.findMany.mockResolvedValue(mockRecruitments)
      mockPrisma.recruitment.count.mockResolvedValue(1)

      const response = await request(app).get('/api/recruitments?status=OPEN')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.items).toHaveLength(1)
      expect(response.body.data.items[0].title).toBe('テスト募集1')
      expect(response.body.data.pagination).toBeDefined()
    })
  })

  describe('GET /api/recruitments/:id', () => {
    it('should return recruitment details', async () => {
      const mockRecruitment = {
        id: 'recruitment-1',
        title: 'テスト募集1',
        description: '説明1',
        datetime: new Date('2024-01-15T10:00:00Z'),
        datetimeFlex: null,
        area: 'SHIBUYA',
        location: '渋谷駅周辺',
        latitude: 35.658,
        longitude: 139.701,
        locationName: '渋谷駅',
        minPeople: 2,
        maxPeople: 5,
        status: 'OPEN',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        creatorId: 'user-1',
        creator: {
          id: 'user-1',
          nickname: 'テストユーザー',
          avatarUrl: null,
          bio: 'テスト',
          area: 'SHIBUYA',
        },
        category: {
          id: 'category-1',
          name: 'カフェ',
          icon: 'coffee',
        },
        applications: [],
        group: null,
      }

      mockPrisma.recruitment.findUnique.mockResolvedValue(mockRecruitment)
      mockPrisma.application.findUnique.mockResolvedValue(null)
      mockPrisma.offer.findUnique.mockResolvedValue(null)

      const response = await request(app).get('/api/recruitments/recruitment-1')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe('recruitment-1')
      expect(response.body.data.title).toBe('テスト募集1')
    })

    it('should return 404 if recruitment not found', async () => {
      mockPrisma.recruitment.findUnique.mockResolvedValue(null)

      const response = await request(app).get('/api/recruitments/non-existent')

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('NOT_FOUND')
    })
  })

  describe('POST /api/recruitments', () => {
    it('should create a new recruitment', async () => {
      const mockCategory = { id: 'category-1', name: 'カフェ', icon: 'coffee' }
      const mockCreatedRecruitment = {
        id: 'new-recruitment-1',
        title: '新規募集',
        description: '新しい募集です',
        datetime: new Date('2024-02-01T10:00:00Z'),
        datetimeFlex: null,
        area: 'SHIBUYA',
        location: '渋谷',
        latitude: 35.658,
        longitude: 139.701,
        locationName: '渋谷駅',
        minPeople: 2,
        maxPeople: 4,
        status: 'OPEN',
        createdAt: new Date(),
        category: mockCategory,
      }

      mockPrisma.category.findUnique.mockResolvedValue(mockCategory)
      mockPrisma.recruitment.create.mockResolvedValue(mockCreatedRecruitment)

      const response = await request(app)
        .post('/api/recruitments')
        .send({
          title: '新規募集',
          categoryId: 'category-1',
          description: '新しい募集です',
          datetime: '2024-02-01T10:00:00Z',
          area: 'SHIBUYA',
          location: '渋谷',
          minPeople: 2,
          maxPeople: 4,
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe('新規募集')
    })

    it('should return 400 if category is invalid', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null)

      const response = await request(app)
        .post('/api/recruitments')
        .send({
          title: '新規募集',
          categoryId: 'invalid-category',
          description: '新しい募集です',
          area: 'SHIBUYA',
          minPeople: 2,
          maxPeople: 4,
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('INVALID_CATEGORY')
    })
  })

  describe('DELETE /api/recruitments/:id', () => {
    it('should cancel recruitment if owner', async () => {
      const mockRecruitment = {
        id: 'recruitment-1',
        creatorId: testUser.id,
        status: 'OPEN',
      }

      mockPrisma.recruitment.findUnique.mockResolvedValue(mockRecruitment)
      mockPrisma.recruitment.update.mockResolvedValue({ ...mockRecruitment, status: 'CANCELLED' })

      const response = await request(app).delete('/api/recruitments/recruitment-1')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should return 403 if not owner', async () => {
      const mockRecruitment = {
        id: 'recruitment-1',
        creatorId: 'other-user-id',
        status: 'OPEN',
      }

      mockPrisma.recruitment.findUnique.mockResolvedValue(mockRecruitment)

      const response = await request(app).delete('/api/recruitments/recruitment-1')

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('FORBIDDEN')
    })
  })

  describe('POST /api/recruitments/:id/apply', () => {
    it('should create application for recruitment', async () => {
      const mockRecruitment = {
        id: 'recruitment-1',
        title: 'テスト募集',
        creatorId: 'other-user-id',
        status: 'OPEN',
        maxPeople: 5,
        _count: { applications: 1 },
      }

      const mockApplication = {
        id: 'application-1',
        status: 'PENDING',
        message: '参加希望です',
        createdAt: new Date(),
      }

      mockPrisma.recruitment.findUnique.mockResolvedValue(mockRecruitment)
      mockPrisma.application.findUnique.mockResolvedValue(null)
      mockPrisma.application.create.mockResolvedValue(mockApplication)

      const response = await request(app)
        .post('/api/recruitments/recruitment-1/apply')
        .send({ message: '参加希望です' })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('PENDING')
    })

    it('should return 400 if applying to own recruitment', async () => {
      const mockRecruitment = {
        id: 'recruitment-1',
        creatorId: testUser.id,
        status: 'OPEN',
        maxPeople: 5,
        _count: { applications: 1 },
      }

      mockPrisma.recruitment.findUnique.mockResolvedValue(mockRecruitment)

      const response = await request(app)
        .post('/api/recruitments/recruitment-1/apply')
        .send({ message: '参加希望です' })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('SELF_APPLICATION')
    })

    it('should return 400 if recruitment is closed', async () => {
      const mockRecruitment = {
        id: 'recruitment-1',
        creatorId: 'other-user-id',
        status: 'CLOSED',
        maxPeople: 5,
        _count: { applications: 1 },
      }

      mockPrisma.recruitment.findUnique.mockResolvedValue(mockRecruitment)

      const response = await request(app)
        .post('/api/recruitments/recruitment-1/apply')
        .send({ message: '参加希望です' })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('RECRUITMENT_CLOSED')
    })
  })
})
