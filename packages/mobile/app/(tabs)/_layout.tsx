import { Redirect, Tabs } from 'expo-router'
import { Text } from 'react-native'
import { useAuthStore } from '@/stores/auth'
import { colors } from '@/constants/theme'

export default function TabLayout() {
  const { user, isOnboarded } = useAuthStore()

  // 未ログインの場合
  if (!user) {
    return <Redirect href="/(auth)/login" />
  }

  // オンボーディング未完了の場合
  if (!isOnboarded) {
    return <Redirect href="/onboarding" />
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.gray[400],
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.gray[200],
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color }) => <TabIcon icon="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '探す',
          tabBarIcon: ({ color }) => <TabIcon icon="search" color={color} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'グループ',
          tabBarIcon: ({ color }) => <TabIcon icon="group" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'プロフィール',
          tabBarIcon: ({ color }) => <TabIcon icon="profile" color={color} />,
        }}
      />
    </Tabs>
  )
}

// シンプルなテキストアイコン（後で適切なアイコンライブラリに置き換え）
function TabIcon({ icon, color }: { icon: string; color: string }) {
  const icons: Record<string, string> = {
    home: '🏠',
    search: '🔍',
    group: '👥',
    profile: '👤',
  }
  return <Text style={{ fontSize: 20 }}>{icons[icon]}</Text>
}
