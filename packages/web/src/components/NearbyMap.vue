<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet'
import L from 'leaflet'
// NOTE: クラスタリングは一時廃止。将来再実装する場合は以下を有効化
// import 'leaflet.markercluster'
import type { Map as LeafletMap } from 'leaflet'
import type { NearbyItem } from '@machi/shared'
import { AREA_CENTER_COORDS, type Area } from '@machi/shared'
import { useNearbyStore } from '../stores/nearby'
import { useAuthStore } from '../stores/auth'
import { useGeolocation } from '../composables/useGeolocation'
import MdiIcon from './MdiIcon.vue'
import { mdiCrosshairsGps } from '../lib/icons'

import 'leaflet/dist/leaflet.css'
// NOTE: クラスタリング用CSS（将来再実装時に有効化）
// import 'leaflet.markercluster/dist/MarkerCluster.css'
// import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

interface Props {
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: '40vh',
})

const emit = defineEmits<{
  itemSelect: [item: NearbyItem]
  detailClick: [item: NearbyItem]
}>()

const nearbyStore = useNearbyStore()
const authStore = useAuthStore()
const { getCurrentPosition, isLoading: gpsLoading } = useGeolocation()

const mapRef = ref<{ leafletObject: LeafletMap } | null>(null)
const zoom = ref(14)
const center = ref<[number, number]>([0, 0])
const isMapReady = ref(false)

// Leafletオブジェクトはリアクティブにしない（Vueのリアクティブシステムと競合するため）
// NOTE: クラスタリング廃止につき、通常のLayerGroupを使用
let markerLayer: L.LayerGroup | null = null
const markersMap = new Map<string, L.Marker>()

// デバウンス用
let updateMarkersTimeout: ReturnType<typeof setTimeout> | null = null
let fetchBoundsTimeout: ReturnType<typeof setTimeout> | null = null

// 更新中フラグ（競合状態を防ぐ）
let isUpdatingMarkers = false
let pendingUpdate = false

// ユーザーの初期位置を取得
const userLocation = computed(() => {
  const user = authStore.user
  if (user?.latitude && user?.longitude) {
    return { lat: user.latitude, lng: user.longitude }
  }
  // エリアのデフォルト中心を返す
  const area = user?.area as Area | undefined
  if (area && AREA_CENTER_COORDS[area]) {
    return {
      lat: AREA_CENTER_COORDS[area].latitude,
      lng: AREA_CENTER_COORDS[area].longitude,
    }
  }
  return { lat: 35.6812, lng: 139.7671 } // 東京駅
})

// カスタムアイコンを作成
const createMarkerIcon = (item: NearbyItem) => {
  const isRecruitment = item.type === 'recruitment'
  const color = isRecruitment ? '#f97316' : '#22c55e' // オレンジ or 緑
  const icon = isRecruitment ? '📢' : '👋'

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="marker-container" style="
        background-color: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 16px;
        cursor: pointer;
        transition: transform 0.2s;
      ">
        ${icon}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  })
}

// ポップアップコンテンツを作成
const createPopupContent = (item: NearbyItem) => {
  const buttonStyle = `
    display: block;
    width: 100%;
    margin-top: 8px;
    padding: 6px 12px;
    background-color: #0284c7;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    text-align: center;
  `

  if (item.type === 'recruitment') {
    return `
      <div class="popup-content" style="min-width: 180px; padding: 4px;">
        <div style="font-weight: 600; margin-bottom: 4px;">${item.title}</div>
        <div style="font-size: 12px; color: #666;">
          ${item.creator?.nickname || '匿名'} ・ ${item.currentPeople}/${item.maxPeople}人
        </div>
        <div style="font-size: 11px; color: #888; margin-top: 4px;">
          ${item.category.name}
        </div>
        <button class="popup-detail-btn" data-item-id="${item.id}" data-item-type="recruitment" style="${buttonStyle}">
          詳細を見る
        </button>
      </div>
    `
  } else {
    return `
      <div class="popup-content" style="min-width: 180px; padding: 4px;">
        <div style="font-weight: 600; margin-bottom: 4px;">${item.user?.nickname || '匿名'}</div>
        <div style="font-size: 12px; color: #666;">
          ${item.category.name}
        </div>
        <div style="font-size: 11px; color: #888; margin-top: 4px;">
          ${item.timing === 'THIS_WEEK' ? '今週' : item.timing === 'NEXT_WEEK' ? '来週' : item.timing === 'THIS_MONTH' ? '今月' : 'いつでも'}
        </div>
        <button class="popup-detail-btn" data-item-id="${item.id}" data-item-type="wantToDo" style="${buttonStyle}">
          詳細を見る
        </button>
      </div>
    `
  }
}

// ポップアップ内のボタンクリックハンドラを設定
const setupPopupButtonHandler = () => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('popup-detail-btn')) {
      const itemId = target.dataset.itemId
      const item = nearbyStore.items.find((i) => i.id === itemId)
      if (item) {
        emit('detailClick', item)
      }
    }
  })
}

// マーカーを更新（完全リビルド方式 - 差分更新で発生するエラーを回避）
const updateMarkers = () => {
  // デバウンス: 連続呼び出しを防ぐ
  if (updateMarkersTimeout) {
    clearTimeout(updateMarkersTimeout)
  }

  updateMarkersTimeout = setTimeout(() => {
    doUpdateMarkers()
  }, 200)
}

// 実際のマーカー更新処理（差分更新方式）
const doUpdateMarkers = () => {
  const map = mapRef.value?.leafletObject
  if (!map || !markerLayer) return

  // 更新中なら後で再試行
  if (isUpdatingMarkers) {
    pendingUpdate = true
    return
  }

  isUpdatingMarkers = true

  try {
    const newItems = nearbyStore.filteredItems
    const newItemIds = new Set(newItems.map((item) => item.id))
    const existingIds = new Set(markersMap.keys())

    // 削除されたアイテムのマーカーを削除
    existingIds.forEach((id) => {
      if (!newItemIds.has(id)) {
        const marker = markersMap.get(id)
        if (marker && markerLayer) {
          markerLayer.removeLayer(marker)
          markersMap.delete(id)
        }
      }
    })

    // 新しいアイテムのマーカーを追加
    newItems.forEach((item) => {
      if (!markersMap.has(item.id)) {
        const marker = L.marker([item.latitude, item.longitude], {
          icon: createMarkerIcon(item),
        })

        marker.bindPopup(createPopupContent(item), {
          closeButton: false,
          offset: [0, -5],
        })

        marker.on('click', () => {
          nearbyStore.selectItem(item.id)
          emit('itemSelect', item)
        })

        markersMap.set(item.id, marker)
        markerLayer?.addLayer(marker)
      }
    })
  } finally {
    isUpdatingMarkers = false

    // 保留中の更新があれば実行
    if (pendingUpdate) {
      pendingUpdate = false
      setTimeout(doUpdateMarkers, 100)
    }
  }
}

// フォーカス中フラグ（moveendイベントを抑制）
let isFocusing = false
// 最後にフォーカスしたアイテムID（重複フォーカス防止）
let lastFocusedItemId: string | null = null

// 選択されたアイテムにフォーカス
const focusOnItem = (item: NearbyItem) => {
  const map = mapRef.value?.leafletObject
  const marker = markersMap.get(item.id)
  if (map && marker) {
    // フォーカス中はmoveendでのfetch/updateを抑制
    isFocusing = true
    lastFocusedItemId = item.id

    // アニメーションなしでビューを設定（競合を避けるため）
    map.setView([item.latitude, item.longitude], Math.max(map.getZoom(), 15), { animate: false })

    // ポップアップを開く
    setTimeout(() => {
      marker.openPopup()
      isFocusing = false
    }, 50)
  }
}

// 地図移動終了時のハンドラ（デバウンス付き）
const handleMoveEnd = () => {
  // フォーカス中は何もしない
  if (isFocusing) return

  // デバッグ: 現在のズームレベルを出力
  const map = mapRef.value?.leafletObject
  if (map) {
    console.log('[NearbyMap] Current zoom level:', map.getZoom(), '| Max zoom:', map.getMaxZoom())
  }

  // ユーザー操作による移動なので、選択を解除
  nearbyStore.selectItem(null)

  // デバウンス: 連続移動での過剰なAPI呼び出しを防ぐ
  if (fetchBoundsTimeout) {
    clearTimeout(fetchBoundsTimeout)
  }

  fetchBoundsTimeout = setTimeout(async () => {
    const map = mapRef.value?.leafletObject
    if (!map || isFocusing) return

    const bounds = map.getBounds()
    await nearbyStore.fetchByBounds({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    })
  }, 500)
}

// 現在地に移動
const moveToCurrentLocation = async () => {
  const position = await getCurrentPosition()
  if (position) {
    const map = mapRef.value?.leafletObject
    if (map) {
      map.setView([position.latitude, position.longitude], 15, { animate: true })
    }
  }
}

// マップ初期化（@readyイベントから呼び出される）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initializeMap = async (map: any) => {
  // マーカーレイヤーを作成（クラスタリングは一時廃止）
  // NOTE: 将来クラスタリングを再実装する場合は L.markerClusterGroup() を使用
  markerLayer = L.layerGroup()
  map.addLayer(markerLayer)

  // サイズを再計算（コンテナサイズ確定後）
  await nextTick()
  map.invalidateSize()

  // 初期位置に移動
  center.value = [userLocation.value.lat, userLocation.value.lng]
  map.setView(center.value, zoom.value)

  // 初期データを取得
  await nearbyStore.fetchNearby(userLocation.value.lat, userLocation.value.lng)

  // マップ準備完了
  isMapReady.value = true

  // 初期マーカーを表示
  updateMarkers()

  // 移動終了イベントを設定
  map.on('moveend', handleMoveEnd)
}

// LMapの@readyイベントハンドラ
const handleMapReady = () => {
  const map = mapRef.value?.leafletObject
  if (map) {
    initializeMap(map)
  }
}

// 外部からサイズ再計算を呼び出すための関数
const invalidateSize = () => {
  const map = mapRef.value?.leafletObject
  if (map) {
    nextTick(() => {
      map.invalidateSize()
    })
  }
}

// アイテムの変更を監視
watch(
  () => nearbyStore.filteredItems,
  () => {
    if (isMapReady.value) {
      updateMarkers()
    }
  },
  { deep: true }
)

// 選択アイテムの変更を監視
watch(
  () => nearbyStore.selectedItem,
  (item) => {
    if (item) {
      // 同じアイテムへの重複フォーカスを防ぐ
      if (item.id !== lastFocusedItemId) {
        focusOnItem(item)
      }
    } else {
      // 選択解除時はlastFocusedItemIdをリセット
      lastFocusedItemId = null
    }
  }
)

onMounted(() => {
  // ポップアップ内のボタンクリックハンドラを設定
  setupPopupButtonHandler()
})

onBeforeUnmount(() => {
  // タイムアウトをクリア
  if (updateMarkersTimeout) {
    clearTimeout(updateMarkersTimeout)
    updateMarkersTimeout = null
  }
  if (fetchBoundsTimeout) {
    clearTimeout(fetchBoundsTimeout)
    fetchBoundsTimeout = null
  }

  // 更新中フラグを設定して、進行中の更新を止める
  isUpdatingMarkers = true
  pendingUpdate = false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map = mapRef.value?.leafletObject as any

  // vue-leafletのcleanup（map.remove()）をスキップするため、
  // mapの内部レイヤー参照を空にする
  // これにより map.remove() が呼ばれてもマーカーのonRemoveが走らない
  if (map) {
    try {
      // イベントリスナーを解除
      map.off('moveend', handleMoveEnd)

      // map._layersを空にしてcleanup時のエラーを防ぐ
      if (map._layers) {
        map._layers = {}
      }
    } catch {
      // エラーを無視
    }
  }

  // マーカーマップをクリア
  markersMap.clear()
  markerLayer = null
})

// 外部からアイテムを選択するための関数をexpose
defineExpose({
  focusOnItem,
  invalidateSize,
})
</script>

<template>
  <div class="relative" :style="{ height: props.height }">
    <LMap
      ref="mapRef"
      v-model:zoom="zoom"
      v-model:center="center"
      :use-global-leaflet="false"
      :zoom-control="false"
      class="w-full h-full"
      @ready="handleMapReady"
    >
      <LTileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        :attribution="'&copy; <a href=&quot;https://www.openstreetmap.org/copyright&quot;>OpenStreetMap</a>'"
      />
    </LMap>

    <!-- GPS Button (左下) -->
    <button
      @click="moveToCurrentLocation"
      :disabled="gpsLoading"
      class="absolute z-[1000] bottom-4 left-4 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
    >
      <MdiIcon
        :path="mdiCrosshairsGps"
        :size="22"
        :class="gpsLoading ? 'animate-pulse text-primary-600' : 'text-gray-700'"
      />
    </button>

    <!-- Loading Overlay -->
    <div
      v-if="nearbyStore.isLoading"
      class="absolute inset-0 z-[999] bg-white/50 flex items-center justify-center pointer-events-none"
    >
      <div class="bg-white rounded-lg shadow-lg px-4 py-2 text-sm text-gray-600">
        読み込み中...
      </div>
    </div>
  </div>
</template>

<style>
/* カスタムマーカースタイル */
.custom-marker {
  background: transparent;
  border: none;
}

.marker-container:hover {
  transform: scale(1.1);
}

/* NOTE: クラスターアイコンスタイル（将来再実装時に有効化）
.custom-cluster {
  background: transparent;
}

.cluster-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: bold;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.cluster-small {
  background-color: #3b82f6;
  width: 36px;
  height: 36px;
  font-size: 12px;
}

.cluster-medium {
  background-color: #f59e0b;
  width: 42px;
  height: 42px;
  font-size: 14px;
}

.cluster-large {
  background-color: #ef4444;
  width: 48px;
  height: 48px;
  font-size: 16px;
}
*/

/* Leaflet ポップアップスタイル調整 */
.leaflet-popup-content-wrapper {
  border-radius: 8px;
}

.leaflet-popup-content {
  margin: 8px 12px;
}
</style>
