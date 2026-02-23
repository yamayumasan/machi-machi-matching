import { useRef, useCallback } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme'
import { lightTap, heavyTap } from '@/utils/haptics'

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
  // タップアニメーション
  const scaleAnim = useRef(new Animated.Value(1)).current
  const bgAnim = useRef(new Animated.Value(0)).current

  const handlePressIn = useCallback(() => {
    if (disabled) return
    // ハプティックフィードバック（variantに応じて強度を変える）
    if (variant === 'danger') {
      heavyTap()
    } else {
      lightTap()
    }

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        friction: 10,
        tension: 100,
      }),
      Animated.timing(bgAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start()
  }, [scaleAnim, bgAnim, disabled, variant])

  const handlePressOut = useCallback(() => {
    if (disabled) return
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 10,
        tension: 100,
      }),
      Animated.timing(bgAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start()
  }, [scaleAnim, bgAnim, disabled])

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.white, colors.neutral[50]],
  })

  const content = (
    <View style={[styles.innerContainer, !isLast && styles.border]}>
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
          color={colors.neutral[400]}
        />
      )}
    </View>
  )

  if (onPress) {
    return (
      <Animated.View
        style={[
          { transform: [{ scale: scaleAnim }], backgroundColor },
          style,
        ]}
      >
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
        >
          {content}
        </Pressable>
      </Animated.View>
    )
  }

  return <View style={style}>{content}</View>
}

const styles = StyleSheet.create({
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200], // ガイドライン v2 準拠
  },
  leftElement: {
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.md,
    color: colors.neutral[800], // ガイドライン v2 準拠: 見出し
  },
  titleDanger: {
    color: colors.error[500],
  },
  titleDisabled: {
    color: colors.neutral[300], // ガイドライン v2 準拠: disabled
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.neutral[500], // ガイドライン v2 準拠: サブテキスト
    marginTop: 2,
  },
  rightElement: {
    marginLeft: spacing.sm,
  },
})
