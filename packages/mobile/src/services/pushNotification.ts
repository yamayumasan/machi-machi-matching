import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { api } from './api'

// 通知の表示設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

// プッシュトークンを取得
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null

  // 実機のみプッシュ通知を使用
  if (!Device.isDevice) {
    console.log('Push notifications are only available on physical devices')
    return null
  }

  // Android用チャンネル設定
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2D6A4F',
    })
  }

  // 通知の権限確認と取得
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification')
    return null
  }

  try {
    // Expo Push Tokenを取得
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
    if (!projectId) {
      console.log('No project ID found for push notifications')
      return null
    }

    const tokenResult = await Notifications.getExpoPushTokenAsync({
      projectId,
    })
    token = tokenResult.data
    console.log('Push token:', token)
  } catch (error) {
    console.error('Error getting push token:', error)
    return null
  }

  return token
}

// プッシュトークンをサーバーに登録
export async function registerPushTokenToServer(token: string): Promise<void> {
  try {
    await api.post('/users/push-token', {
      token,
      platform: Platform.OS,
    })
    console.log('Push token registered to server')
  } catch (error) {
    console.error('Failed to register push token:', error)
  }
}

// プッシュトークンをサーバーから削除（ログアウト時）
export async function unregisterPushToken(): Promise<void> {
  try {
    await api.delete('/users/push-token')
    console.log('Push token unregistered from server')
  } catch (error) {
    console.error('Failed to unregister push token:', error)
  }
}

// 通知リスナーの設定
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback)
}

// 通知タップ時のリスナー設定
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback)
}

// 最後に受信した通知レスポンスを取得
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return await Notifications.getLastNotificationResponseAsync()
}

// バッジ数を設定
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count)
}

// バッジ数を取得
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync()
}

// Subscription型をエクスポート
export type NotificationSubscription = Notifications.Subscription
