import { Server, Socket } from 'socket.io'
import { supabase } from '../lib/supabase'
import { prisma } from '../lib/prisma'

interface AuthenticatedSocket extends Socket {
  userId?: string
  userNickname?: string
  userAvatarUrl?: string | null
}

export const setupSocket = (io: Server) => {
  // 認証ミドルウェア
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token

      if (!token) {
        return next(new Error('Authentication required'))
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token)

      if (error || !user) {
        return next(new Error('Invalid token'))
      }

      // ユーザー情報を取得
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          nickname: true,
          avatarUrl: true,
        },
      })

      if (!dbUser) {
        return next(new Error('User not found'))
      }

      socket.userId = dbUser.id
      socket.userNickname = dbUser.nickname || 'Unknown'
      socket.userAvatarUrl = dbUser.avatarUrl

      next()
    } catch (error) {
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🔌 Client connected: ${socket.id} (User: ${socket.userId})`)

    // グループに参加
    socket.on('join-group', async ({ groupId }: { groupId: string }) => {
      try {
        // メンバーかチェック
        const membership = await prisma.groupMember.findUnique({
          where: {
            groupId_userId: {
              groupId,
              userId: socket.userId!,
            },
          },
        })

        if (!membership) {
          socket.emit('error', { message: 'Not a member of this group' })
          return
        }

        socket.join(`group:${groupId}`)
        console.log(`Socket ${socket.id} joined group:${groupId}`)

        // 他のメンバーに通知
        socket.to(`group:${groupId}`).emit('user-joined', {
          userId: socket.userId,
          nickname: socket.userNickname,
        })
      } catch (error) {
        console.error('Error joining group:', error)
        socket.emit('error', { message: 'Failed to join group' })
      }
    })

    // グループから離脱
    socket.on('leave-group', ({ groupId }: { groupId: string }) => {
      socket.leave(`group:${groupId}`)
      console.log(`Socket ${socket.id} left group:${groupId}`)

      socket.to(`group:${groupId}`).emit('user-left', {
        userId: socket.userId,
        nickname: socket.userNickname,
      })
    })

    // メッセージ送信
    socket.on('send-message', async ({ groupId, content }: { groupId: string; content: string }) => {
      try {
        // メンバーかチェック
        const membership = await prisma.groupMember.findUnique({
          where: {
            groupId_userId: {
              groupId,
              userId: socket.userId!,
            },
          },
        })

        if (!membership) {
          socket.emit('error', { message: 'Not a member of this group' })
          return
        }

        // メッセージをDBに保存
        const message = await prisma.message.create({
          data: {
            groupId,
            senderId: socket.userId!,
            content,
          },
        })

        // グループの更新日時を更新
        await prisma.group.update({
          where: { id: groupId },
          data: { updatedAt: new Date() },
        })

        const messageData = {
          id: message.id,
          groupId,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          sender: {
            id: socket.userId!,
            nickname: socket.userNickname,
            avatarUrl: socket.userAvatarUrl,
          },
        }

        // グループ全体に送信
        io.to(`group:${groupId}`).emit('new-message', { message: messageData })
      } catch (error) {
        console.error('Error sending message:', error)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // 入力中通知
    socket.on('typing-start', ({ groupId }: { groupId: string }) => {
      socket.to(`group:${groupId}`).emit('user-typing', {
        userId: socket.userId,
        nickname: socket.userNickname,
      })
    })

    socket.on('typing-end', ({ groupId }: { groupId: string }) => {
      socket.to(`group:${groupId}`).emit('user-stop-typing', {
        userId: socket.userId,
      })
    })

    // 切断
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id} (User: ${socket.userId})`)
    })
  })
}
