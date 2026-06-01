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
  Pressable,
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
import { QuickCategoryFilter } from '@/components/QuickCategoryFilter'
import { RecruitmentDetailModal } from '@/components/RecruitmentDetailModal'
import { WantToDoDetailModal } from '@/components/WantToDoDetailModal'
import { NearbyWantToDo, NearbyRecruitment } from '@/services/nearby'
import { colors, spacing, borderRadius, shadows, fontSize, fontWeight } from '@/constants/theme'
import { AdBanner } from '@/components/AdBanner'
import { AD_UNIT_IDS } from '@/constants/ads'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

// 3段階スナップポイント
// PEEKはハンドル(~28) + FilterTabs(~52) + 余白を収める固定高
// 中途半端なリストカードが見えないようにする
const PEEK_HEIGHT = 96
const SNAP_POINTS = {
  PEEK: PEEK_HEIGHT,
  HALF: SCREEN_HEIGHT * 0.45,  // 45% - 中間、コンパクトカード
  FULL: SCREEN_HEIGHT * 0.85,  // 85% - 最大、通常カード
}

const ITEM_HEIGHT_COMPACT = 56 // コンパクトカードの高さ
const ITEM_HEIGHT_NORMAL = 120 // 通常カードの高さ

// FULL状態の閾値（この高さ以上で通常カード表示）
const FULL_THRESHOLD = SCREEN_HEIGHT * 0.6

// PEEK状態の閾値（この高さ未満でQuickCategoryFilterを隠す）
const PEEK_THRESHOLD = PEEK_HEIGHT + 40

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
    setSelectedCategories,
    selectedCategoryIds,
    getFilteredItems,
  } = useNearbyStore()
  const { unreadCount, fetchNotifications } = useNotificationStore()
  const { categories, fetchCategories } = useCategoryStore()

  const [filterType, setFilterType] = useState<FilterType>('all')

  // モーダル用状態
  const [selectedRecruitment, setSelectedRecruitment] = useState<NearbyRecruitment | null>(null)
  const [selectedWantToDo, setSelectedWantToDo] = useState<NearbyWantToDo | null>(null)

  // マップへの参照
  const mapRef = useRef<NearbyMapRef>(null)

  // リストへの参照（スクロール用）
  const scrollViewRef = useRef<ScrollView>(null)

  // リスト高さのアニメーション（React Native標準Animated API）
  const listHeightAnim = useRef(new Animated.Value(SNAP_POINTS.HALF)).current
  const listHeightRef = useRef(SNAP_POINTS.HALF)

  // リストのスクロール位置を追跡
  const scrollOffsetRef = useRef(0)
  const isScrollingRef = useRef(false)

  // 現在のカードサイズモード（高さに応じて変化）
  const [isFullMode, setIsFullMode] = useState(false)
  // PEEK状態判定（QuickCategoryFilterを隠すかどうか）
  const [isPeekMode, setIsPeekMode] = useState(false)

  // FABの位置をリスト高さに連動
  const fabBottomAnim = Animated.add(listHeightAnim, spacing.md)

  // FABのスケールアニメーション
  const fabScaleAnim = useRef(new Animated.Value(1)).current

  // FAB押下時のアニメーション
  // NOTE: FABはbottom（non-native）とtransform（native対応）を併用しているため
  // 同一コンポーネントではuseNativeDriverを統一する必要がある
  const handleFABPressIn = useCallback(() => {
    Animated.spring(fabScaleAnim, {
      toValue: 0.92,
      useNativeDriver: false, // bottomプロパティと同一Viewなのでfalseに統一
      friction: 8,
      tension: 100,
    }).start()
  }, [fabScaleAnim])

  const handleFABPressOut = useCallback(() => {
    Animated.spring(fabScaleAnim, {
      toValue: 1,
      useNativeDriver: false, // bottomプロパティと同一Viewなのでfalseに統一
      friction: 8,
      tension: 100,
    }).start()
  }, [fabScaleAnim])

  useEffect(() => {
    fetchNotifications()
    fetchCategories()
  }, [])

  // フィルタータイプが変わったらストアも更新
  const handleFilterChange = useCallback((newFilterType: FilterType) => {
    setFilterType(newFilterType)
    setStoreFilterType(filterTypeToNearbyFilterType(newFilterType))
  }, [setStoreFilterType])

  // カテゴリ選択ハンドラー
  const handleCategorySelect = useCallback((categoryId: string | null) => {
    if (categoryId === null) {
      setSelectedCategories([])
    } else {
      setSelectedCategories([categoryId])
    }
  }, [setSelectedCategories])

  // 現在選択中のカテゴリID（単一選択の場合）
  const selectedCategoryId = selectedCategoryIds.length > 0 ? selectedCategoryIds[0] : null

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
        const itemHeight = isFullMode ? ITEM_HEIGHT_NORMAL : ITEM_HEIGHT_COMPACT
        // 少し遅延してスクロール（レンダリング完了後）
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: index * itemHeight,
            animated: true,
          })
        }, 100)
      }
    }
  }, [selectItem, filteredItems, isFullMode])

  // リストからカードをタップ時 → マップをフォーカス
  const handleListItemPress = useCallback((item: NearbyItem) => {
    // マップにフォーカス（ボトムシートの高さを渡してオフセット計算）
    mapRef.current?.focusOnItem(item, listHeightRef.current)
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

  // 詳細ボタン押下時 → 専用画面に遷移（募集のみ）、やりたいことはモーダル
  const handleDetailPress = useCallback((item: NearbyItem) => {
    if (item.type === 'recruitment') {
      router.push(`/recruitment/${item.id}`)
    } else if (item.type === 'wantToDo') {
      setSelectedWantToDo(item as NearbyWantToDo)
    }
  }, [])

  // 最も近いスナップポイントを見つける
  const findNearestSnapPoint = useCallback((height: number): number => {
    const snapValues = [SNAP_POINTS.PEEK, SNAP_POINTS.HALF, SNAP_POINTS.FULL]
    let nearest = snapValues[0]
    let minDiff = Math.abs(height - nearest)

    for (const snap of snapValues) {
      const diff = Math.abs(height - snap)
      if (diff < minDiff) {
        minDiff = diff
        nearest = snap
      }
    }
    return nearest
  }, [])

  // 速度に基づいて次のスナップポイントを決定
  const getNextSnapPoint = useCallback((currentHeight: number, velocity: number): number => {
    const snapValues = [SNAP_POINTS.PEEK, SNAP_POINTS.HALF, SNAP_POINTS.FULL]

    // 高速フリックの場合
    if (Math.abs(velocity) > 1.0) {
      if (velocity > 0) {
        // 下方向（縮小）- 現在より小さい最初のスナップポイント
        for (let i = snapValues.length - 1; i >= 0; i--) {
          if (snapValues[i] < currentHeight) {
            return snapValues[i]
          }
        }
        return SNAP_POINTS.PEEK
      } else {
        // 上方向（拡大）- 現在より大きい最初のスナップポイント
        for (const snap of snapValues) {
          if (snap > currentHeight) {
            return snap
          }
        }
        return SNAP_POINTS.FULL
      }
    }

    // 中速フリックの場合
    if (Math.abs(velocity) > 0.3) {
      const nearest = findNearestSnapPoint(currentHeight)
      const nearestIndex = snapValues.indexOf(nearest)

      if (velocity > 0 && nearestIndex > 0) {
        return snapValues[nearestIndex - 1]
      } else if (velocity < 0 && nearestIndex < snapValues.length - 1) {
        return snapValues[nearestIndex + 1]
      }
      return nearest
    }

    // 低速の場合は最も近いスナップポイント
    return findNearestSnapPoint(currentHeight)
  }, [findNearestSnapPoint])

  // 高さに応じてカードモードを更新
  const updateCardMode = useCallback((height: number) => {
    const shouldBeFullMode = height >= FULL_THRESHOLD
    if (shouldBeFullMode !== isFullMode) {
      setIsFullMode(shouldBeFullMode)
    }
    const shouldBePeekMode = height < PEEK_THRESHOLD
    if (shouldBePeekMode !== isPeekMode) {
      setIsPeekMode(shouldBePeekMode)
    }
  }, [isFullMode, isPeekMode])

  // スナップアニメーションを実行
  const animateToSnapPoint = useCallback((targetHeight: number) => {
    listHeightRef.current = targetHeight
    updateCardMode(targetHeight)

    Animated.spring(listHeightAnim, {
      toValue: targetHeight,
      useNativeDriver: false,
      friction: 10,
      tension: 60,
    }).start()
  }, [listHeightAnim, updateCardMode])

  // PanResponderでドラッグを処理（ハンドル用）
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newHeight = listHeightRef.current - gestureState.dy
        const clampedHeight = Math.max(SNAP_POINTS.PEEK, Math.min(SNAP_POINTS.FULL, newHeight))
        listHeightAnim.setValue(clampedHeight)
      },
      onPanResponderRelease: (_, gestureState) => {
        const newHeight = listHeightRef.current - gestureState.dy
        const clampedHeight = Math.max(SNAP_POINTS.PEEK, Math.min(SNAP_POINTS.FULL, newHeight))
        const targetHeight = getNextSnapPoint(clampedHeight, gestureState.vy)
        animateToSnapPoint(targetHeight)
      },
    })
  ).current

  // リスト先頭での下スワイプでシート縮小するためのハンドラー
  const handleScrollBeginDrag = useCallback(() => {
    isScrollingRef.current = true
  }, [])

  const handleScrollEndDrag = useCallback((event: any) => {
    isScrollingRef.current = false
    const offsetY = event.nativeEvent.contentOffset.y
    scrollOffsetRef.current = offsetY

    // リストが先頭にあり、下に引っ張った場合（overscroll）
    if (offsetY < -30 && listHeightRef.current > SNAP_POINTS.PEEK) {
      // 一つ下のスナップポイントへ
      const snapValues = [SNAP_POINTS.PEEK, SNAP_POINTS.HALF, SNAP_POINTS.FULL]
      const currentIndex = snapValues.findIndex(s => s >= listHeightRef.current)
      if (currentIndex > 0) {
        animateToSnapPoint(snapValues[currentIndex - 1])
      }
    }
  }, [animateToSnapPoint])

  const handleScroll = useCallback((event: any) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y
  }, [])

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

        {/* カテゴリクイックフィルター（PEEK時は非表示） */}
        {!isPeekMode && categories.length > 0 && (
          <QuickCategoryFilter
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleCategorySelect}
          />
        )}

        {/* リスト */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          bounces={true}
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
            filteredItems.slice(0, 30).map((item) => (
              <NearbyItemCard
                key={`${item.type}-${item.id}`}
                item={item}
                onPress={() => handleListItemPress(item)}
                onLongPress={() => handleOpenDetail(item)}
                onDetailPress={() => handleDetailPress(item)}
                isSelected={selectedItem?.id === item.id && selectedItem?.type === item.type}
                compact={!isFullMode}
                showDistance
              />
            ))
          )}
        </ScrollView>

        {/* バナー広告 */}
        <AdBanner unitId={AD_UNIT_IDS.BANNER_MAP} />
      </Animated.View>

      {/* 拡張FAB - ラベル付きモダンデザイン */}
      <Animated.View style={[
        styles.fab,
        {
          bottom: fabBottomAnim,
          transform: [{ scale: fabScaleAnim }],
        }
      ]}>
        <Pressable
          style={styles.fabTouchable}
          onPress={handleFABPress}
          onPressIn={handleFABPressIn}
          onPressOut={handleFABPressOut}
        >
          <MaterialCommunityIcons name="plus" size={22} color={colors.white} />
          <Text style={styles.fabLabel}>募集する</Text>
        </Pressable>
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

// デザインガイドライン v2 準拠のスタイル
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // ピュアホワイト背景
  },
  mapContainer: {
    flex: 1,
  },

  // Floating Header - モダン＆ミニマル
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
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.accent[500],
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontSize: fontSize.xs - 2,
    fontWeight: fontWeight.bold,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary[600],
  },

  // Bottom List - モダンボトムシート
  bottomList: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.lg,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm + 4,
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: colors.neutral[300],
    borderRadius: borderRadius.full,
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
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: fontSize.sm,
    color: colors.neutral[400],
    textAlign: 'center',
  },

  // 拡張FAB - モダンデザイン（ラベル付き）
  fab: {
    position: 'absolute',
    right: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[600],
    ...shadows.lg,
  },
  fabTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  fabLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
})
