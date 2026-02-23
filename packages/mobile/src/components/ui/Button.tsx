import { useRef, useCallback } from 'react'
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  Animated,
  Pressable,
} from 'react-native'
import { colors, spacing, borderRadius, fontSize, fontWeight, animation } from '@/constants/theme'

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  children: React.ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
  /** アニメーションを無効化する場合 */
  noAnimation?: boolean
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  noAnimation = false,
  onPress,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading
  const scaleAnim = useRef(new Animated.Value(1)).current

  // デザインガイドライン v2準拠: scale(0.98) + 150ms
  const handlePressIn = useCallback(() => {
    if (noAnimation || isDisabled) return
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start()
  }, [scaleAnim, noAnimation, isDisabled])

  const handlePressOut = useCallback(() => {
    if (noAnimation || isDisabled) return
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start()
  }, [scaleAnim, noAnimation, isDisabled])

  const content = loading ? (
    <ActivityIndicator
      color={variant === 'secondary' || variant === 'ghost' ? colors.primary[600] : colors.white}
      size="small"
    />
  ) : (
    <Text
      style={[
        styles.text,
        styles[`${variant}Text`],
        styles[`size_${size}_text`],
        textStyle,
      ]}
    >
      {children}
    </Text>
  )

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        fullWidth && styles.fullWidth,
      ]}
    >
      <Pressable
        style={({ pressed }) => [
          styles.base,
          styles[variant],
          styles[`size_${size}`],
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          // ホバー効果（iOS/Android共通）
          !noAnimation && pressed && !isDisabled && styles[`${variant}Pressed`],
          style,
        ]}
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        {...props}
      >
        {content}
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  // Variants
  primary: {
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.lg,
  },
  primaryPressed: {
    backgroundColor: colors.primary[700],
  },
  secondary: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5, // ガイドライン準拠
    borderColor: colors.neutral[200], // ガイドライン準拠: neutral系
  },
  secondaryPressed: {
    backgroundColor: colors.neutral[50],
  },
  accent: {
    backgroundColor: colors.accent[600],
    borderRadius: borderRadius.lg,
  },
  accentPressed: {
    backgroundColor: colors.accent[700],
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.lg,
  },
  ghostPressed: {
    backgroundColor: colors.primary[50],
  },
  danger: {
    backgroundColor: colors.error[500],
    borderRadius: borderRadius.lg,
  },
  dangerPressed: {
    backgroundColor: colors.error[600],
  },

  // Sizes - design-guidelines v2準拠
  size_sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 36,
  },
  size_md: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    minHeight: 48, // ガイドライン準拠: タップしやすいサイズ
  },
  size_lg: {
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xl,
    minHeight: 56,
  },

  // Text
  text: {
    fontWeight: fontWeight.semibold,
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.neutral[700], // ガイドライン準拠
  },
  accentText: {
    color: colors.white,
  },
  ghostText: {
    color: colors.primary[600],
  },
  dangerText: {
    color: colors.white,
  },

  // Text sizes
  size_sm_text: {
    fontSize: fontSize.sm,
  },
  size_md_text: {
    fontSize: fontSize.md,
  },
  size_lg_text: {
    fontSize: fontSize.lg,
  },
})
