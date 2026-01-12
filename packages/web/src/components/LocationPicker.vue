<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { LANDMARKS, type Area } from '@machi/shared'
import MdiIcon from './MdiIcon.vue'
import MapPickerModal from './MapPickerModal.vue'
import { mdiMapMarkerRadius, mdiTrain, mdiMapMarker } from '../lib/icons'

interface LocationValue {
  latitude: number | null
  longitude: number | null
  locationName: string | null
}

const props = withDefaults(
  defineProps<{
    modelValue: LocationValue
    area: Area
    showMapOption?: boolean
    label?: string
    required?: boolean
  }>(),
  {
    showMapOption: true,
    label: '場所',
    required: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: LocationValue]
}>()

const showMapPicker = ref(false)
const selectedLandmarkIndex = ref<number | null>(null)
const customLocationName = ref('')

const landmarks = computed(() => LANDMARKS[props.area] || [])

const handleLandmarkSelect = (index: number) => {
  selectedLandmarkIndex.value = index
  const landmark = landmarks.value[index]
  emit('update:modelValue', {
    latitude: landmark.latitude,
    longitude: landmark.longitude,
    locationName: landmark.name,
  })
}

const handleMapSelect = (data: { latitude: number; longitude: number; locationName: string }) => {
  emit('update:modelValue', {
    latitude: data.latitude,
    longitude: data.longitude,
    locationName: data.locationName,
  })
}

const handleManualInput = () => {
  if (customLocationName.value.trim()) {
    emit('update:modelValue', {
      latitude: null,
      longitude: null,
      locationName: customLocationName.value.trim(),
    })
  }
}

const clearSelection = () => {
  selectedLandmarkIndex.value = null
  customLocationName.value = ''
  emit('update:modelValue', {
    latitude: null,
    longitude: null,
    locationName: null,
  })
}

// 外部からの値変更を監視
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal.locationName) {
      // ランドマークリストから一致するものを探す
      const index = landmarks.value.findIndex((l) => l.name === newVal.locationName)
      if (index !== -1) {
        selectedLandmarkIndex.value = index
      } else {
        selectedLandmarkIndex.value = null
        // マップ選択や手動入力の場合
        if (!newVal.latitude) {
          customLocationName.value = newVal.locationName
        }
      }
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="space-y-3">
    <label v-if="label" class="block text-sm font-medium text-primary-700">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- 選択された場所の表示 -->
    <div
      v-if="modelValue.locationName"
      class="flex items-center justify-between bg-primary-50 border border-primary-200 rounded-lg p-3"
    >
      <div class="flex items-center gap-2">
        <MdiIcon :path="mdiMapMarker" :size="20" class="text-primary-700" />
        <span class="font-medium text-primary-900">{{ modelValue.locationName }}</span>
      </div>
      <button
        type="button"
        @click="clearSelection"
        class="text-primary-400 hover:text-primary-600 text-sm"
      >
        変更
      </button>
    </div>

    <!-- 入力モード選択 -->
    <div v-else class="space-y-4">
      <!-- マップから選択ボタン -->
      <div v-if="showMapOption">
        <button
          type="button"
          @click="showMapPicker = true"
          class="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-primary-200 rounded-lg text-primary-600 hover:border-primary-400 hover:text-primary-700 transition-colors"
        >
          <MdiIcon :path="mdiMapMarkerRadius" :size="20" />
          <span>マップから選択</span>
        </button>
      </div>

      <!-- ランドマーク選択 -->
      <div>
        <p class="text-sm text-primary-500 mb-2">
          <MdiIcon :path="mdiTrain" :size="16" class="inline mr-1" />
          主要駅から選ぶ
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(landmark, index) in landmarks"
            :key="landmark.name"
            type="button"
            @click="handleLandmarkSelect(index)"
            :class="[
              'px-3 py-1.5 text-sm rounded-full border transition-colors',
              selectedLandmarkIndex === index
                ? 'bg-primary-100 border-primary-900 text-primary-900'
                : 'bg-white border-primary-200 text-primary-700 hover:border-primary-400',
            ]"
          >
            {{ landmark.name }}
          </button>
        </div>
      </div>

      <!-- 手動入力 -->
      <div>
        <p class="text-sm text-primary-500 mb-2">または場所を入力</p>
        <div class="flex gap-2">
          <input
            v-model="customLocationName"
            type="text"
            placeholder="例: 〇〇駅周辺、△△カフェなど"
            class="flex-1 px-3 py-2 text-base border border-primary-200 rounded text-sm focus:ring-1 focus:ring-primary-700 focus:border-primary-400"
            @keyup.enter="handleManualInput"
          />
          <button
            type="button"
            @click="handleManualInput"
            :disabled="!customLocationName.trim()"
            class="px-4 py-2 bg-primary-900 text-white text-sm rounded hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            設定
          </button>
        </div>
      </div>
    </div>

    <!-- Map Picker Modal -->
    <MapPickerModal
      v-model="showMapPicker"
      :area="area"
      :initial-latitude="modelValue.latitude"
      :initial-longitude="modelValue.longitude"
      @select="handleMapSelect"
    />
  </div>
</template>
