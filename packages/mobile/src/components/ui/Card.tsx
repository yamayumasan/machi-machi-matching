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
    backgroundColor: colors.white, // ガイドライン準拠: カードは白背景
    borderRadius: borderRadius.xl, // ガイドライン準拠: 16px
  },
  padding: {
    padding: spacing.md,
  },

  // Variants - design-guidelines v2準拠
  default: {
    borderWidth: 1,
    borderColor: colors.neutral[200], // ガイドライン準拠
    ...shadows.sm, // ガイドライン準拠: カードには軽いシャドウ
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.neutral[200], // ガイドライン準拠
    backgroundColor: colors.white,
  },
  elevated: {
    ...shadows.card,
    borderWidth: 0,
  },
})
