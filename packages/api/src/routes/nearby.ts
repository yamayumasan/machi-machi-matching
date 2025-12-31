import { Router } from 'express'
import { requireAuth, requireOnboarding } from '../middlewares/auth'
import { prisma } from '../lib/prisma'
import { z } from 'zod'

const router = Router()

// クエリパラメータのバリデーションスキーマ
const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(50000).default(5000), // メートル
  categoryIds: z.union([z.string(), z.array(z.string())]).optional(),
  types: z.enum(['all', 'recruitment', 'wantToDo']).default('all'),
  limit: z.coerce.number().min(1).max(100).default(50),
})

// 2点間の距離を計算（Haversine formula）
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000 // 地球の半径（メートル）
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// 緯度経度からバウンディングボックスを計算
const getBoundingBox = (lat: number, lng: number, radiusMeters: number) => {
  const latDelta = (radiusMeters / 111320) // 1度あたり約111.32km
  const lngDelta = radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180))

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  }
}

// GET /api/nearby - 周辺の募集・表明を取得
router.get('/', requireAuth, requireOnboarding, async (req, res, next) => {
  try {
    const query = nearbyQuerySchema.parse(req.query)
    const { lat, lng, radius, types, limit } = query

    // カテゴリIDの配列化
    let categoryIds: string[] | undefined
    if (query.categoryIds) {
      categoryIds = Array.isArray(query.categoryIds) ? query.categoryIds : [query.categoryIds]
    }

    const bounds = getBoundingBox(lat, lng, radius)

    const results: Array<{
      id: string
      type: 'recruitment' | 'wantToDo'
      latitude: number
      longitude: number
      distance: number
      // 募集用フィールド
      title?: string
      description?: string | null
      datetime?: Date | null
      datetimeFlex?: string | null
      location?: string | null
      locationName?: string | null
      currentPeople?: number
      maxPeople?: number
      creator?: {
        id: string
        nickname: string | null
        avatarUrl: string | null
      }
      // 表明用フィールド
      timing?: string
      comment?: string | null
      user?: {
        id: string
        nickname: string | null
        avatarUrl: string | null
        area: string | null
      }
      // 共通
      category: {
        id: string
        name: string
        icon: string
      }
      createdAt: Date
    }> = []

    // 募集を取得
    if (types === 'all' || types === 'recruitment') {
      const recruitments = await prisma.recruitment.findMany({
        where: {
          status: 'OPEN',
          latitude: { not: null, gte: bounds.minLat, lte: bounds.maxLat },
          longitude: { not: null, gte: bounds.minLng, lte: bounds.maxLng },
          ...(categoryIds && categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {}),
        },
        include: {
          creator: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
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
        take: limit * 2, // 距離フィルタ後に足りなくならないよう多めに取得
      })

      for (const r of recruitments) {
        if (r.latitude === null || r.longitude === null) continue

        const distance = calculateDistance(lat, lng, r.latitude, r.longitude)
        if (distance <= radius) {
          results.push({
            id: r.id,
            type: 'recruitment',
            latitude: r.latitude,
            longitude: r.longitude,
            distance,
            title: r.title,
            description: r.description,
            datetime: r.datetime,
            datetimeFlex: r.datetimeFlex,
            location: r.location,
            locationName: r.locationName,
            currentPeople: r._count.applications + 1,
            maxPeople: r.maxPeople,
            creator: r.creator,
            category: r.category,
            createdAt: r.createdAt,
          })
        }
      }
    }

    // 表明を取得
    if (types === 'all' || types === 'wantToDo') {
      const wantToDos = await prisma.wantToDo.findMany({
        where: {
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
          userId: { not: req.user!.id }, // 自分の表明は除外
          latitude: { not: null, gte: bounds.minLat, lte: bounds.maxLat },
          longitude: { not: null, gte: bounds.minLng, lte: bounds.maxLng },
          ...(categoryIds && categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {}),
        },
        include: {
          user: {
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
        },
        take: limit * 2,
      })

      for (const w of wantToDos) {
        if (w.latitude === null || w.longitude === null) continue

        const distance = calculateDistance(lat, lng, w.latitude, w.longitude)
        if (distance <= radius) {
          results.push({
            id: w.id,
            type: 'wantToDo',
            latitude: w.latitude,
            longitude: w.longitude,
            distance,
            timing: w.timing,
            comment: w.comment,
            locationName: w.locationName,
            user: w.user,
            category: w.category,
            createdAt: w.createdAt,
          })
        }
      }
    }

    // 距離順にソートしてlimit件を返す
    results.sort((a, b) => a.distance - b.distance)
    const limitedResults = results.slice(0, limit)

    res.json({
      success: true,
      data: {
        items: limitedResults,
        center: { lat, lng },
        radius,
        total: limitedResults.length,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors,
        },
      })
    }
    next(error)
  }
})

// GET /api/nearby/bounds - バウンディングボックス内の募集・表明を取得
router.get('/bounds', requireAuth, requireOnboarding, async (req, res, next) => {
  try {
    const boundsSchema = z.object({
      north: z.coerce.number().min(-90).max(90),
      south: z.coerce.number().min(-90).max(90),
      east: z.coerce.number().min(-180).max(180),
      west: z.coerce.number().min(-180).max(180),
      categoryIds: z.union([z.string(), z.array(z.string())]).optional(),
      types: z.enum(['all', 'recruitment', 'wantToDo']).default('all'),
      limit: z.coerce.number().min(1).max(200).default(100),
    })

    const query = boundsSchema.parse(req.query)
    const { north, south, east, west, types, limit } = query

    let categoryIds: string[] | undefined
    if (query.categoryIds) {
      categoryIds = Array.isArray(query.categoryIds) ? query.categoryIds : [query.categoryIds]
    }

    const results: Array<{
      id: string
      type: 'recruitment' | 'wantToDo'
      latitude: number
      longitude: number
      title?: string
      timing?: string
      category: {
        id: string
        name: string
        icon: string
      }
      creator?: { id: string; nickname: string | null; avatarUrl: string | null }
      user?: { id: string; nickname: string | null; avatarUrl: string | null }
      currentPeople?: number
      maxPeople?: number
      createdAt: Date
    }> = []

    // 募集を取得
    if (types === 'all' || types === 'recruitment') {
      const recruitments = await prisma.recruitment.findMany({
        where: {
          status: 'OPEN',
          latitude: { not: null, gte: south, lte: north },
          longitude: { not: null, gte: west, lte: east },
          ...(categoryIds && categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {}),
        },
        include: {
          creator: {
            select: { id: true, nickname: true, avatarUrl: true },
          },
          category: {
            select: { id: true, name: true, icon: true },
          },
          _count: {
            select: { applications: { where: { status: 'APPROVED' } } },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })

      for (const r of recruitments) {
        if (r.latitude === null || r.longitude === null) continue
        results.push({
          id: r.id,
          type: 'recruitment',
          latitude: r.latitude,
          longitude: r.longitude,
          title: r.title,
          category: r.category,
          creator: r.creator,
          currentPeople: r._count.applications + 1,
          maxPeople: r.maxPeople,
          createdAt: r.createdAt,
        })
      }
    }

    // 表明を取得
    if (types === 'all' || types === 'wantToDo') {
      const wantToDos = await prisma.wantToDo.findMany({
        where: {
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
          userId: { not: req.user!.id },
          latitude: { not: null, gte: south, lte: north },
          longitude: { not: null, gte: west, lte: east },
          ...(categoryIds && categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {}),
        },
        include: {
          user: {
            select: { id: true, nickname: true, avatarUrl: true },
          },
          category: {
            select: { id: true, name: true, icon: true },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })

      for (const w of wantToDos) {
        if (w.latitude === null || w.longitude === null) continue
        results.push({
          id: w.id,
          type: 'wantToDo',
          latitude: w.latitude,
          longitude: w.longitude,
          timing: w.timing,
          category: w.category,
          user: w.user,
          createdAt: w.createdAt,
        })
      }
    }

    res.json({
      success: true,
      data: {
        items: results,
        bounds: { north, south, east, west },
        total: results.length,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors,
        },
      })
    }
    next(error)
  }
})

export { router as nearbyRouter }
