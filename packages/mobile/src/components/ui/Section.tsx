import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme'

export interface SectionProps {
  children: React.ReactNode
  title?: string
  rightElement?: React.ReactNode
  variant?: 'default' | 'card'
  noPadding?: boolean
  style?: ViewStyle
}

export function Section({
  children,
  title,
  rightElement,
  variant = 'default',
  noPadding = false,
  style,
}: SectionProps) {
  return (
    <View style={[styles.container, styles[variant], style]}>
      {(title || rightElement) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
        </View>
      )}
      <View style={!noPadding && styles.content}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  default: {
    backgroundColor: colors.white,
  },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg, // ガイドライン v2 準拠
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[700], // ガイドライン v2 準拠: 強調テキスト
  },
  rightElement: {
    marginLeft: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
})
