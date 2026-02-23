import { Platform } from 'react-native'
import Constants from 'expo-constants'

// Expo Go かどうかを判定
const isExpoGo = Constants.appOwnership === 'expo'

const isTestMode = __DEV__

// テスト用広告ID（Expo Go や開発モードで使用）
const TEST_IDS = {
  ADAPTIVE_BANNER: 'ca-app-pub-3940256099942544/9214589741',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
}

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

// Expo Go または開発モードではテストIDを使用
export const AD_UNIT_IDS = {
  BANNER_MAP: isTestMode || isExpoGo ? TEST_IDS.ADAPTIVE_BANNER : PRODUCTION_IDS.BANNER_MAP,
  BANNER_GROUPS: isTestMode || isExpoGo ? TEST_IDS.ADAPTIVE_BANNER : PRODUCTION_IDS.BANNER_GROUPS,
  INTERSTITIAL_CREATE: isTestMode || isExpoGo ? TEST_IDS.INTERSTITIAL : PRODUCTION_IDS.INTERSTITIAL_CREATE,
}
