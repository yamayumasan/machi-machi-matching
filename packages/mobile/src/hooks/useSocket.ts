import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { connectSocket, disconnectSocket } from '@/services/socket'

// アプリ全体でソケット接続を管理するフック
export function useSocket() {
  const { session, user } = useAuthStore()

  useEffect(() => {
    if (session && user) {
      // 認証済みの場合、ソケットに接続
      connectSocket()
    } else {
      // 未認証の場合、ソケットを切断
      disconnectSocket()
    }

    return () => {
      disconnectSocket()
    }
  }, [session, user])
}
