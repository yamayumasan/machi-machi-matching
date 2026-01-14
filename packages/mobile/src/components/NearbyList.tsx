import { useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { router } from 'expo-router'
import { NearbyItem } from '@/services/nearby'
import { NearbyItemCard } from './NearbyItemCard'
import { FilterTabs, FilterType } from './FilterTabs'
import { colors, spacing } from '@/constants/theme'

interface NearbyListProps {
  items: NearbyItem[]
  isLoading: boolean
  filterType: FilterType
  onFilterChange: (type: FilterType) => void
  onItemPress?: (item: NearbyItem) => void
  onRefresh?: () => void
  selectedItemId?: string | null
  showHeader?: boolean
  ListHeaderComponent?: React.ReactElement
}

export function NearbyList({
  items,
  isLoading,
  filterType,
  onFilterChange,
  onItemPress,
  onRefresh,
  selectedItemId,
  showHeader = true,
  ListHeaderComponent,
}: NearbyListProps) {
  // フィルタリング
  const filteredItems = items.filter((item) => {
    switch (filterType) {
      case 'recruitment':
        return item.type === 'recruitment'
      case 'wantToDo':
        return item.type === 'wantToDo'
      case 'participating':
        return item.type === 'recruitment' && item.isParticipating
      default:
        return true
    }
  })

  const handleItemPress = useCallback((item: NearbyItem) => {
    if (onItemPress) {
      onItemPress(item)
    } else {
      // デフォルトの遷移
      if (item.type === 'recruitment') {
        router.push(`/recruitment/${item.id}`)
      }
    }
  }, [onItemPress])

  const renderItem = useCallback(({ item }: { item: NearbyItem }) => (
    <NearbyItemCard
      item={item}
      onPress={() => handleItemPress(item)}
      isSelected={selectedItemId === item.id}
      showDistance
    />
  ), [handleItemPress, selectedItemId])

  const keyExtractor = useCallback((item: NearbyItem) => `${item.type}-${item.id}`, [])

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator color={colors.primary[500]} />
        </View>
      )
    }

    const emptyMessages = {
      all: '周辺に募集・やりたいことがありません',
      recruitment: '周辺に募集がありません',
      wantToDo: '周辺のやりたいこと表明がありません',
      participating: '参加中の募集がありません',
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>
          {filterType === 'participating' ? '👥' : '📍'}
        </Text>
        <Text style={styles.emptyText}>{emptyMessages[filterType]}</Text>
        <Text style={styles.emptySubText}>
          {filterType === 'participating'
            ? '募集に参加してみましょう'
            : 'マップを移動して探してみてください'}
        </Text>
      </View>
    )
  }

  const ListHeader = () => (
    <>
      {ListHeaderComponent}
      {showHeader && (
        <FilterTabs
          value={filterType}
          onChange={onFilterChange}
        />
      )}
      {/* アイテム数表示 */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {filteredItems.length}件
        </Text>
      </View>
    </>
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              tintColor={colors.primary[500]}
            />
          ) : undefined
        }
      />
    </View>
  )
}

// コンパクト版（BottomSheet内で使用）
interface CompactNearbyListProps {
  items: NearbyItem[]
  onItemPress?: (item: NearbyItem) => void
  selectedItemId?: string | null
}

export function CompactNearbyList({
  items,
  onItemPress,
  selectedItemId,
}: CompactNearbyListProps) {
  const handleItemPress = useCallback((item: NearbyItem) => {
    if (onItemPress) {
      onItemPress(item)
    } else {
      if (item.type === 'recruitment') {
        router.push(`/recruitment/${item.id}`)
      }
    }
  }, [onItemPress])

  return (
    <FlatList
      data={items}
      renderItem={({ item }) => (
        <NearbyItemCard
          item={item}
          onPress={() => handleItemPress(item)}
          isSelected={selectedItemId === item.id}
          compact
          showDistance
        />
      )}
      keyExtractor={(item) => `${item.type}-${item.id}`}
      showsVerticalScrollIndicator={false}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  countContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  countText: {
    fontSize: 12,
    color: colors.primary[500],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: colors.primary[500],
    marginBottom: spacing.xs,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.primary[400],
  },
})
