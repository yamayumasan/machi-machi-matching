import { jest, beforeAll, afterAll, afterEach } from '@jest/globals'

// 環境変数の設定
process.env.NODE_ENV = 'test'
process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key'
process.env.SUPABASE_ANON_KEY = 'test-anon-key'

// Prismaモック型定義
interface MockPrismaClient {
  recruitment: {
    findMany: jest.Mock
    findUnique: jest.Mock
    create: jest.Mock
    update: jest.Mock
    count: jest.Mock
    delete: jest.Mock
  }
  category: {
    findMany: jest.Mock
    findUnique: jest.Mock
  }
  application: {
    findUnique: jest.Mock
    findMany: jest.Mock
    create: jest.Mock
    update: jest.Mock
    delete: jest.Mock
  }
  offer: {
    findUnique: jest.Mock
    findMany: jest.Mock
    create: jest.Mock
    update: jest.Mock
  }
  user: {
    findUnique: jest.Mock
    findMany: jest.Mock
    update: jest.Mock
  }
  userBlock: {
    findMany: jest.Mock
  }
  group: {
    findUnique: jest.Mock
    findMany: jest.Mock
    create: jest.Mock
  }
  groupMember: {
    findMany: jest.Mock
    create: jest.Mock
  }
  $transaction: jest.Mock
}

// Prismaモック - グローバルに設定（prisma.tsでglobal.prismaを使用しているため）
const mockPrisma: MockPrismaClient = {
  recruitment: {
    findMany: jest.fn<() => Promise<unknown>>(),
    findUnique: jest.fn<() => Promise<unknown>>(),
    create: jest.fn<() => Promise<unknown>>(),
    update: jest.fn<() => Promise<unknown>>(),
    count: jest.fn<() => Promise<number>>(),
    delete: jest.fn<() => Promise<unknown>>(),
  },
  category: {
    findMany: jest.fn<() => Promise<unknown>>(),
    findUnique: jest.fn<() => Promise<unknown>>(),
  },
  application: {
    findUnique: jest.fn<() => Promise<unknown>>(),
    findMany: jest.fn<() => Promise<unknown>>(),
    create: jest.fn<() => Promise<unknown>>(),
    update: jest.fn<() => Promise<unknown>>(),
    delete: jest.fn<() => Promise<unknown>>(),
  },
  offer: {
    findUnique: jest.fn<() => Promise<unknown>>(),
    findMany: jest.fn<() => Promise<unknown>>(),
    create: jest.fn<() => Promise<unknown>>(),
    update: jest.fn<() => Promise<unknown>>(),
  },
  user: {
    findUnique: jest.fn<() => Promise<unknown>>(),
    findMany: jest.fn<() => Promise<unknown>>(),
    update: jest.fn<() => Promise<unknown>>(),
  },
  userBlock: {
    findMany: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
  },
  group: {
    findUnique: jest.fn<() => Promise<unknown>>(),
    findMany: jest.fn<() => Promise<unknown>>(),
    create: jest.fn<() => Promise<unknown>>(),
  },
  groupMember: {
    findMany: jest.fn<() => Promise<unknown>>(),
    create: jest.fn<() => Promise<unknown>>(),
  },
  $transaction: jest.fn(),
}

// $transactionの実装を設定（eslint-disable-next-line）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(mockPrisma.$transaction as any).mockImplementation(async (fn: (tx: MockPrismaClient) => Promise<unknown>) => {
  return fn(mockPrisma)
})

// globalにprismaを設定（モジュール読み込み前に設定される）
;(global as Record<string, unknown>).prisma = mockPrisma

// モックをエクスポートしてテストファイルからアクセス可能にする
export { mockPrisma }

// グローバルタイムアウト設定（jest.config.jsのtestTimeoutで設定済み）

beforeAll(() => {
  // テスト開始前の共通処理
})

afterAll(() => {
  // テスト終了後の共通処理
})

afterEach(() => {
  // 各テスト後にモックをリセット
  jest.clearAllMocks()
})
