import { useState, useRef, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MapView, { Region, PROVIDER_DEFAULT } from 'react-native-maps'
import * as Location from 'expo-location'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors, spacing } from '@/constants/theme'

// エリアごとのデフォルト位置
const AREA_DEFAULTS = {
  TOKYO: {
    latitude: 35.6812,
    longitude: 139.7671,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  },
  SENDAI: {
    latitude: 38.2682,
    longitude: 140.8694,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  },
}

export interface LocationData {
  latitude: number
  longitude: number
  address: string | null
}

interface LocationPickerModalProps {
  visible: boolean
  onClose: () => void
  onSelect: (location: LocationData) => void
  initialLocation?: { latitude: number; longitude: number } | null
  area?: 'TOKYO' | 'SENDAI'
}

export function LocationPickerModal({
  visible,
  onClose,
  onSelect,
  initialLocation,
  area = 'TOKYO',
}: LocationPickerModalProps) {
  const insets = useSafeAreaInsets()
  const mapRef = useRef<MapView>(null)

  const [region, setRegion] = useState<Region>(
    initialLocation
      ? {
          ...initialLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      : AREA_DEFAULTS[area]
  )
  const [address, setAddress] = useState<string | null>(null)
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

  // 逆ジオコーディングで住所を取得
  const fetchAddress = useCallback(async (latitude: number, longitude: number) => {
    setIsLoadingAddress(true)
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude })
      if (results.length > 0) {
        const result = results[0]
        // 日本の住所形式で組み立て
        const parts = [
          result.region,      // 都道府県
          result.city,        // 市区町村
          result.district,    // 区
          result.street,      // 町名
          result.streetNumber // 番地
        ].filter(Boolean)

        const formattedAddress = parts.length > 0
          ? parts.join('')
          : result.name || '住所を取得できませんでした'
        setAddress(formattedAddress)
      } else {
        setAddress(null)
      }
    } catch (error) {
      console.error('Reverse geocode error:', error)
      setAddress(null)
    } finally {
      setIsLoadingAddress(false)
    }
  }, [])

  // モーダルが開いた時に初期位置の住所を取得
  useEffect(() => {
    if (visible) {
      const lat = initialLocation?.latitude || AREA_DEFAULTS[area].latitude
      const lng = initialLocation?.longitude || AREA_DEFAULTS[area].longitude
      fetchAddress(lat, lng)
    }
  }, [visible, initialLocation, area, fetchAddress])

  // マップの移動が完了したとき
  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
    setRegion(newRegion)
    fetchAddress(newRegion.latitude, newRegion.longitude)
  }, [fetchAddress])

  // 現在地を取得
  const handleGetCurrentLocation = async () => {
    if (isLocating) return

    setIsLocating(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('権限エラー', '位置情報の使用が許可されていません')
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      const newRegion: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }

      mapRef.current?.animateToRegion(newRegion, 500)
      setRegion(newRegion)
      fetchAddress(newRegion.latitude, newRegion.longitude)
    } catch (error) {
      console.error('Get location error:', error)
      Alert.alert('エラー', '現在地を取得できませんでした')
    } finally {
      setIsLocating(false)
    }
  }

  // 場所を確定
  const handleConfirm = () => {
    onSelect({
      latitude: region.latitude,
      longitude: region.longitude,
      address,
    })
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color={colors.primary[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>場所を選択</Text>
          <View style={styles.closeButton} />
        </View>

        {/* マップ */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={
              initialLocation
                ? {
                    ...initialLocation,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }
                : AREA_DEFAULTS[area]
            }
            onRegionChangeComplete={handleRegionChangeComplete}
            showsUserLocation
            showsMyLocationButton={false}
          />

          {/* 中央の固定ピン */}
          <View style={styles.centerPinContainer} pointerEvents="none">
            <View style={styles.centerPin}>
              <MaterialCommunityIcons name="map-marker" size={40} color={colors.accent[600]} />
            </View>
            {/* ピンの影 */}
            <View style={styles.pinShadow} />
          </View>

          {/* 現在地ボタン */}
          <TouchableOpacity
            style={[styles.locationButton, { top: spacing.md }]}
            onPress={handleGetCurrentLocation}
            disabled={isLocating}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={colors.primary[500]} />
            ) : (
              <MaterialCommunityIcons name="crosshairs-gps" size={22} color={colors.primary[700]} />
            )}
          </TouchableOpacity>
        </View>

        {/* フッター */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          {/* 選択中の住所 */}
          <View style={styles.addressContainer}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.primary[500]} />
            {isLoadingAddress ? (
              <ActivityIndicator size="small" color={colors.primary[400]} style={styles.addressLoader} />
            ) : (
              <Text style={styles.addressText} numberOfLines={2}>
                {address || '地図を動かして場所を選択してください'}
              </Text>
            )}
          </View>

          {/* 確定ボタン */}
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>この場所を選択</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[200],
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary[900],
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  centerPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40,
    alignItems: 'center',
  },
  centerPin: {
    // ピンを少し上にオフセット（ピンの先端が中央に来るように）
  },
  pinShadow: {
    width: 8,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 4,
    marginTop: -4,
  },
  locationButton: {
    position: 'absolute',
    right: spacing.md,
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
  footer: {
    backgroundColor: colors.white,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.primary[200],
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    minHeight: 44,
  },
  addressLoader: {
    marginLeft: spacing.sm,
  },
  addressText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.primary[700],
    lineHeight: 20,
  },
  confirmButton: {
    backgroundColor: colors.accent[600],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
})
