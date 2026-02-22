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
        placeholderTextColor={colors.primary[400]}
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
    color: colors.primary[700],
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.primary[900],
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
    color: colors.primary[500],
    marginTop: spacing.xs,
  },
})
