import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useRecruitmentStore } from '@/stores/recruitment'
import { useAuthStore } from '@/stores/auth'
import { useCategoryStore } from '@/stores/category'
import { useNearbyStore } from '@/stores/nearby'
import { Recruitment } from '@/services/recruitment'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { NearbyMap } from '@/components/NearbyMap'
import { colors, spacing } from '@/constants/theme'
import { CategoryIcon } from '@/components/CategoryIcon'

type AreaFilter = 'ALL' | 'TOKYO' | 'SENDAI'
type ViewMode = 'list' | 'map'

export default function ExploreScreen() {
  const { user } = useAuthStore()
  const { recruitments: rawRecruitments, isLoading, fetchRecruitments } = useRecruitmentStore()
  const { categories: rawCategories, fetchCategories } = useCategoryStore()
  const { setFilterType, setSelectedCategories } = useNearbyStore()

  // 防御的に配列を保証
  const recruitments = rawRecruitments || []
  const categories = rawCategories || []
  const [areaFilter, setAreaFilter] = useState<AreaFilter>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  useEffect(() => {
    fetchCategories()
    loadRecruitments()
  }, [])

  const loadRecruitments = (area?: AreaFilter, categoryId?: string | null) => {
    const params: { area?: 'TOKYO' | 'SENDAI'; categoryId?: string } = {}
    if (area && area !== 'ALL') {
      params.area = area
    }
    if (categoryId) {
      params.categoryId = categoryId
    }
    fetchRecruitments(params)
  }

  const handleAreaChange = (area: AreaFilter) => {
    setAreaFilter(area)
    loadRecruitments(area, categoryFilter)
  }

  const handleCategoryChange = (categoryId: string | null) => {
    setCategoryFilter(categoryId)
    loadRecruitments(areaFilter, categoryId)
    // マップ用のカテゴリフィルターも更新
    setSelectedCategories(categoryId ? [categoryId] : [])
  }

  const formatDate = (datetime: string | null, datetimeFlex: string | null) => {
    if (datetime) {
      const date = new Date(datetime)
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      })
    }
    if (datetimeFlex) {
      return datetimeFlex
    }
    return '日程未定'
  }

  const renderRecruitment = ({ item }: { item: Recruitment }) => (
    <TouchableOpacity
      style={styles.recruitmentCard}
      onPress={() => router.push(`/recruitment/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}>
          <CategoryIcon name={item.category.icon} size={12} color={colors.primary[700]} />
          <Text style={styles.categoryName}>{item.category.name}</Text>
        </View>
        <Text style={styles.area}>
          {item.area === 'TOKYO' ? '東京' : '仙台'}
        </Text>
      </View>

      <Text style={styles.recruitmentTitle} numberOfLines={2}>
        {item.title}
      </Text>

      <View style={styles.cardMeta}>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="account" size={14} color={colors.primary[500]} />
          <Text style={styles.metaText}>{item.creator.nickname}</Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="calendar" size={14} color={colors.primary[500]} />
          <Text style={styles.metaText}>
            {formatDate(item.datetime, item.datetimeFlex)}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="account-group" size={14} color={colors.primary[500]} />
          <Text style={styles.metaText}>
            {item.currentPeople}/{item.maxPeople}人
          </Text>
        </View>
      </View>

      {item.landmarkName && (
        <View style={styles.locationRow}>
          <MaterialCommunityIcons name="map-marker" size={14} color={colors.primary[500]} />
          <Text style={styles.location} numberOfLines={1}>
            {item.landmarkName}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>募集を探す</Text>

        {/* 表示切り替えボタン */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'list' && styles.viewToggleButtonActive,
            ]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[
              styles.viewToggleText,
              viewMode === 'list' && styles.viewToggleTextActive,
            ]}>
              リスト
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'map' && styles.viewToggleButtonActive,
            ]}
            onPress={() => setViewMode('map')}
          >
            <Text style={[
              styles.viewToggleText,
              viewMode === 'map' && styles.viewToggleTextActive,
            ]}>
              マップ
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* フィルター（リストモード時のみ表示） */}
      {viewMode === 'list' && (
        <View style={styles.filters}>
          {/* エリアフィルター */}
          <View style={styles.filterRow}>
            {(['ALL', 'TOKYO', 'SENDAI'] as AreaFilter[]).map((area) => (
              <TouchableOpacity
                key={area}
                style={[
                  styles.filterChip,
                  areaFilter === area && styles.filterChipActive,
                ]}
                onPress={() => handleAreaChange(area)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    areaFilter === area && styles.filterChipTextActive,
                  ]}
                >
                  {area === 'ALL' ? '全て' : area === 'TOKYO' ? '東京' : '仙台'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* カテゴリフィルター */}
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ id: null, name: '全て', icon: '🔍' }, ...categories]}
            keyExtractor={(item) => item.id || 'all'}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  categoryFilter === item.id && styles.categoryChipActive,
                ]}
                onPress={() => handleCategoryChange(item.id)}
              >
                <Text style={styles.categoryChipIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.categoryChipText,
                    categoryFilter === item.id && styles.categoryChipTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.categoryList}
          />
        </View>
      )}

      {/* コンテンツ */}
      {viewMode === 'map' ? (
        <NearbyMap />
      ) : (
        <>
          {/* 募集一覧 */}
          {isLoading && recruitments.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary[500]} />
            </View>
          ) : recruitments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>募集が見つかりませんでした</Text>
              <Text style={styles.emptySubText}>
                フィルターを変更してみてください
              </Text>
            </View>
          ) : (
            <FlatList
              data={recruitments}
              renderItem={renderRecruitment}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading}
                  onRefresh={() => loadRecruitments(areaFilter, categoryFilter)}
                />
              }
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </>
      )}
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
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 2,
  },
  viewToggleButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
  },
  viewToggleButtonActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewToggleText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  viewToggleTextActive: {
    color: colors.gray[900],
    fontWeight: '600',
  },
  filters: {
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
  },
  filterChipText: {
    fontSize: 13,
    color: colors.gray[600],
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  categoryList: {
    paddingHorizontal: spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
  },
  categoryChipActive: {
    backgroundColor: colors.primary[100],
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  categoryChipIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryChipText: {
    fontSize: 12,
    color: colors.gray[600],
  },
  categoryChipTextActive: {
    color: colors.primary[700],
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.gray[400],
  },
  listContent: {
    padding: spacing.md,
  },
  recruitmentCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryName: {
    fontSize: 12,
    color: colors.gray[700],
  },
  area: {
    fontSize: 12,
    color: colors.gray[500],
  },
  recruitmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.gray[600],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  location: {
    fontSize: 12,
    color: colors.gray[500],
    flex: 1,
  },
  separator: {
    height: spacing.sm,
  },
})
