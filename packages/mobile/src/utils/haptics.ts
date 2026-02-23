/**
 * ハプティックフィードバックユーティリティ
 * マイクロインタラクションの一環として、ユーザーアクションに対する触覚フィードバックを提供
 */
import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

// iOSでのみハプティックを有効化（Androidは端末によって挙動が異なるため）
const isHapticsEnabled = Platform.OS === 'ios'

/**
 * 軽いタップフィードバック
 * ボタン、カードのタップ時に使用
 */
export function lightTap(): void {
  if (isHapticsEnabled) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }
}

/**
 * 中程度のタップフィードバック
 * 重要なアクション（送信、確認）時に使用
 */
export function mediumTap(): void {
  if (isHapticsEnabled) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }
}

/**
 * 強いタップフィードバック
 * 削除、キャンセルなど破壊的なアクション時に使用
 */
export function heavyTap(): void {
  if (isHapticsEnabled) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
  }
}

/**
 * 成功フィードバック
 * 操作が正常に完了した時に使用
 */
export function successFeedback(): void {
  if (isHapticsEnabled) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }
}

/**
 * 警告フィードバック
 * 注意が必要な操作時に使用
 */
export function warningFeedback(): void {
  if (isHapticsEnabled) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  }
}

/**
 * エラーフィードバック
 * 操作が失敗した時に使用
 */
export function errorFeedback(): void {
  if (isHapticsEnabled) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  }
}

/**
 * 選択フィードバック
 * ピッカーやスライダーの値変更時に使用
 */
export function selectionFeedback(): void {
  if (isHapticsEnabled) {
    Haptics.selectionAsync()
  }
}
