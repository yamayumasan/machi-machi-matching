import { useRef, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, Animated } from 'react-native'
import { Category } from '@/services/category'
import { CategoryIcon } from './CategoryIcon'
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/constants/theme'

interface QuickCategoryFilterProps {
  categories: Category[]
  selectedCategoryId: string | null
  onSelectCategory: (categoryId: string | null) => void
}

export function QuickCategoryFilter({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: QuickCategoryFilterProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 全て表示チップ */}
        <CategoryChip
          label="すべて"
          icon="view-grid"
          isSelected={selectedCategoryId === null}
          onPress={() => onSelectCategory(null)}
        />
        {/* カテゴリチップ */}
        {categories.map((category) => (
          <CategoryChip
            key={category.id}
            label={category.name}
            icon={category.icon}
            isSelected={selectedCategoryId === category.id}
            onPress={() => onSelectCategory(category.id)}
          />
        ))}
      </ScrollView>
    </View>
  )
}

interface CategoryChipProps {
  label: string
  icon: string
  isSelected: boolean
  onPress: () => void
}

function CategoryChip({ label, icon, isSelected, onPress }: CategoryChipProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 10,
      tension: 100,
    }).start()
  }, [scaleAnim])

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 10,
      tension: 100,
    }).start()
  }, [scaleAnim])

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={[styles.chip, isSelected && styles.chipSelected]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={[styles.chipIcon, isSelected && styles.chipIconSelected]}>
          <CategoryIcon
            name={icon}
            size={14}
            color={isSelected ? colors.white : colors.primary[600]}
          />
        </View>
        <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingVertical: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: 6,
  },
  chipSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  chipIcon: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipIconSelected: {
    backgroundColor: colors.primary[500],
  },
  chipLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.neutral[700],
  },
  chipLabelSelected: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
})
