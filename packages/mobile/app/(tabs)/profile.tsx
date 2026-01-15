import { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuthStore } from '@/stores/auth'
import { useWantToDoStore } from '@/stores/wantToDo'
import { colors, spacing } from '@/constants/theme'
import { CategoryIcon } from '@/components/CategoryIcon'
import { WantToDoCreateModal } from '@/components/WantToDoCreateModal'
import { WantToDoEditModal } from '@/components/WantToDoEditModal'
import { WantToDo } from '@/services/wantToDo'

const TIMING_LABELS: Record<string, string> = {
  TODAY: '今日まで',
  THIS_WEEK: '今週中',
  THIS_MONTH: '今月中',
  ANYTIME: '無期限',
}

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore()
  const { wantToDos, isLoading, fetchWantToDos } = useWantToDoStore()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedWantToDo, setSelectedWantToDo] = useState<WantToDo | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // 初期読み込み
  useEffect(() => {
    fetchWantToDos()
  }, [fetchWantToDos])

  // プルダウンリフレッシュ
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchWantToDos()
    setRefreshing(false)
  }, [fetchWantToDos])

  // 編集モーダルを開く
  const handleEditWantToDo = (wantToDo: WantToDo) => {
    setSelectedWantToDo(wantToDo)
    setShowEditModal(true)
  }

  // 登録済みカテゴリIDリスト
  const registeredCategoryIds = wantToDos.map((w) => w.categoryId)

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

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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

          {/* プロフィール編集ボタン */}
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => router.push('/profile/edit')}
          >
            <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.primary[600]} />
            <Text style={styles.editProfileButtonText}>プロフィールを編集</Text>
          </TouchableOpacity>
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
                  <CategoryIcon name={interest.icon} size={14} color={colors.primary[700]} />
                  <Text style={styles.interestName}>{interest.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 誘われ待ちステータス */}
        <View style={styles.wantToDoSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>誘われ待ちステータス</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowCreateModal(true)}
            >
              <MaterialCommunityIcons name="plus" size={18} color={colors.accent[600]} />
              <Text style={styles.addButtonText}>追加</Text>
            </TouchableOpacity>
          </View>

          {wantToDos.length === 0 ? (
            <View style={styles.emptyWantToDo}>
              <MaterialCommunityIcons
                name="hand-wave-outline"
                size={32}
                color={colors.primary[300]}
              />
              <Text style={styles.emptyWantToDoText}>
                誘われ待ちを登録すると{'\n'}周辺のユーザーに表示されます
              </Text>
              <TouchableOpacity
                style={styles.emptyWantToDoButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.emptyWantToDoButtonText}>誘われ待ちを追加</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.wantToDoList}>
              {wantToDos.map((wantToDo) => (
                <TouchableOpacity
                  key={wantToDo.id}
                  style={styles.wantToDoItem}
                  onPress={() => handleEditWantToDo(wantToDo)}
                >
                  <View style={styles.wantToDoIcon}>
                    <CategoryIcon
                      name={wantToDo.category.icon}
                      size={20}
                      color={colors.accent[600]}
                    />
                  </View>
                  <View style={styles.wantToDoInfo}>
                    <Text style={styles.wantToDoCategory}>{wantToDo.category.name}</Text>
                    <Text style={styles.wantToDoTiming}>
                      {TIMING_LABELS[wantToDo.timing] || wantToDo.timing}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="pencil-outline"
                    size={18}
                    color={colors.primary[400]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 設定メニュー */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('実装予定', '通知設定は今後実装されます')}
          >
            <MaterialCommunityIcons name="bell-outline" size={20} color={colors.gray[600]} style={styles.menuIcon} />
            <Text style={styles.menuText}>通知設定</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('実装予定', 'ヘルプは今後実装されます')}
          >
            <MaterialCommunityIcons name="help-circle-outline" size={20} color={colors.gray[600]} style={styles.menuIcon} />
            <Text style={styles.menuText}>ヘルプ</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('実装予定', '利用規約は今後実装されます')}
          >
            <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.gray[600]} style={styles.menuIcon} />
            <Text style={styles.menuText}>利用規約</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.lastMenuItem]}
            onPress={() => Alert.alert('実装予定', 'プライバシーポリシーは今後実装されます')}
          >
            <MaterialCommunityIcons name="shield-lock-outline" size={20} color={colors.gray[600]} style={styles.menuIcon} />
            <Text style={styles.menuText}>プライバシーポリシー</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray[400]} />
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

      {/* 作成モーダル */}
      <WantToDoCreateModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => fetchWantToDos()}
        excludeCategoryIds={registeredCategoryIds}
      />

      {/* 編集モーダル */}
      <WantToDoEditModal
        visible={showEditModal}
        wantToDo={selectedWantToDo}
        onClose={() => {
          setShowEditModal(false)
          setSelectedWantToDo(null)
        }}
        onSuccess={() => fetchWantToDos()}
        onDelete={() => fetchWantToDos()}
      />
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
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: 20,
    gap: 6,
  },
  editProfileButtonText: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '500',
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
    gap: 4,
  },
  interestName: {
    fontSize: 13,
    color: colors.primary[700],
  },
  // 誘われ待ちセクション
  wantToDoSection: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent[50],
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 16,
    gap: 4,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.accent[600],
  },
  emptyWantToDo: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyWantToDoText: {
    fontSize: 14,
    color: colors.primary[400],
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  emptyWantToDoButton: {
    backgroundColor: colors.accent[600],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
  },
  emptyWantToDoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  wantToDoList: {
    gap: spacing.sm,
  },
  wantToDoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    padding: spacing.md,
    borderRadius: 12,
  },
  wantToDoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  wantToDoInfo: {
    flex: 1,
  },
  wantToDoCategory: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary[900],
    marginBottom: 2,
  },
  wantToDoTiming: {
    fontSize: 12,
    color: colors.primary[500],
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
