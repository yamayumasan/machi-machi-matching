import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors, spacing, borderRadius, fontWeight, fontSize, shadows } from '@/constants/theme'

export type FilterType = 'all' | 'recruitment' | 'wantToDo' | 'participating'

type MdiIconName = 'format-list-bulleted' | 'clipboard-text-outline' | 'thought-bubble-outline' | 'check-circle-outline'

interface Tab {
  key: FilterType
  label: string
  icon?: MdiIconName
}

const DEFAULT_TABS: Tab[] = [
  { key: 'all', label: 'すべて', icon: 'format-list-bulleted' },
  { key: 'recruitment', label: '募集', icon: 'clipboard-text-outline' },
  { key: 'wantToDo', label: '誘われ待ち', icon: 'thought-bubble-outline' },
  { key: 'participating', label: '参加中', icon: 'check-circle-outline' },
]

interface FilterTabsProps {
  value: FilterType
  onChange: (value: FilterType) => void
  tabs?: Tab[]
  showIcons?: boolean
}

export function FilterTabs({
  value,
  onChange,
  tabs = DEFAULT_TABS,
  showIcons = true,
}: FilterTabsProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => (
          <TabItem
            key={tab.key}
            tab={tab}
            isActive={value === tab.key}
            onPress={() => onChange(tab.key)}
            showIcon={showIcons}
          />
        ))}
      </ScrollView>
    </View>
  )
}

interface TabItemProps {
  tab: Tab
  isActive: boolean
  onPress: () => void
  showIcon: boolean
}

function TabItem({ tab, isActive, onPress, showIcon }: TabItemProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.tab, isActive && styles.tabActive]}>
        {showIcon && tab.icon && (
          <MaterialCommunityIcons
            name={tab.icon}
            size={14}
            color={isActive ? colors.white : colors.primary[600]}
          />
        )}
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
          {tab.label}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

// シンプルなセグメントコントロール版
interface SegmentedControlProps {
  value: FilterType
  onChange: (value: FilterType) => void
  tabs?: Tab[]
}

export function SegmentedControl({
  value,
  onChange,
  tabs = DEFAULT_TABS.slice(0, 3), // 最初の3つだけ
}: SegmentedControlProps) {
  const activeIndex = tabs.findIndex((t) => t.key === value)

  return (
    <View style={styles.segmentContainer}>
      {/* アクティブインジケーター */}
      <View
        style={[
          styles.segmentIndicator,
          {
            width: `${100 / tabs.length}%` as any,
            left: `${(activeIndex * 100) / tabs.length}%` as any,
          },
        ]}
      />

      {/* タブ */}
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={styles.segment}
          onPress={() => onChange(tab.key)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentText,
              value === tab.key && styles.segmentTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// デザインガイドライン v2 準拠
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200], // ガイドライン準拠: neutral系ボーダー
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full, // ガイドライン準拠: ピル型ボタン
    gap: 4,
    backgroundColor: colors.neutral[100], // ガイドライン準拠: neutral系背景
  },
  tabActive: {
    backgroundColor: colors.primary[600], // ガイドライン準拠: プライマリCTA色
  },
  tabText: {
    fontSize: fontSize.sm, // 14px
    fontWeight: fontWeight.medium,
    color: colors.neutral[600], // ガイドライン準拠: 本文テキスト
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },

  // Segmented Control styles - ガイドライン v2 準拠
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100], // ガイドライン準拠
    borderRadius: borderRadius.lg,
    padding: 2,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    position: 'relative',
  },
  segmentIndicator: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    ...shadows.xs, // ガイドライン準拠
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    zIndex: 1,
  },
  segmentText: {
    fontSize: fontSize.sm,
    color: colors.neutral[500], // ガイドライン準拠: サブテキスト
    fontWeight: fontWeight.medium,
  },
  segmentTextActive: {
    color: colors.neutral[800], // ガイドライン準拠: 見出し
    fontWeight: fontWeight.semibold,
  },
})
