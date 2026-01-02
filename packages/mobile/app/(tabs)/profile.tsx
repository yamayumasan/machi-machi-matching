import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
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

      <View style={styles.content}>
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
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>自己紹介</Text>
            <Text style={styles.infoValue}>
              {user?.bio || '未設定'}
            </Text>
          </View>
        </View>

        {/* アクション */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>プロフィールを編集</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>ログアウト</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    padding: spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
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
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
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
  actions: {
    gap: spacing.md,
  },
  editButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  editButtonText: {
    color: colors.primary[500],
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: colors.gray[500],
    fontSize: 16,
  },
})
