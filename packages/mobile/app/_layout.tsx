import { useEffect, useState, useRef } from 'react'
import { View, Alert } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useAuthStore } from '@/stores/auth'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useSocket } from '@/hooks/useSocket'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { ErrorProvider } from '@/contexts/ErrorContext'

// スプラッシュスクリーンを表示したまま維持
SplashScreen.preventAutoHideAsync()

function RootLayoutNav() {
  const [isReady, setIsReady] = useState(false)
  const { checkSession, isLoading } = useAuthStore()
  const { isOffline } = useNetworkStatus()
  const wasOfflineRef = useRef(false)

  // プッシュ通知の初期化
  usePushNotifications()

  // ソケット接続の初期化
  useSocket()

  useEffect(() => {
    async function prepare() {
      try {
        // 認証状態をチェック
        await checkSession()
      } catch (e) {
        console.warn(e)
      } finally {
        setIsReady(true)
      }
    }

    prepare()
  }, [])

  useEffect(() => {
    if (isReady && !isLoading) {
      SplashScreen.hideAsync()
    }
  }, [isReady, isLoading])

  // ネットワーク状態の変化を監視
  useEffect(() => {
    if (isOffline && !wasOfflineRef.current) {
      Alert.alert(
        'ネットワークエラー',
        'インターネット接続が切断されました。一部の機能が利用できない場合があります。',
        [{ text: 'OK' }]
      )
    } else if (!isOffline && wasOfflineRef.current) {
      Alert.alert(
        '接続回復',
        'インターネット接続が回復しました。',
        [{ text: 'OK' }]
      )
    }
    wasOfflineRef.current = isOffline
  }, [isOffline])

  if (!isReady || isLoading) {
    return null
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="recruitment/[id]"
          options={{
            headerShown: true,
            title: '募集詳細',
          }}
        />
        <Stack.Screen
          name="group/[id]"
          options={{
            headerShown: true,
            title: 'グループ',
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            headerShown: true,
            title: '通知',
          }}
        />
        <Stack.Screen
          name="privacy"
          options={{
            headerShown: true,
            title: 'プライバシーポリシー',
          }}
        />
        <Stack.Screen
          name="terms"
          options={{
            headerShown: true,
            title: '利用規約',
          }}
        />
        <Stack.Screen
          name="auth/callback"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </View>
  )
}

export default function RootLayout() {
  return (
    <ErrorProvider>
      <RootLayoutNav />
    </ErrorProvider>
  )
}
