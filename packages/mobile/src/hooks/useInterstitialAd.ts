import { useEffect, useRef, useCallback } from 'react'
import {
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads'

export function useInterstitialAd(unitId: string) {
  const adRef = useRef<InterstitialAd | null>(null)
  const isLoadedRef = useRef(false)

  useEffect(() => {
    const ad = InterstitialAd.createForAdRequest(unitId)

    const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      isLoadedRef.current = true
    })

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      isLoadedRef.current = false
      ad.load()
    })

    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, () => {
      isLoadedRef.current = false
    })

    adRef.current = ad
    ad.load()

    return () => {
      unsubscribeLoaded()
      unsubscribeClosed()
      unsubscribeError()
    }
  }, [unitId])

  const showAd = useCallback((): boolean => {
    if (adRef.current && isLoadedRef.current) {
      adRef.current.show()
      return true
    }
    return false
  }, [])

  return { showAd }
}
