import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuthStore } from '@/stores/auth'
import { colors, spacing } from '@/constants/theme'

export default function HomeScreen() {
  const { user } = useAuthStore()

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>マチマチマッチング</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push('/notifications')}
        >
          <Text style={styles.notificationIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* やりたいことセクション */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>今やりたいこと</Text>
            <TouchableOpacity>
              <Text style={styles.addButton}>+ 追加</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.wantToDoContainer}>
            <Text style={styles.emptyText}>
              やりたいことを表明してみましょう
            </Text>
          </View>
        </View>

        {/* アクションボタン */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/recruitment/create')}
          >
            <Text style={styles.actionButtonText}>募集を作成</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <Text style={styles.actionButtonTextSecondary}>募集を探す</Text>
          </TouchableOpacity>
        </View>

        {/* オファーセクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>あなたへのオファー</Text>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>オファーはありません</Text>
          </View>
        </View>

        {/* おすすめの募集セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>おすすめの募集</Text>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              近くの募集を見つけるには「探す」タブへ
            </Text>
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  notificationButton: {
    padding: spacing.xs,
  },
  notificationIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  addButton: {
    fontSize: 14,
    color: colors.primary[500],
    fontWeight: '600',
  },
  wantToDoContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: colors.primary[500],
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.gray[400],
    fontSize: 14,
  },
})
