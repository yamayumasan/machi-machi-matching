import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme'

export interface ScreenHeaderProps {
  title: string
  rightElement?: React.ReactNode
  variant?: 'default' | 'transparent'
  style?: ViewStyle
}

export function ScreenHeader({
  title,
  rightElement,
  variant = 'default',
  style,
}: ScreenHeaderProps) {
  return (
    <View style={[styles.container, styles[variant], style]}>
      <Text style={styles.title}>{title}</Text>
      {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  default: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200], // ガイドライン v2 準拠
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[800], // ガイドライン v2 準拠: 見出し
    flex: 1,
  },
  rightElement: {
    marginLeft: spacing.md,
  },
})
