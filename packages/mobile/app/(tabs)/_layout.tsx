import { Redirect, Tabs } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '@/stores/auth'
import { colors, fontSize, fontWeight } from '@/constants/theme'

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

  // デザインガイドライン v2 準拠のタブバー
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary[600], // ガイドライン準拠: プライマリCTA
        tabBarInactiveTintColor: colors.neutral[400], // ガイドライン準拠: プレースホルダー
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.neutral[200], // ガイドライン準拠: neutral系ボーダー
          backgroundColor: colors.white,
          paddingTop: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs - 1,
          fontWeight: fontWeight.medium,
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
