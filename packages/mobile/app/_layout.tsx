import { useEffect, useState, useRef } from 'react'
import { View, Alert, Platform, AppState, AppStateStatus } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import {
  requestTrackingPermissionsAsync,
  getTrackingPermissionsAsync,
} from 'expo-tracking-transparency'
import Constants from 'expo-constants'
import { useAuthStore } from '@/stores/auth'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useSocket } from '@/hooks/useSocket'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { ErrorProvider } from '@/contexts/ErrorContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { colors } from '@/constants/theme'

// Expo Go かどうかを判定
const isExpoGo = Constants.appOwnership === 'expo'

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
        // AdMob SDK初期化 - Expo Go または開発モードではスキップ
        // NOTE: ATTの結果がAdMobのトラッキング挙動に影響するため、
        //       SDK初期化はATT prompt表示より前で構わない（AdMobは内部でATT結果を見る）
        if (!isExpoGo && !__DEV__) {
          try {
            const mobileAds = (await import('react-native-google-mobile-ads')).default
            await mobileAds().initialize()
          } catch (e) {
            console.log('[Layout] AdMob initialization skipped:', e)
          }
        }

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

  // ATT許可リクエスト（iOS 14.5+）
  // Apple仕様: アプリ状態がactiveでないとダイアログは表示されない。
  // splash中(=inactive)に呼ぶとiOSが即denyして返すため、splash後・active時に実行する。
  useEffect(() => {
    if (Platform.OS !== 'ios' || isExpoGo) return
    if (!isReady || isLoading) return

    let cancelled = false

    const requestATT = async () => {
      try {
        // 既に判定済みなら何もしない（notDetermined 以外）
        const { status } = await getTrackingPermissionsAsync()
        if (cancelled || status !== 'undetermined') return

        // 現在 active なら即実行、そうでなければ active になるまで待つ
        if (AppState.currentState === 'active') {
          await requestTrackingPermissionsAsync()
          return
        }

        const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
          if (next === 'active') {
            sub.remove()
            if (!cancelled) {
              try {
                await requestTrackingPermissionsAsync()
              } catch (e) {
                console.log('[Layout] ATT request failed:', e)
              }
            }
          }
        })
      } catch (e) {
        console.log('[Layout] ATT request skipped:', e)
      }
    }

    requestATT()
    return () => {
      cancelled = true
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
          // 画面遷移アニメーション設定（デザインガイドライン準拠: 300ms ease-out）
          animation: 'slide_from_right',
          animationDuration: 300,
          // ヘッダースタイル
          headerStyle: {
            backgroundColor: colors.white,
          },
          headerTintColor: colors.primary[600],
          headerTitleStyle: {
            fontWeight: '600',
            color: colors.neutral[800],
          },
          // コンテンツスタイル
          contentStyle: {
            backgroundColor: colors.background,
          },
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
      <ToastProvider>
        <RootLayoutNav />
      </ToastProvider>
    </ErrorProvider>
  )
}
