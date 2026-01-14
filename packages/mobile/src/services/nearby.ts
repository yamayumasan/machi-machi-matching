import { api } from './api'

interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface NearbyCategory {
  id: string
  name: string
  icon: string
}

export interface NearbyRecruitment {
  id: string
  type: 'recruitment'
  latitude: number
  longitude: number
  distance?: number
  title: string
  description?: string | null
  datetime?: string | null
  datetimeFlex?: string | null
  location?: string | null
  locationName?: string | null
  currentPeople: number
  maxPeople: number
  creator: {
    id: string
    nickname: string | null
    avatarUrl: string | null
  }
  category: NearbyCategory
  createdAt: string
  isParticipating?: boolean
  groupId?: string | null
}

export interface NearbyWantToDo {
  id: string
  type: 'wantToDo'
  latitude: number
  longitude: number
  distance?: number
  timing: string
  comment?: string | null
  locationName?: string | null
  user: {
    id: string
    nickname: string | null
    avatarUrl: string | null
    area: string | null
  }
  category: NearbyCategory
  createdAt: string
}

export type NearbyItem = NearbyRecruitment | NearbyWantToDo

export interface NearbyResponse {
  items: NearbyItem[]
  center?: { lat: number; lng: number }
  bounds?: { north: number; south: number; east: number; west: number }
  radius?: number
  total: number
}

export type NearbyFilterType = 'all' | 'recruitment' | 'wantToDo'

// 周辺の募集・やりたいことを取得（中心座標 + 半径）
export const getNearby = async (params: {
  lat: number
  lng: number
  radius?: number
  types?: NearbyFilterType
  categoryIds?: string[]
  limit?: number
}): Promise<NearbyResponse> => {
  const queryParams: Record<string, string | number | string[]> = {
    lat: params.lat,
    lng: params.lng,
  }
  if (params.radius) queryParams.radius = params.radius
  if (params.types) queryParams.types = params.types
  if (params.categoryIds && params.categoryIds.length > 0) {
    queryParams.categoryIds = params.categoryIds
  }
  if (params.limit) queryParams.limit = params.limit

  const response = await api.get<ApiResponse<NearbyResponse>>('/nearby', { params: queryParams })
  return response.data.data
}

// バウンディングボックス内の募集・やりたいことを取得
export const getNearbyByBounds = async (params: {
  north: number
  south: number
  east: number
  west: number
  types?: NearbyFilterType
  categoryIds?: string[]
  limit?: number
}): Promise<NearbyResponse> => {
  const queryParams: Record<string, string | number | string[]> = {
    north: params.north,
    south: params.south,
    east: params.east,
    west: params.west,
  }
  if (params.types) queryParams.types = params.types
  if (params.categoryIds && params.categoryIds.length > 0) {
    queryParams.categoryIds = params.categoryIds
  }
  if (params.limit) queryParams.limit = params.limit

  const response = await api.get<ApiResponse<NearbyResponse>>('/nearby/bounds', { params: queryParams })
  return response.data.data
}
