import { useState, useEffect } from 'react'
import { View, StyleSheet, Platform } from 'react-native'
import Constants from 'expo-constants'

interface AdBannerProps {
  unitId: string
}

// Expo Go かどうかを判定
const isExpoGo = Constants.appOwnership === 'expo'

// 開発モードかどうか
const isDev = __DEV__

export function AdBanner({ unitId }: AdBannerProps) {
  const [isAdLoaded, setIsAdLoaded] = useState(false)
  const [AdModule, setAdModule] = useState<any>(null)

  useEffect(() => {
    // Expo Go または開発モードでは広告を表示しない
    if (isExpoGo || isDev) {
      return
    }

    // 動的インポートでネイティブモジュールを読み込む
    import('react-native-google-mobile-ads')
      .then((module) => {
        setAdModule(module)
      })
      .catch((error) => {
        console.log('[AdBanner] Failed to load ads module:', error.message)
      })
  }, [])

  // Expo Go または開発モードでは何も表示しない
  if (isExpoGo || isDev || !AdModule) {
    return null
  }

  const { BannerAd, BannerAdSize } = AdModule

  return (
    <View style={[styles.container, !isAdLoaded && styles.hidden]}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => setIsAdLoaded(true)}
        onAdFailedToLoad={() => setIsAdLoaded(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  hidden: {
    height: 0,
    overflow: 'hidden',
  },
})
