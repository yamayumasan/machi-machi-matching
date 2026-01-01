<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import type { Map as LeafletMap } from 'leaflet'
import type { NearbyItem } from '@machi/shared'
import { AREA_CENTER_COORDS, type Area } from '@machi/shared'
import { useNearbyStore } from '../stores/nearby'
import { useAuthStore } from '../stores/auth'
import { useGeolocation } from '../composables/useGeolocation'
import MdiIcon from './MdiIcon.vue'
import { mdiCrosshairsGps, mdiFilterVariant } from '../lib/icons'

import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

interface Props {
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: '40vh',
})

const emit = defineEmits<{
  itemSelect: [item: NearbyItem]
  filterClick: []
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
let clusterGroup: L.MarkerClusterGroup | null = null
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

// マーカーを更新（差分更新方式）
const updateMarkers = () => {
  // デバウンス: 連続呼び出しを防ぐ
  if (updateMarkersTimeout) {
    clearTimeout(updateMarkersTimeout)
  }

  updateMarkersTimeout = setTimeout(() => {
    doUpdateMarkers()
  }, 150)
}

// 実際のマーカー更新処理
const doUpdateMarkers = () => {
  const map = mapRef.value?.leafletObject
  if (!map || !clusterGroup) return

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

    // 削除するマーカーを特定
    const toRemove: string[] = []
    existingIds.forEach((id) => {
      if (!newItemIds.has(id)) {
        toRemove.push(id)
      }
    })

    // 追加するアイテムを特定
    const toAdd = newItems.filter((item) => !existingIds.has(item.id))

    // マーカーを削除
    toRemove.forEach((id) => {
      const marker = markersMap.get(id)
      if (marker && clusterGroup) {
        try {
          clusterGroup.removeLayer(marker)
        } catch {
          // 削除に失敗してもエラーを無視
        }
        markersMap.delete(id)
      }
    })

    // 新しいマーカーを追加
    toAdd.forEach((item) => {
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
      if (clusterGroup) {
        clusterGroup.addLayer(marker)
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

// マップ初期化
const initializeMap = async () => {
  await nextTick()
  const map = mapRef.value?.leafletObject
  if (!map) return

  // マーカークラスターグループを作成（非リアクティブ）
  clusterGroup = L.markerClusterGroup({
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    iconCreateFunction: (cluster) => {
      const count = cluster.getChildCount()
      const size = count < 10 ? 'small' : count < 30 ? 'medium' : 'large'
      return L.divIcon({
        html: `<div class="cluster-icon cluster-${size}">${count}</div>`,
        className: 'custom-cluster',
        iconSize: [40, 40],
      })
    },
  })

  map.addLayer(clusterGroup as unknown as L.Layer)

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
  // マップの準備ができたら初期化
  setTimeout(initializeMap, 100)
  // ポップアップ内のボタンクリックハンドラを設定
  setupPopupButtonHandler()
})

onBeforeUnmount(() => {
  // タイムアウトをクリア
  if (updateMarkersTimeout) {
    clearTimeout(updateMarkersTimeout)
  }
  if (fetchBoundsTimeout) {
    clearTimeout(fetchBoundsTimeout)
  }

  // 更新中フラグを設定して、進行中の更新を止める
  isUpdatingMarkers = true
  pendingUpdate = false

  const map = mapRef.value?.leafletObject
  if (map) {
    map.off('moveend', handleMoveEnd)
  }

  // 各マーカーのイベントリスナーを解除してからクラスターグループから削除
  // _leaflet_eventsエラーを防ぐため、マーカーを安全にクリーンアップ
  markersMap.forEach((marker) => {
    try {
      // マーカーのすべてのイベントリスナーを解除
      marker.off()
      // ポップアップを閉じて解除
      if (marker.getPopup()) {
        marker.closePopup()
        marker.unbindPopup()
      }
      // アイコンのDOM要素を事前に削除（_leaflet_eventsエラー防止）
      const icon = (marker as unknown as { _icon?: HTMLElement })._icon
      if (icon && icon.parentNode) {
        icon.parentNode.removeChild(icon)
      }
      const shadow = (marker as unknown as { _shadow?: HTMLElement })._shadow
      if (shadow && shadow.parentNode) {
        shadow.parentNode.removeChild(shadow)
      }
    } catch {
      // エラーを無視
    }
  })

  // クラスターグループの内部レイヤーをクリア（マーカーは既にクリーンアップ済み）
  if (clusterGroup) {
    try {
      // マーカーをクラスターから直接削除せず、内部配列をクリア
      // これによりLeafletの通常の削除プロセスをスキップ
      const cg = clusterGroup as unknown as {
        _featureGroup?: { clearLayers: () => void }
        _nonPointGroup?: { clearLayers: () => void }
        _needsClustering?: unknown[]
        _needsRemoving?: unknown[]
      }
      if (cg._featureGroup) {
        try { cg._featureGroup.clearLayers() } catch { /* ignore */ }
      }
      if (cg._nonPointGroup) {
        try { cg._nonPointGroup.clearLayers() } catch { /* ignore */ }
      }
      if (cg._needsClustering) cg._needsClustering = []
      if (cg._needsRemoving) cg._needsRemoving = []
    } catch {
      // エラーを無視
    }
  }

  // マーカーマップをクリア
  markersMap.clear()

  // クラスターグループをマップの内部レイヤーリストから直接削除
  // これによりvue-leafletのLMap.remove()がclusterGroupを削除しようとするのを防ぐ
  if (map && clusterGroup) {
    try {
      // マップの内部_layersからclusterGroupを削除
      const mapLayers = (map as unknown as { _layers?: Record<string, unknown> })._layers
      const clusterId = (clusterGroup as unknown as { _leaflet_id?: number })._leaflet_id
      if (mapLayers && clusterId !== undefined) {
        delete mapLayers[clusterId]
      }
    } catch {
      // エラーを無視
    }
  }

  clusterGroup = null
})

// 外部からアイテムを選択するための関数をexpose
defineExpose({
  focusOnItem,
})
</script>

<template>
  <div class="relative" :style="{ height: props.height }">
    <LMap
      ref="mapRef"
      v-model:zoom="zoom"
      v-model:center="center"
      :use-global-leaflet="false"
      class="w-full h-full"
    >
      <LTileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        :attribution="'&copy; <a href=&quot;https://www.openstreetmap.org/copyright&quot;>OpenStreetMap</a>'"
      />
    </LMap>

    <!-- GPS Button -->
    <button
      @click="moveToCurrentLocation"
      :disabled="gpsLoading"
      class="absolute z-[1000] bottom-4 right-4 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
    >
      <MdiIcon
        :path="mdiCrosshairsGps"
        :size="22"
        :class="gpsLoading ? 'animate-pulse text-primary-600' : 'text-gray-700'"
      />
    </button>

    <!-- Filter Button -->
    <button
      @click="emit('filterClick')"
      class="absolute z-[1000] bottom-4 left-4 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
    >
      <MdiIcon :path="mdiFilterVariant" :size="22" class="text-gray-700" />
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

/* クラスターアイコンスタイル */
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

/* Leaflet ポップアップスタイル調整 */
.leaflet-popup-content-wrapper {
  border-radius: 8px;
}

.leaflet-popup-content {
  margin: 8px 12px;
}
</style>
