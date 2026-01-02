import { Redirect, Stack } from 'expo-router'
import { useAuthStore } from '@/stores/auth'

export default function AuthLayout() {
  const { user, isOnboarded } = useAuthStore()

  // ログイン済みの場合はリダイレクト
  if (user) {
    if (!isOnboarded) {
      return <Redirect href="/onboarding" />
    }
    return <Redirect href="/(tabs)" />
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  )
}
