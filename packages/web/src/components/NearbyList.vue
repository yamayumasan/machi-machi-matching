<script setup lang="ts">
import { computed } from 'vue'
import type { NearbyItem } from '@machi/shared'
import { TIMING_LABELS } from '@machi/shared'
import { useNearbyStore } from '../stores/nearby'
import MdiIcon from './MdiIcon.vue'
import UserAvatar from './UserAvatar.vue'
import { getIconPath, mdiBullhorn, mdiHandWave, mdiMapMarker, mdiAccountGroup, mdiChevronRight, mdiAccountCheck } from '../lib/icons'

const emit = defineEmits<{
  itemClick: [item: NearbyItem]
  detailClick: [item: NearbyItem]
}>()

const nearbyStore = useNearbyStore()

const items = computed(() => nearbyStore.filteredItems)
const isLoading = computed(() => nearbyStore.isLoading)

const formatDistance = (meters?: number) => {
  if (!meters) return ''
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

const getTimingLabel = (timing: string) => {
  return TIMING_LABELS[timing as keyof typeof TIMING_LABELS] || timing
}

const handleItemClick = (item: NearbyItem) => {
  nearbyStore.selectItem(item.id)
  emit('itemClick', item)
}

const handleDetailClick = (item: NearbyItem, event: MouseEvent) => {
  event.stopPropagation()
  emit('detailClick', item)
}
</script>

<template>
  <div class="nearby-list">
    <!-- フィルターエリア -->
    <div class="bg-white sticky top-0 z-10">
      <!-- タブ切り替え -->
      <div class="flex border-b border-gray-200">
        <button
          @click="nearbyStore.setFilters({ types: 'all', participatingOnly: false })"
          :class="[
            'flex-1 py-3 text-sm font-medium border-b-2 transition-colors',
            nearbyStore.filters.types === 'all' && !nearbyStore.filters.participatingOnly
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          ]"
        >
          すべて
          <span class="ml-1 text-xs">({{ nearbyStore.items.length }})</span>
        </button>
        <button
          @click="nearbyStore.setFilters({ types: 'recruitment', participatingOnly: false })"
          :class="[
            'flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1',
            nearbyStore.filters.types === 'recruitment' && !nearbyStore.filters.participatingOnly
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          ]"
        >
          <MdiIcon :path="mdiBullhorn" :size="16" />
          募集
          <span class="text-xs">({{ nearbyStore.recruitments.length }})</span>
        </button>
        <button
          @click="nearbyStore.setFilters({ types: 'wantToDo', participatingOnly: false })"
          :class="[
            'flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1',
            nearbyStore.filters.types === 'wantToDo'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          ]"
        >
          <MdiIcon :path="mdiHandWave" :size="16" />
          表明
          <span class="text-xs">({{ nearbyStore.wantToDos.length }})</span>
        </button>
        <button
          @click="nearbyStore.setFilters({ types: 'recruitment', participatingOnly: true })"
          :class="[
            'flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1',
            nearbyStore.filters.participatingOnly
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          ]"
        >
          <MdiIcon :path="mdiAccountCheck" :size="16" />
          参加中
          <span class="text-xs">({{ nearbyStore.participatingCount }})</span>
        </button>
      </div>
    </div>

    <!-- リスト -->
    <div class="divide-y divide-gray-100">
      <!-- Loading -->
      <div v-if="isLoading && items.length === 0" class="p-6 text-center">
        <div class="animate-spin inline-block w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full"></div>
        <p class="mt-2 text-sm text-gray-500">読み込み中...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="items.length === 0" class="p-6 text-center">
        <p class="text-gray-500 text-sm">この周辺に募集・表明はありません</p>
        <p class="text-gray-400 text-xs mt-1">地図を移動して他のエリアを探索してみましょう</p>
      </div>

      <!-- Items -->
      <div
        v-for="item in items"
        :key="item.id"
        @click="handleItemClick(item)"
        :class="[
          'p-4 cursor-pointer transition-colors',
          nearbyStore.selectedItemId === item.id
            ? 'bg-primary-50'
            : 'hover:bg-gray-50'
        ]"
        :id="`list-item-${item.id}`"
      >
        <!-- 募集アイテム -->
        <template v-if="item.type === 'recruitment'">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 relative">
              <MdiIcon :path="getIconPath(item.category.icon)" :size="22" class="text-orange-600" />
              <!-- 参加中バッジ -->
              <div
                v-if="item.isParticipating"
                class="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center"
              >
                <MdiIcon :path="mdiAccountCheck" :size="12" class="text-white" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span
                  v-if="item.isParticipating"
                  class="text-xs px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded"
                >参加中</span>
                <span v-else class="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">募集</span>
                <span v-if="item.distance" class="text-xs text-gray-400 flex items-center gap-0.5">
                  <MdiIcon :path="mdiMapMarker" :size="12" />
                  {{ formatDistance(item.distance) }}
                </span>
              </div>
              <h4 class="font-medium text-gray-900 truncate">{{ item.title }}</h4>
              <div class="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <span>{{ item.creator?.nickname || '匿名' }}</span>
                <span class="flex items-center gap-0.5">
                  <MdiIcon :path="mdiAccountGroup" :size="14" />
                  {{ item.currentPeople }}/{{ item.maxPeople }}
                </span>
              </div>
            </div>
            <button
              @click="handleDetailClick(item, $event)"
              class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <MdiIcon :path="mdiChevronRight" :size="20" />
            </button>
          </div>
        </template>

        <!-- 表明アイテム -->
        <template v-else>
          <div class="flex items-start gap-3">
            <UserAvatar
              :src="item.user?.avatarUrl"
              :name="item.user?.nickname"
              size="md"
              class="flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">表明</span>
                <span v-if="item.distance" class="text-xs text-gray-400 flex items-center gap-0.5">
                  <MdiIcon :path="mdiMapMarker" :size="12" />
                  {{ formatDistance(item.distance) }}
                </span>
              </div>
              <h4 class="font-medium text-gray-900">{{ item.user?.nickname || '匿名' }}</h4>
              <div class="flex items-center gap-2 mt-1">
                <MdiIcon :path="getIconPath(item.category.icon)" :size="16" class="text-primary-600" />
                <span class="text-sm text-gray-600">{{ item.category.name }}</span>
                <span class="text-xs text-primary-600">{{ getTimingLabel(item.timing) }}</span>
              </div>
              <p v-if="item.comment" class="text-sm text-gray-500 mt-1 truncate">
                {{ item.comment }}
              </p>
            </div>
            <button
              @click="handleDetailClick(item, $event)"
              class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <MdiIcon :path="mdiChevronRight" :size="20" />
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nearby-list {
  max-height: 100%;
  overflow-y: auto;
}
</style>
