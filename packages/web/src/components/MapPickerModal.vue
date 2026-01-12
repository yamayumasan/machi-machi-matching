<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet'
import type { Map as LeafletMap } from 'leaflet'
import { AREA_CENTER_COORDS, type Area } from '@machi/shared'
import { useGeolocation } from '../composables/useGeolocation'
import { getLocationLabel } from '../lib/geocoding'
import MdiIcon from './MdiIcon.vue'
import { mdiCrosshairsGps, mdiClose, mdiCheck } from '../lib/icons'

import 'leaflet/dist/leaflet.css'

interface Props {
  modelValue: boolean
  area: Area
  initialLatitude?: number | null
  initialLongitude?: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [data: { latitude: number; longitude: number; locationName: string }]
}>()

const { getCurrentPosition, isLoading: gpsLoading, error: gpsError } = useGeolocation()

const mapRef = ref<{ leafletObject: LeafletMap } | null>(null)
const center = ref<[number, number]>([0, 0])
const zoom = ref(15)
const markerPosition = ref<[number, number]>([0, 0])
const locationName = ref<string>('読み込み中...')
const isLoadingName = ref(false)
const isDragging = ref(false)

// レースコンディション対策: リクエストID管理
let geocodeRequestId = 0

// デバウンス用タイマー
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// エリアのデフォルト中心
const areaCenter = computed(() => {
  const coords = AREA_CENTER_COORDS[props.area]
  return [coords.latitude, coords.longitude] as [number, number]
})

// 初期位置の設定
const initializePosition = async () => {
  // 既存の位置があればそれを使用
  if (props.initialLatitude && props.initialLongitude) {
    center.value = [props.initialLatitude, props.initialLongitude]
    markerPosition.value = [props.initialLatitude, props.initialLongitude]
    updateLocationName(props.initialLatitude, props.initialLongitude)
    return
  }

  // 現在地を取得してみる
  const position = await getCurrentPosition()
  if (position) {
    center.value = [position.latitude, position.longitude]
    markerPosition.value = [position.latitude, position.longitude]
    updateLocationName(position.latitude, position.longitude)
  } else {
    // エリアのデフォルト中心を使用
    center.value = areaCenter.value
    markerPosition.value = areaCenter.value
    updateLocationName(areaCenter.value[0], areaCenter.value[1])
  }
}

// 地名の更新（レースコンディション対策付き）
const updateLocationName = async (lat: number, lng: number) => {
  const currentRequestId = ++geocodeRequestId
  isLoadingName.value = true

  const name = await getLocationLabel(lat, lng)

  // 古いリクエストの結果は無視
  if (currentRequestId === geocodeRequestId) {
    locationName.value = name
    isLoadingName.value = false
  }
}

// デバウンス付きの地名更新
const debouncedUpdateLocationName = (lat: number, lng: number) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    updateLocationName(lat, lng)
  }, 300) // 300ms のデバウンス
}

// マップの中心が変わったときにマーカー位置を更新
const handleMapMove = () => {
  const map = mapRef.value?.leafletObject
  if (map) {
    const mapCenter = map.getCenter()
    markerPosition.value = [mapCenter.lat, mapCenter.lng]
    isDragging.value = true
  }
}

// マップ移動終了時に地名を更新
const handleMapMoveEnd = () => {
  const map = mapRef.value?.leafletObject
  if (map) {
    const mapCenter = map.getCenter()
    isDragging.value = false
    debouncedUpdateLocationName(mapCenter.lat, mapCenter.lng)
  }
}

// 現在地に移動
const moveToCurrentLocation = async () => {
  const position = await getCurrentPosition()
  if (position) {
    const map = mapRef.value?.leafletObject
    if (map) {
      map.setView([position.latitude, position.longitude], 16)
    }
  }
}

// 選択を確定
const confirmSelection = () => {
  emit('select', {
    latitude: markerPosition.value[0],
    longitude: markerPosition.value[1],
    locationName: locationName.value,
  })
  emit('update:modelValue', false)
}

// モーダルを閉じる
const closeModal = () => {
  emit('update:modelValue', false)
}

// モーダルが開いたときに初期化
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      await nextTick()
      await initializePosition()
    } else {
      // モーダルが閉じたときにデバウンスタイマーをクリア
      if (debounceTimer) {
        clearTimeout(debounceTimer)
        debounceTimer = null
      }
    }
  }
)

onMounted(() => {
  if (props.modelValue) {
    initializePosition()
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex flex-col bg-white"
    >
      <!-- Header -->
      <header class="flex items-center justify-between px-4 py-3 bg-white border-b border-primary-200">
        <button
          @click="closeModal"
          class="p-2 -ml-2 text-primary-500 hover:text-primary-700"
        >
          <MdiIcon :path="mdiClose" :size="24" />
        </button>
        <h2 class="text-lg font-semibold text-primary-900">場所を選択</h2>
        <button
          @click="confirmSelection"
          class="p-2 -mr-2 text-primary-700 hover:text-primary-900"
        >
          <MdiIcon :path="mdiCheck" :size="24" />
        </button>
      </header>

      <!-- Map Container -->
      <div class="relative flex-1">
        <LMap
          ref="mapRef"
          v-model:zoom="zoom"
          v-model:center="center"
          :use-global-leaflet="false"
          @move="handleMapMove"
          @moveend="handleMapMoveEnd"
          class="w-full h-full"
        >
          <LTileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            :attribution="'&copy; <a href=&quot;https://www.openstreetmap.org/copyright&quot;>OpenStreetMap</a>'"
          />
        </LMap>

        <!-- Center Target Indicator -->
        <div class="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none">
          <!-- Crosshair / Target circle -->
          <div class="relative flex items-center justify-center">
            <!-- Outer pulse ring (アニメーション) -->
            <div
              class="absolute w-16 h-16 rounded-full border-2 border-primary-400 opacity-30"
              :class="{ 'animate-ping-slow': !isDragging }"
            ></div>

            <!-- Inner target circle -->
            <div class="absolute w-8 h-8 rounded-full border-2 border-primary-500 bg-primary-100/30"></div>

            <!-- Center dot -->
            <div class="absolute w-3 h-3 rounded-full bg-primary-600 shadow-lg"></div>

            <!-- Pin marker -->
            <div class="absolute -top-12">
              <svg
                class="w-12 h-12 text-primary-600 drop-shadow-xl"
                :class="{ 'animate-bounce-gentle': isDragging }"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <!-- Pin shadow -->
              <div class="absolute w-4 h-1 bg-black/30 rounded-full left-1/2 -translate-x-1/2 -bottom-0.5 blur-sm"></div>
            </div>
          </div>
        </div>

        <!-- GPS Button -->
        <button
          @click="moveToCurrentLocation"
          :disabled="gpsLoading"
          class="absolute z-[1000] bottom-24 right-4 p-3 bg-white rounded-full shadow-lg hover:bg-primary-50 disabled:opacity-50 transition-colors"
        >
          <MdiIcon
            :path="mdiCrosshairsGps"
            :size="24"
            :class="gpsLoading ? 'animate-pulse text-primary-700' : 'text-primary-700'"
          />
        </button>

        <!-- Instruction hint -->
        <div class="absolute z-[1000] top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full">
          地図を動かして場所を選択
        </div>
      </div>

      <!-- Footer -->
      <div class="px-4 py-4 bg-white border-t border-primary-200">
        <div class="mb-3">
          <p class="text-xs text-primary-500 mb-1">選択中の場所</p>
          <div class="flex items-center gap-2">
            <div
              class="w-2 h-2 rounded-full"
              :class="isLoadingName ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'"
            ></div>
            <p class="font-medium text-primary-900 flex-1">
              <span v-if="isLoadingName" class="text-primary-400">地名を取得中...</span>
              <span v-else>{{ locationName }}</span>
            </p>
          </div>
        </div>
        <button
          @click="confirmSelection"
          :disabled="isLoadingName"
          class="w-full py-3 bg-primary-900 text-white rounded font-medium hover:bg-primary-800 disabled:opacity-50 transition-colors"
        >
          この場所を選択
        </button>
      </div>

      <!-- GPS Error Toast -->
      <div
        v-if="gpsError"
        class="absolute bottom-32 left-4 right-4 z-[1001] bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm"
      >
        {{ gpsError }}
      </div>
    </div>
  </Teleport>
</template>

<style>
/* Leaflet のデフォルトスタイル調整 */
.leaflet-container {
  font-family: inherit;
}

.leaflet-control-attribution {
  font-size: 10px;
}

/* Custom animations */
@keyframes ping-slow {
  0% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.1;
  }
  100% {
    transform: scale(1);
    opacity: 0.3;
  }
}

.animate-ping-slow {
  animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes bounce-gentle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.animate-bounce-gentle {
  animation: bounce-gentle 0.3s ease-in-out;
}
</style>
