import type {
  Area,
  Timing,
  WantToDoStatus,
  RecruitmentStatus,
  ApplicationStatus,
  OfferStatus,
  GroupMemberRole,
  NotificationType,
} from '../constants'

// ============================================
// ユーザー
// ============================================

export interface User {
  id: string
  email: string
  name?: string | null
  nickname: string
  avatarUrl?: string | null
  bio?: string | null
  area: Area
  createdAt: string
  updatedAt: string
}

export interface UserWithCategories extends User {
  categories: Category[]
}

// ============================================
// カテゴリ
// ============================================

export interface Category {
  id: string
  name: string
  icon: string
  sortOrder: number
}

// ============================================
// やりたいこと表明
// ============================================

export interface WantToDo {
  id: string
  userId: string
  categoryId: string
  timing: Timing
  comment?: string | null
  status: WantToDoStatus
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface WantToDoWithCategory extends WantToDo {
  category: Category
}

export interface WantToDoWithUser extends WantToDo {
  user: User
  category: Category
}

// ============================================
// 募集
// ============================================

export interface Recruitment {
  id: string
  creatorId: string
  categoryId: string
  title: string
  description?: string | null
  datetime?: string | null
  datetimeFlex?: string | null
  area: Area
  location?: string | null
  minPeople: number
  maxPeople: number
  status: RecruitmentStatus
  createdAt: string
  updatedAt: string
  closedAt?: string | null
}

export interface RecruitmentWithDetails extends Recruitment {
  creator: User
  category: Category
  currentPeople: number
}

// ============================================
// 参加申請
// ============================================

export interface Application {
  id: string
  recruitmentId: string
  applicantId: string
  status: ApplicationStatus
  message?: string | null
  createdAt: string
  respondedAt?: string | null
}

export interface ApplicationWithDetails extends Application {
  applicant: User
  recruitment: RecruitmentWithDetails
}

// ============================================
// オファー
// ============================================

export interface Offer {
  id: string
  recruitmentId: string
  senderId: string
  receiverId: string
  status: OfferStatus
  message?: string | null
  createdAt: string
  respondedAt?: string | null
}

export interface OfferWithDetails extends Offer {
  sender: User
  receiver: User
  recruitment: RecruitmentWithDetails
}

// ============================================
// グループ
// ============================================

export interface Group {
  id: string
  recruitmentId: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface GroupMember {
  id: string
  groupId: string
  userId: string
  role: GroupMemberRole
  joinedAt: string
}

export interface GroupWithDetails extends Group {
  recruitment: Recruitment
  members: (GroupMember & { user: User })[]
  lastMessage?: Message | null
  unreadCount?: number
}

// ============================================
// メッセージ
// ============================================

export interface Message {
  id: string
  groupId: string
  senderId: string
  content: string
  createdAt: string
}

export interface MessageWithSender extends Message {
  sender: User
}

// ============================================
// 通知
// ============================================

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  data?: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}

// ============================================
// API レスポンス
// ============================================

export interface ApiResponse<T> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
}

export interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================
// マッチング
// ============================================

export interface UserSuggestion {
  user: User
  score: number
  hasActiveWantToDo: boolean
  wantToDo?: WantToDoWithCategory | null
  matchedCategories: string[]
  /** 「今すぐ」対応可能（TODAY タイミングのやりたいことあり） */
  isAvailableNow?: boolean
  /** 過去にマッチングした相手かどうか */
  isPastMatch?: boolean
  /** 過去のマッチング回数 */
  matchCount?: number
  /** 同じカテゴリでのマッチング回数 */
  sameCategoryMatchCount?: number
}

// ============================================
// リピートマッチング
// ============================================

export interface PastMatchUser {
  user: {
    id: string
    nickname: string | null
    avatarUrl: string | null
    bio: string | null
    area: string | null
  }
  matchCount: number
  lastMatchedAt: string
  categories: string[]
  lastRecruitment: {
    id: string
    title: string
    datetime: string | null
    category: Category
  }
}

// ============================================
// Nearby（地図表示用）
// ============================================

export interface NearbyItemBase {
  id: string
  latitude: number
  longitude: number
  distance?: number
  category: {
    id: string
    name: string
    icon: string
  }
  createdAt: string
}

export interface NearbyRecruitment extends NearbyItemBase {
  type: 'recruitment'
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
  /** 自分が参加中（オーナーまたは承認済み参加者）かどうか */
  isParticipating?: boolean
  /** 参加中の場合のグループID */
  groupId?: string | null
}

export interface NearbyWantToDo extends NearbyItemBase {
  type: 'wantToDo'
  timing: string
  comment?: string | null
  locationName?: string | null
  user: {
    id: string
    nickname: string | null
    avatarUrl: string | null
    area?: string | null
  }
}

export type NearbyItem = NearbyRecruitment | NearbyWantToDo

export interface NearbyResponse {
  items: NearbyItem[]
  center: { lat: number; lng: number }
  radius: number
  total: number
}

export interface NearbyBoundsResponse {
  items: NearbyItem[]
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
  total: number
}

// ============================================
// レビュー（イベント後の相互評価）
// ============================================

export interface Review {
  id: string
  groupId: string
  reviewerId: string
  revieweeId: string
  rating: number
  comment?: string | null
  isAnonymous: boolean
  createdAt: string
  updatedAt: string
}

export interface ReviewWithDetails extends Review {
  reviewer: Pick<User, 'id' | 'nickname' | 'avatarUrl'>
  reviewee: Pick<User, 'id' | 'nickname' | 'avatarUrl'>
  group: Pick<Group, 'id' | 'name'>
}

export interface UserReviewSummary {
  userId: string
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

export interface ReviewableUser {
  userId: string
  nickname: string | null
  avatarUrl: string | null
  alreadyReviewed: boolean
  existingReviewId?: string | null
}
