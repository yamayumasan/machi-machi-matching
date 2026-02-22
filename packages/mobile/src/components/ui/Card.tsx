import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native'
import { colors, spacing, borderRadius, shadows } from '@/constants/theme'

export type CardVariant = 'default' | 'outlined' | 'elevated'

export interface CardProps extends ViewProps {
  children: React.ReactNode
  variant?: CardVariant
  noPadding?: boolean
  style?: ViewStyle
}

export function Card({
  children,
  variant = 'default',
  noPadding = false,
  style,
  ...props
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        styles[variant],
        !noPadding && styles.padding,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  padding: {
    padding: spacing.md,
  },

  // Variants
  default: {
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: colors.white,
  },
  elevated: {
    ...shadows.card,
    borderWidth: 0,
  },
})
