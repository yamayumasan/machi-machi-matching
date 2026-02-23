import { useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows, animation } from '@/constants/theme'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  visible: boolean
  message: string
  type?: ToastType
  duration?: number
  onDismiss?: () => void
  action?: {
    label: string
    onPress: () => void
  }
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const TOAST_ICONS: Record<ToastType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  success: 'check-circle',
  error: 'alert-circle',
  warning: 'alert',
  info: 'information',
}

const TOAST_COLORS: Record<ToastType, { bg: string; icon: string; text: string }> = {
  success: {
    bg: colors.success[50],
    icon: colors.success[600],
    text: colors.success[600],
  },
  error: {
    bg: colors.error[50],
    icon: colors.error[600],
    text: colors.error[600],
  },
  warning: {
    bg: colors.warning[50],
    icon: colors.warning[600],
    text: colors.warning[600],
  },
  info: {
    bg: colors.info[50],
    icon: colors.info[600],
    text: colors.info[600],
  },
}

export function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
  action,
}: ToastProps) {
  const insets = useSafeAreaInsets()
  const translateY = useRef(new Animated.Value(-100)).current
  const opacity = useRef(new Animated.Value(0)).current

  const showToast = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 80,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: animation.duration.fast,
        useNativeDriver: true,
      }),
    ]).start()
  }, [translateY, opacity])

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: animation.duration.default,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: animation.duration.default,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.()
    })
  }, [translateY, opacity, onDismiss])

  useEffect(() => {
    if (visible) {
      showToast()
      if (duration > 0) {
        const timer = setTimeout(() => {
          hideToast()
        }, duration)
        return () => clearTimeout(timer)
      }
    } else {
      hideToast()
    }
    return undefined
  }, [visible, duration, showToast, hideToast])

  const toastColors = TOAST_COLORS[type]
  const iconName = TOAST_ICONS[type]

  if (!visible) return null

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + spacing.sm,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Pressable
        style={[styles.toast, { backgroundColor: toastColors.bg }]}
        onPress={hideToast}
      >
        <MaterialCommunityIcons
          name={iconName}
          size={20}
          color={toastColors.icon}
          style={styles.icon}
        />
        <Text
          style={[styles.message, { color: toastColors.text }]}
          numberOfLines={2}
        >
          {message}
        </Text>
        {action && (
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              action.onPress()
              hideToast()
            }}
          >
            <Text style={[styles.actionText, { color: toastColors.icon }]}>
              {action.label}
            </Text>
          </Pressable>
        )}
        <Pressable onPress={hideToast} style={styles.closeButton}>
          <MaterialCommunityIcons
            name="close"
            size={18}
            color={colors.neutral[400]}
          />
        </Pressable>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.lg,
  },
  icon: {
    marginRight: spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: 20,
  },
  actionButton: {
    marginLeft: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  closeButton: {
    marginLeft: spacing.xs,
    padding: spacing.xs,
  },
})
