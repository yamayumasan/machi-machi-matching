// エリア
export const AREAS = {
  TOKYO: 'TOKYO',
  SENDAI: 'SENDAI',
} as const

export type Area = (typeof AREAS)[keyof typeof AREAS]

export const AREA_LABELS: Record<Area, string> = {
  TOKYO: '東京',
  SENDAI: '仙台',
}

// 時期
export const TIMINGS = {
  THIS_WEEK: 'THIS_WEEK',
  NEXT_WEEK: 'NEXT_WEEK',
  THIS_MONTH: 'THIS_MONTH',
  ANYTIME: 'ANYTIME',
} as const

export type Timing = (typeof TIMINGS)[keyof typeof TIMINGS]

export const TIMING_LABELS: Record<Timing, string> = {
  THIS_WEEK: '今週',
  NEXT_WEEK: '来週',
  THIS_MONTH: '今月中',
  ANYTIME: 'いつでも',
}

// やりたいこと表明ステータス
export const WANT_TO_DO_STATUSES = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  DELETED: 'DELETED',
} as const

export type WantToDoStatus = (typeof WANT_TO_DO_STATUSES)[keyof typeof WANT_TO_DO_STATUSES]

// 募集ステータス
export const RECRUITMENT_STATUSES = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const

export type RecruitmentStatus = (typeof RECRUITMENT_STATUSES)[keyof typeof RECRUITMENT_STATUSES]

// 参加申請ステータス
export const APPLICATION_STATUSES = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[keyof typeof APPLICATION_STATUSES]

// オファーステータス
export const OFFER_STATUSES = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED',
} as const

export type OfferStatus = (typeof OFFER_STATUSES)[keyof typeof OFFER_STATUSES]

// グループメンバーロール
export const GROUP_MEMBER_ROLES = {
  OWNER: 'OWNER',
  MEMBER: 'MEMBER',
} as const

export type GroupMemberRole = (typeof GROUP_MEMBER_ROLES)[keyof typeof GROUP_MEMBER_ROLES]

// 通知タイプ
export const NOTIFICATION_TYPES = {
  APPLICATION_RECEIVED: 'APPLICATION_RECEIVED',
  APPLICATION_APPROVED: 'APPLICATION_APPROVED',
  APPLICATION_REJECTED: 'APPLICATION_REJECTED',
  OFFER_RECEIVED: 'OFFER_RECEIVED',
  OFFER_ACCEPTED: 'OFFER_ACCEPTED',
  OFFER_DECLINED: 'OFFER_DECLINED',
  RECRUITMENT_MATCH: 'RECRUITMENT_MATCH',
  GROUP_CREATED: 'GROUP_CREATED',
  NEW_MESSAGE: 'NEW_MESSAGE',
  MEMBER_JOINED: 'MEMBER_JOINED',
} as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES]

// カテゴリ
export const CATEGORIES = [
  { id: '1', name: 'ボードゲーム', icon: '🎲' },
  { id: '2', name: 'カフェ', icon: '☕' },
  { id: '3', name: '飲み会', icon: '🍺' },
  { id: '4', name: 'スポーツ', icon: '⚽' },
  { id: '5', name: 'ゲーム', icon: '🎮' },
  { id: '6', name: '映画', icon: '🎬' },
  { id: '7', name: '読書', icon: '📚' },
  { id: '8', name: '音楽', icon: '🎵' },
  { id: '9', name: 'ランニング', icon: '🏃' },
  { id: '10', name: '筋トレ', icon: '🏋️' },
  { id: '11', name: 'ヨガ', icon: '🧘' },
  { id: '12', name: 'カメラ', icon: '📷' },
  { id: '13', name: 'アート', icon: '🎨' },
  { id: '14', name: 'プログラミング', icon: '💻' },
  { id: '15', name: '勉強会', icon: '🗣️' },
] as const

// やりたいこと表明の有効期限（日数）
export const WANT_TO_DO_EXPIRATION_DAYS = 7

// ページネーションデフォルト
export const DEFAULT_PAGE_LIMIT = 20
export const MAX_PAGE_LIMIT = 100
