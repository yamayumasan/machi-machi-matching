import { useEffect, useRef, useCallback, useState } from 'react'
import Constants from 'expo-constants'

// Expo Go かどうかを判定
const isExpoGo = Constants.appOwnership === 'expo'

export function useInterstitialAd(unitId: string) {
  const adRef = useRef<any>(null)
  const isLoadedRef = useRef(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Expo Go または開発モードでは広告をスキップ
    if (isExpoGo || __DEV__) {
      return
    }

    // 動的インポートでネイティブモジュールを読み込む
    import('react-native-google-mobile-ads')
      .then(({ InterstitialAd, AdEventType }) => {
        const ad = InterstitialAd.createForAdRequest(unitId)

        const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
          isLoadedRef.current = true
          setIsReady(true)
        })

        const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
          isLoadedRef.current = false
          setIsReady(false)
          ad.load()
        })

        const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, () => {
          isLoadedRef.current = false
          setIsReady(false)
        })

        adRef.current = ad
        ad.load()

        return () => {
          unsubscribeLoaded()
          unsubscribeClosed()
          unsubscribeError()
        }
      })
      .catch((error) => {
        console.log('[useInterstitialAd] Failed to load ads module:', error.message)
      })
  }, [unitId])

  const showAd = useCallback((): boolean => {
    // Expo Go または開発モードでは何もしない
    if (isExpoGo || __DEV__) {
      return false
    }

    if (adRef.current && isLoadedRef.current) {
      adRef.current.show()
      return true
    }
    return false
  }, [])

  return { showAd, isReady }
}
