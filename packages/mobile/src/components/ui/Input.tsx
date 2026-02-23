import { useState } from 'react'
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native'
import { colors, spacing, borderRadius, fontSize } from '@/constants/theme'

export interface InputProps extends TextInputProps {
  label?: string
  error?: string
  helper?: string
  containerStyle?: ViewStyle
}

export function Input({
  label,
  error,
  helper,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const hasError = Boolean(error)

  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          hasError && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.neutral[400]} // ガイドライン準拠
        onFocus={(e) => {
          setIsFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocused(false)
          props.onBlur?.(e)
        }}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {!error && helper && <Text style={styles.helper}>{helper}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.neutral[700], // ガイドライン準拠
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.white, // ガイドライン準拠
    borderWidth: 1.5, // ガイドライン準拠
    borderColor: colors.neutral[200], // ガイドライン準拠
    borderRadius: borderRadius.lg, // ガイドライン準拠: 12px
    paddingHorizontal: spacing.md,
    paddingVertical: 14, // ガイドライン準拠
    fontSize: fontSize.md, // 16px - iOS対応
    color: colors.neutral[800], // ガイドライン準拠
  },
  inputFocused: {
    borderColor: colors.primary[600],
  },
  inputError: {
    borderColor: colors.error[500],
  },
  error: {
    fontSize: fontSize.xs,
    color: colors.error[500],
    marginTop: spacing.xs,
  },
  helper: {
    fontSize: fontSize.xs,
    color: colors.neutral[500], // ガイドライン準拠
    marginTop: spacing.xs,
  },
})
