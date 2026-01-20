import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Text,
  Dimensions,
} from 'react-native'
import MapView, { Marker, Region, PROVIDER_DEFAULT } from 'react-native-maps'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
import * as Location from 'expo-location'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useNearbyStore } from '@/stores/nearby'
import { NearbyItem } from '@/services/nearby'
import { colors, spacing } from '@/constants/theme'
import { CategoryIcon } from './CategoryIcon'

// 東京駅をデフォルト位置として使用
const DEFAULT_REGION: Region = {
  latitude: 35.6812,
  longitude: 139.7671,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
}

// デバウンス用のタイムアウトID
let fetchDebounceTimeout: ReturnType<typeof setTimeout> | null = null

export interface NearbyMapRef {
  focusOnItem: (item: NearbyItem, bottomOffset?: number) => void
}

interface NearbyMapProps {
  onItemSelect?: (item: NearbyItem | null) => void
  topOffset?: number
}

export const NearbyMap = forwardRef<NearbyMapRef, NearbyMapProps>(
  function NearbyMap({ onItemSelect, topOffset = 60 }, ref) {
    const mapRef = useRef<MapView>(null)
    const [region, setRegion] = useState<Region>(DEFAULT_REGION)
    const [locationPermission, setLocationPermission] = useState<boolean | null>(null)
    const [isLocating, setIsLocating] = useState(false)
    const [isFocusing, setIsFocusing] = useState(false) // フォーカス中フラグ

    const {
      selectedItem,
      isLoading,
      fetchNearby,
      fetchByBounds,
      selectItem,
      setCenter,
      getFilteredItems,
    } = useNearbyStore()

    // フィルタリングされたアイテム（選択中のアイテムは常に含める）
    const baseFilteredItems = getFilteredItems()
    const filteredItems = selectedItem && !baseFilteredItems.some(
      item => item.id === selectedItem.id && item.type === selectedItem.type
    )
      ? [...baseFilteredItems, selectedItem]
      : baseFilteredItems

    // 外部から呼び出し可能なメソッドを公開
    useImperativeHandle(ref, () => ({
      focusOnItem: (item: NearbyItem, bottomOffset?: number) => {
        focusOnItem(item, bottomOffset)
      },
    }))

    // 位置情報の権限を取得
    useEffect(() => {
      checkLocationPermission()
    }, [])

    const checkLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        const granted = status === 'granted'
        setLocationPermission(granted)

        if (granted) {
          getCurrentLocation()
        }
      } catch (error) {
        console.error('Location permission error:', error)
        setLocationPermission(false)
      }
    }

    const getCurrentLocation = async () => {
      if (isLocating) return

      setIsLocating(true)
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })

        const newRegion: Region = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }

        setRegion(newRegion)
        setCenter({ lat: location.coords.latitude, lng: location.coords.longitude })
        mapRef.current?.animateToRegion(newRegion, 500)

        // 周辺データを取得
        await fetchNearby(location.coords.latitude, location.coords.longitude)
      } catch (error) {
        console.error('Get location error:', error)
        Alert.alert('エラー', '現在地を取得できませんでした')
      } finally {
        setIsLocating(false)
      }
    }

    // アイテムにフォーカス（リストからの選択時）
    // bottomOffset: ボトムシートの高さ（ピクセル）
    const focusOnItem = useCallback((item: NearbyItem, bottomOffset: number = 0) => {
      setIsFocusing(true)

      const latitudeDelta = 0.01

      // ボトムシートの高さを考慮して、マーカーが可視領域の中央に来るようオフセット
      //
      // 緯度が大きい = 北 = 画面上部に表示
      // 緯度が小さい = 南 = 画面下部に表示
      //
      // マーカーを画面上部（可視領域の中央）に表示するには、
      // マップの中央をマーカーより南（緯度が小さい）に設定する
      // つまり、緯度を減算する
      //
      // オフセット距離 = bottomOffset / 2 ピクセル
      // 緯度オフセット = (オフセット距離 / 画面高さ) * latitudeDelta
      const latitudeOffset = bottomOffset > 0
        ? (bottomOffset / 2 / SCREEN_HEIGHT) * latitudeDelta
        : 0

      const targetRegion: Region = {
        latitude: item.latitude - latitudeOffset,  // 減算でマーカーを上に表示
        longitude: item.longitude,
        latitudeDelta,
        longitudeDelta: 0.01,
      }

      mapRef.current?.animateToRegion(targetRegion, 300)
      selectItem(item)

      // フォーカス完了後にフラグをリセット
      setTimeout(() => {
        setIsFocusing(false)
      }, 500)
    }, [selectItem])

    // マップの移動が完了したとき（デバウンス付き）
    const handleRegionChangeComplete = useCallback(async (newRegion: Region) => {
      setRegion(newRegion)

      // フォーカス中はAPI呼び出しをスキップ
      if (isFocusing) return

      // デバウンス処理（800ms）
      if (fetchDebounceTimeout) {
        clearTimeout(fetchDebounceTimeout)
      }

      fetchDebounceTimeout = setTimeout(async () => {
        // バウンディングボックスでデータを取得
        const bounds = {
          north: newRegion.latitude + newRegion.latitudeDelta / 2,
          south: newRegion.latitude - newRegion.latitudeDelta / 2,
          east: newRegion.longitude + newRegion.longitudeDelta / 2,
          west: newRegion.longitude - newRegion.longitudeDelta / 2,
        }

        await fetchByBounds(bounds)
      }, 800)
    }, [fetchByBounds, isFocusing])

    // マーカーをタップしたとき
    const handleMarkerPress = (item: NearbyItem) => {
      selectItem(item)
      onItemSelect?.(item)
    }

    // マーカーの色を取得
    const getMarkerColor = (item: NearbyItem): string => {
      if (item.type === 'recruitment') {
        return '#FF6B35' // オレンジ系
      }
      return colors.accent[600] // 緑系
    }

    // 選択されたマーカーかどうか
    const isSelected = (item: NearbyItem): boolean => {
      return selectedItem?.id === item.id && selectedItem?.type === item.type
    }

    return (
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={DEFAULT_REGION}
          onRegionChangeComplete={handleRegionChangeComplete}
          showsUserLocation={locationPermission === true}
          showsMyLocationButton={false}
          onPress={() => {
            selectItem(null)
            onItemSelect?.(null)
          }}
        >
          {filteredItems.map((item) => (
            <Marker
              key={`${item.type}-${item.id}`}
              coordinate={{
                latitude: item.latitude,
                longitude: item.longitude,
              }}
              onPress={() => handleMarkerPress(item)}
              zIndex={isSelected(item) ? 1000 : 1}
            >
              {/* カスタムマーカー（選択状態で大きくする） */}
              <View style={[
                styles.markerContainer,
                isSelected(item) && styles.markerContainerSelected,
              ]}>
                <View style={[
                  styles.marker,
                  { backgroundColor: getMarkerColor(item) },
                  isSelected(item) && styles.markerSelected,
                ]}>
                  <CategoryIcon
                    name={item.category.icon}
                    size={isSelected(item) ? 20 : 16}
                    color={colors.white}
                  />
                </View>
                <View style={[
                  styles.markerArrow,
                  { borderTopColor: getMarkerColor(item) },
                ]} />
              </View>
            </Marker>
          ))}
        </MapView>

        {/* ローディング表示 */}
        {isLoading && (
          <View style={[styles.loadingOverlay, { top: topOffset }]}>
            <View style={styles.loadingBadge}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
              <Text style={styles.loadingText}>読込中...</Text>
            </View>
          </View>
        )}

        {/* 凡例（左上） */}
        <View style={[styles.legend, { top: topOffset }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF6B35' }]} />
            <Text style={styles.legendText}>募集</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accent[600] }]} />
            <Text style={styles.legendText}>誘われ待ち</Text>
          </View>
        </View>

        {/* 現在地ボタン（凡例の下） */}
        <TouchableOpacity
          style={[styles.locationButton, { top: topOffset + 70 }]}
          onPress={getCurrentLocation}
          disabled={isLocating}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color={colors.primary[500]} />
          ) : (
            <MaterialCommunityIcons name="crosshairs-gps" size={22} color={colors.primary[700]} />
          )}
        </TouchableOpacity>
      </View>
    )
  }
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    marginLeft: spacing.xs,
    fontSize: 12,
    color: colors.primary[500],
  },
  locationButton: {
    position: 'absolute',
    left: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legend: {
    position: 'absolute',
    left: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: 11,
    color: colors.primary[600],
  },

  // カスタムマーカースタイル
  markerContainer: {
    alignItems: 'center',
  },
  markerContainerSelected: {
    transform: [{ scale: 1.2 }],
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markerSelected: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 3,
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
})
