import { ref, readonly } from 'vue'

export interface GeolocationPosition {
  latitude: number
  longitude: number
}

export function useGeolocation() {
  const position = ref<GeolocationPosition | null>(null)
  const error = ref<string | null>(null)
  const isLoading = ref(false)

  const isSupported = 'geolocation' in navigator

  const getCurrentPosition = (): Promise<GeolocationPosition | null> => {
    return new Promise((resolve) => {
      if (!isSupported) {
        error.value = '位置情報がサポートされていません'
        resolve(null)
        return
      }

      isLoading.value = true
      error.value = null

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: GeolocationPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }
          position.value = coords
          isLoading.value = false
          resolve(coords)
        },
        (err) => {
          isLoading.value = false
          switch (err.code) {
            case err.PERMISSION_DENIED:
              error.value = '位置情報の取得が許可されていません'
              break
            case err.POSITION_UNAVAILABLE:
              error.value = '位置情報を取得できませんでした'
              break
            case err.TIMEOUT:
              error.value = '位置情報の取得がタイムアウトしました'
              break
            default:
              error.value = '位置情報の取得に失敗しました'
          }
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      )
    })
  }

  return {
    position: readonly(position),
    error: readonly(error),
    isLoading: readonly(isLoading),
    isSupported,
    getCurrentPosition,
  }
}

/**
 * 2点間の距離を計算（ハベルシンの公式）
 * @returns 距離（km）
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // 地球の半径（km）
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

/**
 * 距離を見やすい形式にフォーマット
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`
  }
  return `${distanceKm.toFixed(1)}km`
}
