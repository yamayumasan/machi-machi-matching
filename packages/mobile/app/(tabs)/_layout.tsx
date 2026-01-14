import { Redirect, Tabs } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/auth'
import { colors } from '@/constants/theme'

type IconName = 'map-marker-radius' | 'account-group' | 'account'

const TAB_ICONS: Record<string, IconName> = {
  map: 'map-marker-radius',
  group: 'account-group',
  profile: 'account',
}

export default function TabLayout() {
  const { user, isOnboarded } = useAuthStore()

  // 未ログインの場合
  if (!user) {
    return <Redirect href="/(auth)/login" />
  }

  // オンボーディング未完了の場合
  if (!isOnboarded) {
    return <Redirect href={"/onboarding" as "/notifications"} />
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary[900],
        tabBarInactiveTintColor: colors.gray[400],
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.gray[200],
          backgroundColor: colors.white,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'マップ',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name={TAB_ICONS.map} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'グループ',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name={TAB_ICONS.group} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'マイページ',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name={TAB_ICONS.profile} size={size} color={color} />
          ),
        }}
      />
      {/* 探すタブは非表示（ホームに統合） */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // タブバーから非表示
        }}
      />
    </Tabs>
  )
}
