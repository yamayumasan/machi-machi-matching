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

// エリアの中心座標（デフォルト位置）
export const AREA_CENTER_COORDS: Record<Area, { latitude: number; longitude: number }> = {
  TOKYO: { latitude: 35.6812, longitude: 139.7671 }, // 東京駅
  SENDAI: { latitude: 38.2601, longitude: 140.8821 }, // 仙台駅
}

// 位置情報タイプ
export interface LocationData {
  latitude: number
  longitude: number
  locationName: string | null
}

// 主要駅・ランドマーク（ユーザー選択用）
export const LANDMARKS: Record<Area, Array<{ name: string; latitude: number; longitude: number }>> = {
  TOKYO: [
    { name: '東京駅', latitude: 35.6812, longitude: 139.7671 },
    { name: '渋谷駅', latitude: 35.6580, longitude: 139.7016 },
    { name: '新宿駅', latitude: 35.6896, longitude: 139.7006 },
    { name: '池袋駅', latitude: 35.7295, longitude: 139.7109 },
    { name: '品川駅', latitude: 35.6284, longitude: 139.7387 },
    { name: '上野駅', latitude: 35.7141, longitude: 139.7774 },
    { name: '秋葉原駅', latitude: 35.6984, longitude: 139.7731 },
    { name: '六本木駅', latitude: 35.6627, longitude: 139.7313 },
    { name: '表参道駅', latitude: 35.6654, longitude: 139.7122 },
    { name: '吉祥寺駅', latitude: 35.7032, longitude: 139.5796 },
  ],
  SENDAI: [
    { name: '仙台駅', latitude: 38.2601, longitude: 140.8821 },
    { name: '広瀬通駅', latitude: 38.2610, longitude: 140.8736 },
    { name: '勾当台公園駅', latitude: 38.2669, longitude: 140.8704 },
    { name: '北四番丁駅', latitude: 38.2728, longitude: 140.8682 },
    { name: '長町駅', latitude: 38.2305, longitude: 140.8799 },
    { name: '泉中央駅', latitude: 38.3251, longitude: 140.8810 },
    { name: '八乙女駅', latitude: 38.3136, longitude: 140.8792 },
    { name: '北仙台駅', latitude: 38.2780, longitude: 140.8717 },
    { name: '東照宮駅', latitude: 38.2825, longitude: 140.8813 },
    { name: '愛子駅', latitude: 38.2656, longitude: 140.7688 },
  ],
}

// 有効期限
export const TIMINGS = {
  TODAY: 'TODAY',
  THIS_WEEK: 'THIS_WEEK',
  THIS_MONTH: 'THIS_MONTH',
  ANYTIME: 'ANYTIME',
} as const

export type Timing = (typeof TIMINGS)[keyof typeof TIMINGS]

export const TIMING_LABELS: Record<Timing, string> = {
  TODAY: '今日まで',
  THIS_WEEK: '今週中',
  THIS_MONTH: '今月中',
  ANYTIME: '無期限',
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

// カテゴリ（iconはMDIアイコン名）
export const CATEGORIES = [
  { id: '1', name: 'ボードゲーム', icon: 'mdiDice6' },
  { id: '2', name: 'カフェ', icon: 'mdiCoffee' },
  { id: '3', name: '飲み会', icon: 'mdiGlassMugVariant' },
  { id: '4', name: 'スポーツ', icon: 'mdiSoccer' },
  { id: '5', name: 'ゲーム', icon: 'mdiGamepadVariant' },
  { id: '6', name: '映画', icon: 'mdiMovie' },
  { id: '7', name: '読書', icon: 'mdiBookOpenPageVariant' },
  { id: '8', name: '音楽', icon: 'mdiMusic' },
  { id: '9', name: 'ランニング', icon: 'mdiRun' },
  { id: '10', name: '筋トレ', icon: 'mdiWeightLifter' },
  { id: '11', name: 'ヨガ', icon: 'mdiYoga' },
  { id: '12', name: 'カメラ', icon: 'mdiCamera' },
  { id: '13', name: 'アート', icon: 'mdiPalette' },
  { id: '14', name: 'プログラミング', icon: 'mdiLaptop' },
  { id: '15', name: '勉強会', icon: 'mdiForum' },
] as const

// やりたいこと表明の有効期限（日数）
export const WANT_TO_DO_EXPIRATION_DAYS = 7

// ページネーションデフォルト
export const DEFAULT_PAGE_LIMIT = 20
export const MAX_PAGE_LIMIT = 100
