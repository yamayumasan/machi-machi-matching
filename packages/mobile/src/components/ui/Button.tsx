import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native'
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/constants/theme'

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
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
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
      )}
    </TouchableOpacity>
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
  secondary: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  accent: {
    backgroundColor: colors.accent[600],
    borderRadius: borderRadius.lg,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.lg,
  },
  danger: {
    backgroundColor: colors.error[500],
    borderRadius: borderRadius.lg,
  },

  // Sizes
  size_sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 32,
  },
  size_md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },
  size_lg: {
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xl,
    minHeight: 52,
  },

  // Text
  text: {
    fontWeight: fontWeight.semibold,
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.primary[700],
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
