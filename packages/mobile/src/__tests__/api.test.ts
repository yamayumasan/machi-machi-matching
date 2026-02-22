import { AxiosError } from 'axios'
import { ErrorCodes, getErrorCode, getErrorMessage, isRetryableError } from '../services/api'

// Axiosエラーを作成するヘルパー関数
function createAxiosError(
  status?: number,
  code?: string,
  data?: { message?: string; error?: string }
): AxiosError {
  const error = new Error('Test error') as AxiosError
  error.isAxiosError = true
  error.code = code

  if (status) {
    error.response = {
      status,
      statusText: 'Error',
      headers: {},
      config: {} as any,
      data: data || {},
    }
  }

  return error
}

describe('API Error Handling', () => {
  describe('getErrorCode', () => {
    it('should return UNKNOWN for non-Axios errors', () => {
      const error = new Error('Regular error')
      expect(getErrorCode(error)).toBe(ErrorCodes.UNKNOWN)
    })

    it('should return TIMEOUT for ECONNABORTED', () => {
      const error = createAxiosError(undefined, 'ECONNABORTED')
      expect(getErrorCode(error)).toBe(ErrorCodes.TIMEOUT)
    })

    it('should return NETWORK_ERROR for no response', () => {
      const error = createAxiosError()
      expect(getErrorCode(error)).toBe(ErrorCodes.NETWORK_ERROR)
    })

    it('should return UNAUTHORIZED for 401', () => {
      const error = createAxiosError(401)
      expect(getErrorCode(error)).toBe(ErrorCodes.UNAUTHORIZED)
    })

    it('should return NOT_FOUND for 404', () => {
      const error = createAxiosError(404)
      expect(getErrorCode(error)).toBe(ErrorCodes.NOT_FOUND)
    })

    it('should return SERVER_ERROR for 5xx', () => {
      expect(getErrorCode(createAxiosError(500))).toBe(ErrorCodes.SERVER_ERROR)
      expect(getErrorCode(createAxiosError(502))).toBe(ErrorCodes.SERVER_ERROR)
      expect(getErrorCode(createAxiosError(503))).toBe(ErrorCodes.SERVER_ERROR)
    })

    it('should return UNKNOWN for other status codes', () => {
      expect(getErrorCode(createAxiosError(400))).toBe(ErrorCodes.UNKNOWN)
      expect(getErrorCode(createAxiosError(403))).toBe(ErrorCodes.UNKNOWN)
    })
  })

  describe('getErrorMessage', () => {
    it('should return timeout message for ECONNABORTED', () => {
      const error = createAxiosError(undefined, 'ECONNABORTED')
      expect(getErrorMessage(error)).toBe('リクエストがタイムアウトしました。もう一度お試しください。')
    })

    it('should return network error message for no response', () => {
      const error = createAxiosError()
      expect(getErrorMessage(error)).toBe('ネットワークに接続できません。接続を確認してください。')
    })

    it('should return server message if available', () => {
      const error = createAxiosError(400, undefined, { message: 'カスタムエラーメッセージ' })
      expect(getErrorMessage(error)).toBe('カスタムエラーメッセージ')
    })

    it('should return server error field if message not available', () => {
      const error = createAxiosError(400, undefined, { error: 'エラー詳細' })
      expect(getErrorMessage(error)).toBe('エラー詳細')
    })

    it('should return 401 message for unauthorized', () => {
      const error = createAxiosError(401)
      expect(getErrorMessage(error)).toBe('認証が必要です。再度ログインしてください。')
    })

    it('should return 403 message for forbidden', () => {
      const error = createAxiosError(403)
      expect(getErrorMessage(error)).toBe('この操作を行う権限がありません。')
    })

    it('should return 404 message for not found', () => {
      const error = createAxiosError(404)
      expect(getErrorMessage(error)).toBe('リソースが見つかりませんでした。')
    })

    it('should return 5xx message for server error', () => {
      const error = createAxiosError(500)
      expect(getErrorMessage(error)).toBe('サーバーエラーが発生しました。しばらくしてからお試しください。')
    })

    it('should return error message for regular Error', () => {
      const error = new Error('Something went wrong')
      expect(getErrorMessage(error)).toBe('Something went wrong')
    })

    it('should return default message for unknown error', () => {
      expect(getErrorMessage(null)).toBe('エラーが発生しました')
      expect(getErrorMessage(undefined)).toBe('エラーが発生しました')
      expect(getErrorMessage('string error')).toBe('エラーが発生しました')
    })
  })

  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      const error = createAxiosError()
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for timeout errors', () => {
      const error = createAxiosError(undefined, 'ECONNABORTED')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return true for server errors', () => {
      expect(isRetryableError(createAxiosError(500))).toBe(true)
      expect(isRetryableError(createAxiosError(502))).toBe(true)
      expect(isRetryableError(createAxiosError(503))).toBe(true)
    })

    it('should return false for client errors', () => {
      expect(isRetryableError(createAxiosError(400))).toBe(false)
      expect(isRetryableError(createAxiosError(401))).toBe(false)
      expect(isRetryableError(createAxiosError(404))).toBe(false)
    })

    it('should return false for non-Axios errors', () => {
      expect(isRetryableError(new Error('test'))).toBe(false)
    })
  })
})
