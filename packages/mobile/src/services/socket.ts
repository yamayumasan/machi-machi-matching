import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'
import { useGroupStore } from '@/stores/group'
import { Message } from './group'

// Socket.IOはAPIのルートに接続（/api パスを除去）
const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '')

let socket: Socket | null = null

// Socket.IOの接続
export function connectSocket(): void {
  const { session } = useAuthStore.getState()

  if (!session?.access_token) {
    console.log('No session token, skipping socket connection')
    return
  }

  if (socket?.connected) {
    console.log('Socket already connected')
    return
  }

  socket = io(API_BASE, {
    auth: {
      token: session.access_token,
    },
    transports: ['websocket'],
    autoConnect: true,
  })

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message)
  })

  // 新しいメッセージを受信
  socket.on('message:new', (message: Message) => {
    console.log('New message received:', message)
    const { currentGroup, addMessage } = useGroupStore.getState()

    // 現在表示中のグループのメッセージのみ追加
    if (currentGroup?.id === message.groupId) {
      addMessage(message)
    }
  })

  // メンバー参加通知
  socket.on('member:joined', (data: { groupId: string; member: any }) => {
    console.log('Member joined:', data)
    const { currentGroup, fetchGroup } = useGroupStore.getState()

    // 現在表示中のグループの場合、グループ情報を再取得
    if (currentGroup?.id === data.groupId) {
      fetchGroup(data.groupId)
    }
  })
}

// Socket.IOの切断
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
    console.log('Socket disconnected manually')
  }
}

// グループに参加（ルーム参加）
export function joinGroup(groupId: string): void {
  if (socket?.connected) {
    socket.emit('group:join', groupId)
    console.log('Joined group room:', groupId)
  }
}

// グループを退出（ルーム退出）
export function leaveGroup(groupId: string): void {
  if (socket?.connected) {
    socket.emit('group:leave', groupId)
    console.log('Left group room:', groupId)
  }
}

// メッセージをソケット経由で送信
export function emitMessage(groupId: string, content: string): void {
  if (socket?.connected) {
    socket.emit('message:send', { groupId, content })
  }
}

// 接続状態を取得
export function isSocketConnected(): boolean {
  return socket?.connected ?? false
}

// ソケットインスタンスを取得（テスト用）
export function getSocket(): Socket | null {
  return socket
}
