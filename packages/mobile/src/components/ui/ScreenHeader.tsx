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
    borderBottomColor: colors.primary[200],
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary[900],
    flex: 1,
  },
  rightElement: {
    marginLeft: spacing.md,
  },
})
