import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import {
  BannerAd,
  BannerAdSize,
  AdEventType,
} from 'react-native-google-mobile-ads'

interface AdBannerProps {
  unitId: string
}

export function AdBanner({ unitId }: AdBannerProps) {
  const [isAdLoaded, setIsAdLoaded] = useState(false)

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
