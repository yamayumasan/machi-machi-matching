import { useEffect } from 'react'
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
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useGroupStore } from '@/stores/group'
import { Group } from '@/services/group'
import { colors, spacing } from '@/constants/theme'
import { CategoryIcon } from '@/components/CategoryIcon'

export default function GroupsScreen() {
  const { groups, isLoading, fetchGroups } = useGroupStore()

  useEffect(() => {
    fetchGroups()
  }, [])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '日程未定'
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })
  }

  const renderGroup = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupItem}
      onPress={() => router.push(`/group/${item.id}`)}
    >
      <View style={styles.groupIcon}>
        <CategoryIcon
          name={item.recruitment.category.icon}
          size={20}
          color={colors.accent[600]}
        />
      </View>
      <View style={styles.groupContent}>
        <Text style={styles.groupTitle} numberOfLines={1}>
          {item.recruitment.title}
        </Text>
        <View style={styles.groupMeta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="account-group" size={14} color={colors.primary[500]} />
            <Text style={styles.groupMetaText}>{item.members.length}人</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="calendar" size={14} color={colors.primary[500]} />
            <Text style={styles.groupMetaText}>{formatDate(item.recruitment.datetime || item.recruitment.datetimeFlex)}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>グループ</Text>
      </View>

      {isLoading && groups.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary[500]} />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-group-outline" size={48} color={colors.primary[400]} />
          <Text style={styles.emptyText}>参加中のグループはありません</Text>
          <Text style={styles.subText}>
            募集に参加するとグループが作成されます
          </Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroup}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchGroups} />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[200],
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary[900],
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
    color: colors.primary[500],
    marginBottom: spacing.sm,
  },
  subText: {
    fontSize: 14,
    color: colors.primary[400],
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  groupIconText: {
    fontSize: 24,
  },
  groupContent: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[900],
    marginBottom: 4,
  },
  groupMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupMetaText: {
    fontSize: 13,
    color: colors.primary[500],
  },
  arrow: {
    fontSize: 20,
    color: colors.primary[400],
  },
  separator: {
    height: 1,
    backgroundColor: colors.primary[100],
  },
})
