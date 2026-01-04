import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuthStore } from '@/stores/auth'
import { useWantToDoStore } from '@/stores/wantToDo'
import { useNotificationStore } from '@/stores/notification'
import { useCategoryStore } from '@/stores/category'
import { colors, spacing } from '@/constants/theme'
import { WantToDo, WantToDoTiming } from '@/services/wantToDo'

const TIMING_LABELS: Record<WantToDoTiming, string> = {
  THIS_WEEK: '今週',
  NEXT_WEEK: '来週',
  THIS_MONTH: '今月中',
  ANYTIME: 'いつでも',
}

export default function HomeScreen() {
  const { user } = useAuthStore()
  const { wantToDos, isLoading, fetchWantToDos } = useWantToDoStore()
  const { unreadCount, fetchNotifications } = useNotificationStore()
  const { categories, fetchCategories } = useCategoryStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchWantToDos()
    fetchNotifications()
    fetchCategories()
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchWantToDos(), fetchNotifications()])
    setRefreshing(false)
  }

  const activeWantToDos = wantToDos.filter((w) => w.status === 'ACTIVE')

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
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* やりたいことセクション */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>今やりたいこと</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(true)}>
              <Text style={styles.addButton}>+ 追加</Text>
            </TouchableOpacity>
          </View>

          {isLoading && activeWantToDos.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary[500]} />
            </View>
          ) : activeWantToDos.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.wantToDoScroll}
            >
              {activeWantToDos.map((wantToDo) => (
                <WantToDoCard key={wantToDo.id} wantToDo={wantToDo} />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.wantToDoContainer}>
              <Text style={styles.emptyText}>
                やりたいことを表明してみましょう
              </Text>
              <TouchableOpacity
                style={styles.addWantToDoButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.addWantToDoButtonText}>+ 表明する</Text>
              </TouchableOpacity>
            </View>
          )}
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

      {/* やりたいこと作成モーダル */}
      <CreateWantToDoModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        categories={categories}
      />
    </SafeAreaView>
  )
}

// やりたいことカード
function WantToDoCard({ wantToDo }: { wantToDo: WantToDo }) {
  const daysLeft = Math.ceil(
    (new Date(wantToDo.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <View style={styles.wantToDoCard}>
      <Text style={styles.wantToDoIcon}>{wantToDo.category.icon}</Text>
      <Text style={styles.wantToDoName}>{wantToDo.category.name}</Text>
      <Text style={styles.wantToDoTiming}>
        {TIMING_LABELS[wantToDo.timing]}
      </Text>
      <Text style={styles.wantToDoExpiry}>あと{daysLeft}日</Text>
    </View>
  )
}

// やりたいこと作成モーダル
function CreateWantToDoModal({
  visible,
  onClose,
  categories,
}: {
  visible: boolean
  onClose: () => void
  categories: { id: string; name: string; icon: string }[]
}) {
  const { addWantToDo } = useWantToDoStore()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTiming, setSelectedTiming] = useState<WantToDoTiming>('THIS_WEEK')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedCategory) return

    setIsSubmitting(true)
    try {
      await addWantToDo({
        categoryId: selectedCategory,
        timing: selectedTiming,
      })
      onClose()
      setSelectedCategory(null)
      setSelectedTiming('THIS_WEEK')
    } catch (error) {
      console.error('Failed to create want to do:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>やりたいことを表明</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalLabel}>何がしたい?</Text>
          <View style={styles.categoryGrid}>
            {categories.slice(0, 9).map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === category.id && styles.categoryItemSelected,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.modalLabel}>いつ頃?</Text>
          <View style={styles.timingGrid}>
            {(Object.keys(TIMING_LABELS) as WantToDoTiming[]).map((timing) => (
              <TouchableOpacity
                key={timing}
                style={[
                  styles.timingItem,
                  selectedTiming === timing && styles.timingItemSelected,
                ]}
                onPress={() => setSelectedTiming(timing)}
              >
                <Text
                  style={[
                    styles.timingText,
                    selectedTiming === timing && styles.timingTextSelected,
                  ]}
                >
                  {TIMING_LABELS[timing]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedCategory || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedCategory || isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? '送信中...' : '表明する'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    position: 'relative',
  },
  notificationIcon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary[500],
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
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
  loadingContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
  },
  wantToDoScroll: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
  },
  wantToDoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginRight: spacing.sm,
    width: 100,
    alignItems: 'center',
  },
  wantToDoIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  wantToDoName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  wantToDoTiming: {
    fontSize: 10,
    color: colors.gray[500],
  },
  wantToDoExpiry: {
    fontSize: 10,
    color: colors.primary[500],
    marginTop: 4,
  },
  wantToDoContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
  },
  addWantToDoButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
  },
  addWantToDoButtonText: {
    color: colors.primary[500],
    fontWeight: '600',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  modalClose: {
    fontSize: 20,
    color: colors.gray[500],
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryItemSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 11,
    color: colors.gray[700],
  },
  timingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  timingItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timingItemSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  timingText: {
    fontSize: 14,
    color: colors.gray[700],
  },
  timingTextSelected: {
    color: colors.primary[700],
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
})
