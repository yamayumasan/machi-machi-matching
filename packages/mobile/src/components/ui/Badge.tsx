import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme'

export type BadgeVariant = 'primary' | 'accent' | 'success' | 'warning' | 'error'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  children?: React.ReactNode
  count?: number
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  style?: ViewStyle
}

export function Badge({
  children,
  count,
  variant = 'accent',
  size = 'md',
  dot = false,
  style,
}: BadgeProps) {
  if (dot) {
    return (
      <View style={[styles.dot, styles[`dot_${variant}`], style]} />
    )
  }

  const displayCount = count !== undefined
    ? (count > 99 ? '99+' : count.toString())
    : children

  return (
    <View
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        style,
      ]}
    >
      <Text style={[styles.text, styles[`text_${size}`]]}>
        {displayCount}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Sizes
  size_sm: {
    minWidth: 16,
    height: 16,
    paddingHorizontal: spacing.xs,
  },
  size_md: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: spacing.xs + 2,
  },

  // Variants
  primary: {
    backgroundColor: colors.primary[600],
  },
  accent: {
    backgroundColor: colors.accent[600],
  },
  success: {
    backgroundColor: colors.success[600],
  },
  warning: {
    backgroundColor: colors.warning[600],
  },
  error: {
    backgroundColor: colors.error[500],
  },

  // Dot variants
  dot_primary: {
    backgroundColor: colors.primary[600],
  },
  dot_accent: {
    backgroundColor: colors.accent[600],
  },
  dot_success: {
    backgroundColor: colors.success[600],
  },
  dot_warning: {
    backgroundColor: colors.warning[600],
  },
  dot_error: {
    backgroundColor: colors.error[500],
  },

  // Text
  text: {
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
  text_sm: {
    fontSize: fontSize.xs - 2,
  },
  text_md: {
    fontSize: fontSize.xs,
  },
})
