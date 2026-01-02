import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useAuthStore } from '@/stores/auth'

// スプラッシュスクリーンを表示したまま維持
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false)
  const { checkSession, isLoading } = useAuthStore()

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

  if (!isReady || isLoading) {
    return null
  }

  return (
    <>
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
      </Stack>
    </>
  )
}
