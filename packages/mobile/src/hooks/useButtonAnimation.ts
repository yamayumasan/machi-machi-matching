import { useRef, useCallback } from 'react'
import { Animated, Platform } from 'react-native'
import { animation } from '@/constants/theme'

interface UseButtonAnimationOptions {
  scalePressed?: number
  hapticFeedback?: boolean
}

/**
 * ボタンのタップアニメーションを管理するフック
 * デザインガイドライン v2準拠: scale(0.98) + 150ms
 */
export function useButtonAnimation(options: UseButtonAnimationOptions = {}) {
  const { scalePressed = 0.98 } = options
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: scalePressed,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start()
  }, [scaleAnim, scalePressed])

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start()
  }, [scaleAnim])

  return {
    scaleAnim,
    handlePressIn,
    handlePressOut,
    animatedStyle: {
      transform: [{ scale: scaleAnim }],
    },
  }
}

/**
 * カードホバー風アニメーション（タップ時）
 * デザインガイドライン v2準拠: translateY(-2px) + シャドウ増加
 */
export function useCardAnimation() {
  const translateYAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateYAnim, {
        toValue: -2,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1.01,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }),
    ]).start()
  }, [translateYAnim, scaleAnim])

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateYAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }),
    ]).start()
  }, [translateYAnim, scaleAnim])

  return {
    translateYAnim,
    scaleAnim,
    handlePressIn,
    handlePressOut,
    animatedStyle: {
      transform: [
        { translateY: translateYAnim },
        { scale: scaleAnim },
      ],
    },
  }
}

/**
 * アイコンホバーアニメーション
 * デザインガイドライン v2準拠: scale(1.1)
 */
export function useIconAnimation() {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1.1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start()
  }, [scaleAnim])

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start()
  }, [scaleAnim])

  return {
    scaleAnim,
    handlePressIn,
    handlePressOut,
    animatedStyle: {
      transform: [{ scale: scaleAnim }],
    },
  }
}

/**
 * パルスアニメーション（ローディングインジケータなど）
 */
export function usePulseAnimation(duration = 1000) {
  const opacityAnim = useRef(new Animated.Value(1)).current

  const startPulse = useCallback(() => {
    const pulse = Animated.sequence([
      Animated.timing(opacityAnim, {
        toValue: 0.5,
        duration: duration / 2,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: duration / 2,
        useNativeDriver: true,
      }),
    ])

    Animated.loop(pulse).start()
  }, [opacityAnim, duration])

  const stopPulse = useCallback(() => {
    opacityAnim.stopAnimation()
    opacityAnim.setValue(1)
  }, [opacityAnim])

  return {
    opacityAnim,
    startPulse,
    stopPulse,
    animatedStyle: {
      opacity: opacityAnim,
    },
  }
}

/**
 * シェイクアニメーション（エラーフィードバック）
 */
export function useShakeAnimation() {
  const shakeAnim = useRef(new Animated.Value(0)).current

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start()
  }, [shakeAnim])

  return {
    shakeAnim,
    shake,
    animatedStyle: {
      transform: [{ translateX: shakeAnim }],
    },
  }
}

/**
 * バウンスアニメーション（成功フィードバック）
 */
export function useBounceAnimation() {
  const bounceAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0)).current

  const bounce = useCallback(() => {
    scaleAnim.setValue(0)
    bounceAnim.setValue(-20)

    Animated.parallel([
      Animated.spring(bounceAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 4,
        tension: 50,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
        tension: 50,
      }),
    ]).start()
  }, [bounceAnim, scaleAnim])

  return {
    bounceAnim,
    scaleAnim,
    bounce,
    animatedStyle: {
      transform: [
        { translateY: bounceAnim },
        { scale: scaleAnim },
      ],
    },
  }
}

/**
 * フェードインアニメーション
 */
export function useFadeAnimation(initialValue = 0) {
  const fadeAnim = useRef(new Animated.Value(initialValue)).current

  const fadeIn = useCallback((duration = animation.duration.default) => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start()
  }, [fadeAnim])

  const fadeOut = useCallback((duration = animation.duration.default) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    }).start()
  }, [fadeAnim])

  return {
    fadeAnim,
    fadeIn,
    fadeOut,
    animatedStyle: {
      opacity: fadeAnim,
    },
  }
}
