import { z } from 'zod'
import {
  AREAS,
  TIMINGS,
  WANT_TO_DO_STATUSES,
  RECRUITMENT_STATUSES,
  APPLICATION_STATUSES,
  OFFER_STATUSES,
} from '../constants'

// ============================================
// 共通スキーマ
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// ============================================
// 認証スキーマ
// ============================================

export const signUpSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
})

export const signInSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
})

// ============================================
// ユーザースキーマ
// ============================================

export const updateUserSchema = z.object({
  nickname: z.string().min(1, 'ニックネームを入力してください').max(50).optional(),
  bio: z.string().max(500).optional().nullable(),
  area: z.enum([AREAS.TOKYO, AREAS.SENDAI]).optional(),
})

export const updateUserCategoriesSchema = z.object({
  categoryIds: z.array(z.string()).min(1, '少なくとも1つのカテゴリを選択してください'),
})

// ============================================
// やりたいこと表明スキーマ
// ============================================

export const createWantToDoSchema = z.object({
  categoryId: z.string().min(1, 'カテゴリを選択してください'),
  timing: z.enum([TIMINGS.THIS_WEEK, TIMINGS.NEXT_WEEK, TIMINGS.THIS_MONTH, TIMINGS.ANYTIME]),
  comment: z.string().max(200).optional().nullable(),
})

export const updateWantToDoSchema = z.object({
  timing: z
    .enum([TIMINGS.THIS_WEEK, TIMINGS.NEXT_WEEK, TIMINGS.THIS_MONTH, TIMINGS.ANYTIME])
    .optional(),
  comment: z.string().max(200).optional().nullable(),
})

// ============================================
// 募集スキーマ
// ============================================

export const createRecruitmentSchema = z.object({
  title: z.string().min(1, 'タイトルを入力してください').max(100),
  categoryId: z.string().min(1, 'カテゴリを選択してください'),
  description: z.string().max(1000).optional().nullable(),
  datetime: z.string().datetime().optional().nullable(),
  datetimeFlex: z.string().max(100).optional().nullable(),
  area: z.enum([AREAS.TOKYO, AREAS.SENDAI]),
  location: z.string().max(100).optional().nullable(),
  minPeople: z.number().int().positive().default(1),
  maxPeople: z.number().int().positive().max(100).default(10),
})

export const updateRecruitmentSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
  datetime: z.string().datetime().optional().nullable(),
  datetimeFlex: z.string().max(100).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  minPeople: z.number().int().positive().optional(),
  maxPeople: z.number().int().positive().max(100).optional(),
})

export const recruitmentQuerySchema = paginationSchema.extend({
  area: z.enum([AREAS.TOKYO, AREAS.SENDAI]).optional(),
  categoryId: z.string().optional(),
  status: z
    .enum([
      RECRUITMENT_STATUSES.OPEN,
      RECRUITMENT_STATUSES.CLOSED,
      RECRUITMENT_STATUSES.COMPLETED,
      RECRUITMENT_STATUSES.CANCELLED,
    ])
    .default(RECRUITMENT_STATUSES.OPEN),
})

// ============================================
// 参加申請スキーマ
// ============================================

export const createApplicationSchema = z.object({
  recruitmentId: z.string().min(1),
  message: z.string().max(500).optional().nullable(),
})

// ============================================
// オファースキーマ
// ============================================

export const createOfferSchema = z.object({
  recruitmentId: z.string().min(1),
  receiverId: z.string().min(1),
  message: z.string().max(500).optional().nullable(),
})

// ============================================
// メッセージスキーマ
// ============================================

export const createMessageSchema = z.object({
  content: z.string().min(1, 'メッセージを入力してください').max(2000),
})

// ============================================
// 型エクスポート
// ============================================

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UpdateUserCategoriesInput = z.infer<typeof updateUserCategoriesSchema>
export type CreateWantToDoInput = z.infer<typeof createWantToDoSchema>
export type UpdateWantToDoInput = z.infer<typeof updateWantToDoSchema>
export type CreateRecruitmentInput = z.infer<typeof createRecruitmentSchema>
export type UpdateRecruitmentInput = z.infer<typeof updateRecruitmentSchema>
export type RecruitmentQuery = z.infer<typeof recruitmentQuerySchema>
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>
export type CreateOfferInput = z.infer<typeof createOfferSchema>
export type CreateMessageInput = z.infer<typeof createMessageSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
