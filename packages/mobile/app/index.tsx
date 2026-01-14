import { Redirect } from 'expo-router'
import { useAuthStore } from '@/stores/auth'

export default function Index() {
  const { user, isOnboarded } = useAuthStore()

  // 未ログインの場合
  if (!user) {
    return <Redirect href="/(auth)/login" />
  }

  // オンボーディング未完了の場合
  if (!isOnboarded) {
    return <Redirect href="/onboarding" />
  }

  // ログイン済み & オンボーディング完了
  return <Redirect href="/(tabs)" />
}
