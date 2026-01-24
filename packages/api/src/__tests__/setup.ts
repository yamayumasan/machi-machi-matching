// 環境変数の設定
process.env.NODE_ENV = 'test'
process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key'
process.env.SUPABASE_ANON_KEY = 'test-anon-key'

// グローバルタイムアウト設定
jest.setTimeout(30000)

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
