import { Platform } from 'react-native'
import { TestIds } from 'react-native-google-mobile-ads'

const isTestMode = __DEV__

const PRODUCTION_IDS = {
  BANNER_MAP: Platform.select({
    ios: 'ca-app-pub-5939068883130290/5136427820',
    android: '',
  }) || '',
  BANNER_GROUPS: Platform.select({
    ios: 'ca-app-pub-5939068883130290/1637339977',
    android: '',
  }) || '',
  INTERSTITIAL_CREATE: Platform.select({
    ios: 'ca-app-pub-5939068883130290/2039890578',
    android: '',
  }) || '',
}

export const AD_UNIT_IDS = {
  BANNER_MAP: isTestMode ? TestIds.ADAPTIVE_BANNER : PRODUCTION_IDS.BANNER_MAP,
  BANNER_GROUPS: isTestMode ? TestIds.ADAPTIVE_BANNER : PRODUCTION_IDS.BANNER_GROUPS,
  INTERSTITIAL_CREATE: isTestMode ? TestIds.INTERSTITIAL : PRODUCTION_IDS.INTERSTITIAL_CREATE,
}
