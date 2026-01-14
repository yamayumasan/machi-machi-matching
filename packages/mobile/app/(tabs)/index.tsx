import { useEffect, useRef, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Animated,
  PanResponder,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useAuthStore } from '@/stores/auth'
import { useNearbyStore } from '@/stores/nearby'
import { useNotificationStore } from '@/stores/notification'
import { useCategoryStore } from '@/stores/category'
import { NearbyItem, NearbyFilterType } from '@/services/nearby'

import { NearbyMap, NearbyMapRef } from '@/components/NearbyMap'
import { NearbyItemCard } from '@/components/NearbyItemCard'
import { FilterTabs } from '@/components/FilterTabs'
import type { FilterType } from '@/components/FilterTabs'
import { RecruitmentDetailModal } from '@/components/RecruitmentDetailModal'
import { WantToDoDetailModal } from '@/components/WantToDoDetailModal'
import { NearbyWantToDo, NearbyRecruitment } from '@/services/nearby'
import { colors, spacing } from '@/constants/theme'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const MIN_LIST_HEIGHT = 220
const MAX_LIST_HEIGHT = SCREEN_HEIGHT * 0.6
const ITEM_HEIGHT = 80 // NearbyItemCardの高さ（概算）

// FilterType から NearbyFilterType への変換
const filterTypeToNearbyFilterType = (filterType: FilterType): NearbyFilterType => {
  if (filterType === 'participating') return 'all'
  return filterType as NearbyFilterType
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const {
    selectedItem,
    isLoading,
    selectItem,
    setFilterType: setStoreFilterType,
    getFilteredItems,
  } = useNearbyStore()
  const { unreadCount, fetchNotifications } = useNotificationStore()
  const { fetchCategories } = useCategoryStore()

  const [filterType, setFilterType] = useState<FilterType>('all')

  // モーダル用状態
  const [selectedRecruitment, setSelectedRecruitment] = useState<NearbyRecruitment | null>(null)
  const [selectedWantToDo, setSelectedWantToDo] = useState<NearbyWantToDo | null>(null)

  // マップへの参照
  const mapRef = useRef<NearbyMapRef>(null)

  // リストへの参照（スクロール用）
  const scrollViewRef = useRef<ScrollView>(null)

  // リスト高さのアニメーション（React Native標準Animated API）
  const listHeightAnim = useRef(new Animated.Value(MIN_LIST_HEIGHT)).current
  const listHeightRef = useRef(MIN_LIST_HEIGHT)

  // FABの位置をリスト高さに連動
  const fabBottomAnim = Animated.add(listHeightAnim, spacing.md)

  useEffect(() => {
    fetchNotifications()
    fetchCategories()
  }, [])

  // フィルタータイプが変わったらストアも更新
  const handleFilterChange = useCallback((newFilterType: FilterType) => {
    setFilterType(newFilterType)
    setStoreFilterType(filterTypeToNearbyFilterType(newFilterType))
  }, [setStoreFilterType])

  // フィルタリングされたアイテム（ストアから取得）
  const filteredItems = getFilteredItems().filter((item) => {
    // 「参加中」フィルター
    if (filterType === 'participating') {
      return item.type === 'recruitment' && item.isParticipating
    }
    return true
  })

  // マップからアイテム選択時（マーカークリック）→ リストをスクロール
  const handleMapItemSelect = useCallback((item: NearbyItem | null) => {
    selectItem(item)

    if (item) {
      // 該当アイテムのインデックスを探してスクロール
      const index = filteredItems.findIndex(
        (i) => i.id === item.id && i.type === item.type
      )
      if (index >= 0 && scrollViewRef.current) {
        // 少し遅延してスクロール（レンダリング完了後）
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: index * ITEM_HEIGHT,
            animated: true,
          })
        }, 100)
      }
    }
  }, [selectItem, filteredItems])

  // リストからカードをタップ時 → マップをフォーカス
  const handleListItemPress = useCallback((item: NearbyItem) => {
    // マップにフォーカス
    mapRef.current?.focusOnItem(item)
    selectItem(item)
  }, [selectItem])

  // カード長押し時 → 詳細モーダル表示
  const handleCardLongPress = useCallback((item: NearbyItem) => {
    if (item.type === 'recruitment') {
      setSelectedRecruitment(item as NearbyRecruitment)
    } else if (item.type === 'wantToDo') {
      setSelectedWantToDo(item as NearbyWantToDo)
    }
  }, [])

  // カードダブルタップまたは詳細ボタン押下時 → 詳細モーダル表示
  const handleOpenDetail = useCallback((item: NearbyItem) => {
    if (item.type === 'recruitment') {
      setSelectedRecruitment(item as NearbyRecruitment)
    } else if (item.type === 'wantToDo') {
      setSelectedWantToDo(item as NearbyWantToDo)
    }
  }, [])

  // PanResponderでドラッグを処理
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newHeight = listHeightRef.current - gestureState.dy
        const clampedHeight = Math.max(MIN_LIST_HEIGHT, Math.min(MAX_LIST_HEIGHT, newHeight))
        listHeightAnim.setValue(clampedHeight)
      },
      onPanResponderRelease: (_, gestureState) => {
        const newHeight = listHeightRef.current - gestureState.dy
        const clampedHeight = Math.max(MIN_LIST_HEIGHT, Math.min(MAX_LIST_HEIGHT, newHeight))

        // スナップポイント
        const velocity = gestureState.vy
        let targetHeight: number

        if (Math.abs(velocity) > 0.5) {
          // 速度が高い場合
          targetHeight = velocity > 0 ? MIN_LIST_HEIGHT : MAX_LIST_HEIGHT
        } else {
          // 中間位置へスナップ
          const mid = (MIN_LIST_HEIGHT + MAX_LIST_HEIGHT) / 2
          targetHeight = clampedHeight > mid ? MAX_LIST_HEIGHT : MIN_LIST_HEIGHT
        }

        listHeightRef.current = targetHeight
        Animated.spring(listHeightAnim, {
          toValue: targetHeight,
          useNativeDriver: false,
          friction: 8,
        }).start()
      },
    })
  ).current

  // FAB押下時 → 募集作成画面へ直接遷移
  const handleFABPress = () => {
    router.push('/recruitment/create')
  }

  return (
    <View style={styles.container}>
      {/* マップ */}
      <View style={styles.mapContainer}>
        <NearbyMap
          ref={mapRef}
          onItemSelect={handleMapItemSelect}
          topOffset={insets.top + spacing.sm}
        />
      </View>

      {/* フローティングヘッダー（右上のみ） */}
      <View style={[styles.floatingHeader, { top: insets.top + spacing.sm }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/notifications')}
        >
          <MaterialCommunityIcons name="bell-outline" size={22} color={colors.primary[700]} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <View style={styles.avatarPlaceholder}>
            {user?.nickname ? (
              <Text style={styles.avatarText}>
                {user.nickname.charAt(0)}
              </Text>
            ) : (
              <MaterialCommunityIcons name="account" size={20} color={colors.primary[600]} />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* ボトムリスト */}
      <Animated.View style={[styles.bottomList, { height: listHeightAnim }]}>
        {/* ドラッグハンドル */}
        <View {...panResponder.panHandlers} style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* フィルタータブ */}
        <FilterTabs
          value={filterType}
          onChange={handleFilterChange}
        />

        {/* リスト */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading && filteredItems.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary[500]} />
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {filterType === 'participating'
                  ? '参加中の募集がありません'
                  : 'この周辺には募集がありません'}
              </Text>
              <Text style={styles.emptySubText}>
                マップを移動して探してみてください
              </Text>
            </View>
          ) : (
            filteredItems.slice(0, 20).map((item, index) => (
              <NearbyItemCard
                key={`${item.type}-${item.id}`}
                item={item}
                onPress={() => handleListItemPress(item)}
                onLongPress={() => handleOpenDetail(item)}
                isSelected={selectedItem?.id === item.id && selectedItem?.type === item.type}
                compact
                showDistance
              />
            ))
          )}
        </ScrollView>
      </Animated.View>

      {/* FAB */}
      <Animated.View style={[styles.fab, { bottom: fabBottomAnim }]}>
        <TouchableOpacity
          style={styles.fabTouchable}
          onPress={handleFABPress}
        >
          <MaterialCommunityIcons name="plus" size={28} color={colors.white} />
        </TouchableOpacity>
      </Animated.View>

      {/* 募集詳細モーダル */}
      <RecruitmentDetailModal
        visible={!!selectedRecruitment}
        recruitmentId={selectedRecruitment?.id || null}
        onClose={() => setSelectedRecruitment(null)}
      />

      {/* やりたいこと詳細モーダル */}
      <WantToDoDetailModal
        visible={!!selectedWantToDo}
        wantToDo={selectedWantToDo}
        onClose={() => setSelectedWantToDo(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[100],
  },
  mapContainer: {
    flex: 1,
  },

  // Floating Header
  floatingHeader: {
    position: 'absolute',
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    zIndex: 100,
  },
  headerButton: {
    backgroundColor: colors.white,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.accent[600],
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
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    color: colors.primary[600],
  },

  // Bottom List
  bottomList: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.primary[300],
    borderRadius: 2,
  },
  listContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: 14,
    color: colors.primary[500],
    marginBottom: spacing.xs,
  },
  emptySubText: {
    fontSize: 12,
    color: colors.primary[400],
  },

  // FAB
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent[600],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
