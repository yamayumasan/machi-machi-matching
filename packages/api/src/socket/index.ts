import { Server, Socket } from 'socket.io'

export const setupSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('🔌 Client connected:', socket.id)

    // グループに参加
    socket.on('join-group', ({ groupId }: { groupId: string }) => {
      socket.join(`group:${groupId}`)
      console.log(`Socket ${socket.id} joined group:${groupId}`)
    })

    // グループから離脱
    socket.on('leave-group', ({ groupId }: { groupId: string }) => {
      socket.leave(`group:${groupId}`)
      console.log(`Socket ${socket.id} left group:${groupId}`)
    })

    // メッセージ送信
    socket.on(
      'send-message',
      ({ groupId, content }: { groupId: string; content: string }) => {
        // TODO: メッセージをDBに保存
        // TODO: 送信者情報を取得

        const message = {
          id: `msg-${Date.now()}`,
          groupId,
          senderId: 'temp-user-id',
          content,
          createdAt: new Date().toISOString(),
          sender: {
            id: 'temp-user-id',
            nickname: 'テストユーザー',
            avatarUrl: null,
          },
        }

        io.to(`group:${groupId}`).emit('new-message', { message })
      }
    )

    // 入力中通知
    socket.on('typing-start', ({ groupId }: { groupId: string }) => {
      socket.to(`group:${groupId}`).emit('user-typing', {
        userId: 'temp-user-id',
        nickname: 'テストユーザー',
      })
    })

    socket.on('typing-end', ({ groupId }: { groupId: string }) => {
      socket.to(`group:${groupId}`).emit('user-stop-typing', {
        userId: 'temp-user-id',
      })
    })

    // 切断
    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id)
    })
  })
}
