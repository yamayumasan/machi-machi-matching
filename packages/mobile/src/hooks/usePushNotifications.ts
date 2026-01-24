import { useEffect, useRef, useState } from 'react'
import { router } from 'expo-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import {
  registerForPushNotificationsAsync,
  registerPushTokenToServer,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  setBadgeCount,
  NotificationSubscription,
} from '@/services/pushNotification'

export function usePushNotifications() {
  const { user, session } = useAuthStore()
  const { addNotification, unreadCount } = useNotificationStore()
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const notificationListener = useRef<NotificationSubscription | undefined>(undefined)
  const responseListener = useRef<NotificationSubscription | undefined>(undefined)

  // プッシュトークンの登録
  useEffect(() => {
    if (!session || !user) return

    const setupPushNotifications = async () => {
      const token = await registerForPushNotificationsAsync()
      if (token) {
        setExpoPushToken(token)
        await registerPushTokenToServer(token)
      }
    }

    setupPushNotifications()
  }, [session, user])

  // 通知リスナーの設定
  useEffect(() => {
    // フォアグラウンドで通知を受信した時
    notificationListener.current = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification)

      // アプリ内通知ストアを更新
      const { title, body, data } = notification.request.content
      if (title && body) {
        addNotification({
          id: notification.request.identifier,
          userId: user?.id || '',
          type: (data?.type as any) || 'NEW_MESSAGE',
          title,
          body,
          data: data as Record<string, unknown> | null,
          isRead: false,
          createdAt: new Date().toISOString(),
        })
      }
    })

    // 通知をタップした時
    responseListener.current = addNotificationResponseListener((response) => {
      console.log('Notification tapped:', response)

      const data = response.notification.request.content.data
      handleNotificationNavigation(data)
    })

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove()
      }
      if (responseListener.current) {
        responseListener.current.remove()
      }
    }
  }, [user?.id])

  // バッジ数を同期
  useEffect(() => {
    setBadgeCount(unreadCount)
  }, [unreadCount])

  return {
    expoPushToken,
  }
}

// 通知タップ時のナビゲーション処理
function handleNotificationNavigation(data: any) {
  if (!data) return

  const { type, recruitmentId, groupId } = data

  switch (type) {
    case 'APPLICATION_RECEIVED':
    case 'APPLICATION_APPROVED':
    case 'APPLICATION_REJECTED':
    case 'OFFER_RECEIVED':
    case 'OFFER_ACCEPTED':
    case 'OFFER_DECLINED':
    case 'RECRUITMENT_MATCH':
      if (recruitmentId) {
        router.push(`/recruitment/${recruitmentId}`)
      }
      break

    case 'GROUP_CREATED':
    case 'NEW_MESSAGE':
    case 'MEMBER_JOINED':
      if (groupId) {
        router.push(`/group/${groupId}`)
      }
      break

    default:
      // デフォルトは通知一覧へ
      router.push('/notifications')
  }
}
