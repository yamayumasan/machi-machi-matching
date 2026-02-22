import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme'

export interface ListItemProps {
  title: string
  subtitle?: string
  leftElement?: React.ReactNode
  rightElement?: React.ReactNode
  showChevron?: boolean
  onPress?: () => void
  disabled?: boolean
  variant?: 'default' | 'danger'
  isLast?: boolean
  style?: ViewStyle
}

export function ListItem({
  title,
  subtitle,
  leftElement,
  rightElement,
  showChevron = false,
  onPress,
  disabled = false,
  variant = 'default',
  isLast = false,
  style,
}: ListItemProps) {
  const content = (
    <View style={[styles.container, !isLast && styles.border, style]}>
      {leftElement && <View style={styles.leftElement}>{leftElement}</View>}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            variant === 'danger' && styles.titleDanger,
            disabled && styles.titleDisabled,
          ]}
        >
          {title}
        </Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      {showChevron && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={colors.primary[400]}
        />
      )}
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    )
  }

  return content
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[100],
  },
  leftElement: {
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.md,
    color: colors.primary[900],
  },
  titleDanger: {
    color: colors.error[500],
  },
  titleDisabled: {
    color: colors.primary[300],
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.primary[500],
    marginTop: 2,
  },
  rightElement: {
    marginLeft: spacing.sm,
  },
})
