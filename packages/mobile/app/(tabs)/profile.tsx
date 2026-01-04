import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuthStore } from '@/stores/auth'
import { colors, spacing } from '@/constants/theme'

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore()

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>プロフィール</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* アバター */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.nickname?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.nickname}>
            {user?.nickname || 'ニックネーム未設定'}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* プロフィール情報 */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>エリア</Text>
            <Text style={styles.infoValue}>
              {user?.area === 'TOKYO' ? '東京' : user?.area === 'SENDAI' ? '仙台' : '未設定'}
            </Text>
          </View>
          <View style={[styles.infoRow, styles.lastInfoRow]}>
            <Text style={styles.infoLabel}>自己紹介</Text>
            <Text style={styles.infoValue} numberOfLines={3}>
              {user?.bio || '未設定'}
            </Text>
          </View>
        </View>

        {/* 興味カテゴリ */}
        {user?.interests && user.interests.length > 0 && (
          <View style={styles.interestsSection}>
            <Text style={styles.sectionTitle}>興味のあるカテゴリ</Text>
            <View style={styles.interestsList}>
              {user.interests.map((interest) => (
                <View key={interest.id} style={styles.interestChip}>
                  <Text style={styles.interestIcon}>{interest.icon}</Text>
                  <Text style={styles.interestName}>{interest.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* アクション */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/profile/edit')}
          >
            <Text style={styles.editButtonText}>プロフィールを編集</Text>
          </TouchableOpacity>
        </View>

        {/* 設定メニュー */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('実装予定', '通知設定は今後実装されます')}
          >
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuText}>通知設定</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('実装予定', 'ヘルプは今後実装されます')}
          >
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={styles.menuText}>ヘルプ</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('実装予定', '利用規約は今後実装されます')}
          >
            <Text style={styles.menuIcon}>📄</Text>
            <Text style={styles.menuText}>利用規約</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.lastMenuItem]}
            onPress={() => Alert.alert('実装予定', 'プライバシーポリシーは今後実装されます')}
          >
            <Text style={styles.menuIcon}>🔒</Text>
            <Text style={styles.menuText}>プライバシーポリシー</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ログアウト */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>ログアウト</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.white,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
  },
  nickname: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: 14,
    color: colors.gray[500],
  },
  infoSection: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  infoRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  lastInfoRow: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: 16,
    color: colors.gray[900],
  },
  interestsSection: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 16,
  },
  interestIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  interestName: {
    fontSize: 13,
    color: colors.primary[700],
  },
  actions: {
    padding: spacing.md,
  },
  editButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  editButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[900],
  },
  menuArrow: {
    fontSize: 18,
    color: colors.gray[400],
  },
  logoutSection: {
    padding: spacing.md,
  },
  logoutButton: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: colors.error[500],
    fontSize: 16,
  },
})
