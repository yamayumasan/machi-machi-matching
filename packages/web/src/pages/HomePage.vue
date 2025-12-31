<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { AREA_LABELS, type NearbyItem } from '@machi/shared'
import MdiIcon from '../components/MdiIcon.vue'
import UserAvatar from '../components/UserAvatar.vue'
import NearbyMap from '../components/NearbyMap.vue'
import NearbyList from '../components/NearbyList.vue'
import RecruitmentDetailModal from '../components/RecruitmentDetailModal.vue'
import WantToDoDetailModal from '../components/WantToDoDetailModal.vue'
import ProfileModal from '../components/ProfileModal.vue'
import { mdiPencil, mdiBullhorn } from '../lib/icons'

const router = useRouter()
const authStore = useAuthStore()

const showCreateModal = ref(false)
const showRecruitmentDetailModal = ref(false)
const showWantToDoDetailModal = ref(false)
const showProfileModal = ref(false)
const selectedRecruitmentId = ref<string | null>(null)
const selectedWantToDoId = ref<string | null>(null)
const mapRef = ref<InstanceType<typeof NearbyMap> | null>(null)

// レスポンシブ対応
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// モバイル用: スクロール連動型レイアウト
const sheetContentRef = ref<HTMLElement | null>(null)

// 地図の高さ設定（px単位で管理）
const MAP_MAX_HEIGHT = 300 // px - 地図の最大高さ
const MAP_MIN_HEIGHT = 100 // px - 地図の最小高さ
const currentMapHeight = ref(MAP_MAX_HEIGHT)

// 地図が最小化されているか
const isMapMinimized = computed(() => currentMapHeight.value <= MAP_MIN_HEIGHT)

// タッチ/スクロール処理用
let lastTouchY = 0

// タッチ開始
const handleTouchStart = (e: TouchEvent) => {
  lastTouchY = e.touches[0].clientY
}

// タッチ移動（スクロール連動）
const handleTouchMove = (e: TouchEvent) => {
  const currentY = e.touches[0].clientY
  const deltaY = lastTouchY - currentY // 正: 上スクロール, 負: 下スクロール
  lastTouchY = currentY

  const listEl = sheetContentRef.value
  if (!listEl) return

  const listScrollTop = listEl.scrollTop
  const isAtListTop = listScrollTop <= 0

  // 上にスクロール（deltaY > 0）
  if (deltaY > 0) {
    if (!isMapMinimized.value) {
      // 地図がまだ縮小可能 → 地図を縮小
      e.preventDefault()
      const newHeight = Math.max(MAP_MIN_HEIGHT, currentMapHeight.value - deltaY)
      currentMapHeight.value = newHeight
    }
    // 地図が最小 → リストの通常スクロールに任せる
  }
  // 下にスクロール（deltaY < 0）
  else if (deltaY < 0) {
    if (isAtListTop && currentMapHeight.value < MAP_MAX_HEIGHT) {
      // リストが最上部 & 地図が拡大可能 → 地図を拡大
      e.preventDefault()
      const newHeight = Math.min(MAP_MAX_HEIGHT, currentMapHeight.value - deltaY)
      currentMapHeight.value = newHeight
    }
    // それ以外 → リストの通常スクロールに任せる
  }
}

// 地図エリアをタップで展開
const handleMapAreaClick = () => {
  if (isMapMinimized.value) {
    currentMapHeight.value = MAP_MAX_HEIGHT
  }
}

const user = computed(() => authStore.user)

const goToCreateRecruitment = () => {
  router.push('/recruitments/new')
}

// 地図からのアイテム選択時のハンドラ
const handleMapItemSelect = (item: NearbyItem) => {
  // リスト内の該当アイテムにスクロール
  setTimeout(() => {
    const element = document.getElementById(`list-item-${item.id}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 100)
}

// リストからのアイテムクリック時のハンドラ
const handleListItemClick = (item: NearbyItem) => {
  // 地図上のマーカーにフォーカス
  mapRef.value?.focusOnItem(item)
}

// フィルターモーダル（簡易版）
const handleFilterClick = () => {
  // TODO: フィルターモーダルを実装
  console.log('Filter clicked')
}

// 詳細モーダルを開く
const handleDetailClick = (item: NearbyItem) => {
  if (item.type === 'recruitment') {
    selectedRecruitmentId.value = item.id
    showRecruitmentDetailModal.value = true
  } else {
    selectedWantToDoId.value = item.id
    showWantToDoDetailModal.value = true
  }
}
</script>

<template>
  <div class="home-page">
    <!-- Header -->
    <header class="header">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 class="text-lg font-bold text-primary-600">マチマチマッチング</h1>
        <button
          @click="showProfileModal = true"
          class="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors"
        >
          <UserAvatar :src="user?.avatarUrl" :name="user?.nickname" size="sm" />
          <div class="flex flex-col text-left">
            <span class="text-sm font-medium text-gray-700">{{ user?.nickname }}</span>
            <span class="text-xs text-gray-400">{{ AREA_LABELS[user?.area as keyof typeof AREA_LABELS] || user?.area }}</span>
          </div>
        </button>
      </div>
    </header>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <div class="flex gap-2">
        <button
          @click="showCreateModal = true"
          class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <MdiIcon :path="mdiPencil" :size="16" />
          <span>表明する</span>
        </button>
        <button
          @click="goToCreateRecruitment"
          class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-primary-600 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors"
        >
          <MdiIcon :path="mdiBullhorn" :size="16" />
          <span>募集する</span>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- PC版: 地図とリストを縦に配置、それぞれ独立スクロール -->
      <template v-if="!isMobile">
        <div class="pc-layout">
          <div class="pc-map">
            <NearbyMap
              ref="mapRef"
              height="100%"
              @item-select="handleMapItemSelect"
              @filter-click="handleFilterClick"
              @detail-click="handleDetailClick"
            />
          </div>
          <div class="pc-list">
            <NearbyList
              @item-click="handleListItemClick"
              @detail-click="handleDetailClick"
            />
          </div>
        </div>
      </template>

      <!-- モバイル版: 地図 + スクロール連動リスト -->
      <template v-else>
        <div class="mobile-layout">
          <!-- 地図（クリックで展開可能） -->
          <div
            class="mobile-map"
            :class="{ 'is-minimized': isMapMinimized }"
            :style="{ height: `${currentMapHeight}px` }"
            @click="handleMapAreaClick"
          >
            <NearbyMap
              ref="mapRef"
              height="100%"
              @item-select="handleMapItemSelect"
              @filter-click="handleFilterClick"
              @detail-click="handleDetailClick"
            />
            <!-- 最小化時の展開ヒント -->
            <div v-if="isMapMinimized" class="map-expand-hint">
              タップで地図を拡大
            </div>
          </div>

          <!-- リストエリア（スクロール連動） -->
          <div
            ref="sheetContentRef"
            class="mobile-list"
            @touchstart.passive="handleTouchStart"
            @touchmove="handleTouchMove"
          >
            <NearbyList
              @item-click="handleListItemClick"
              @detail-click="handleDetailClick"
            />
          </div>
        </div>
      </template>
    </div>

    <!-- Create WantToDo Modal -->
    <CreateWantToDoModal
      v-model="showCreateModal"
      @created="showCreateModal = false"
    />

    <!-- Recruitment Detail Modal -->
    <RecruitmentDetailModal
      v-model="showRecruitmentDetailModal"
      :recruitment-id="selectedRecruitmentId"
    />

    <!-- WantToDo Detail Modal -->
    <WantToDoDetailModal
      v-model="showWantToDoDetailModal"
      :want-to-do-id="selectedWantToDoId"
    />

    <!-- Profile Modal -->
    <ProfileModal v-model="showProfileModal" />
  </div>
</template>

<script lang="ts">
import CreateWantToDoModal from '../components/CreateWantToDoModal.vue'

export default {
  components: {
    CreateWantToDoModal,
  },
}
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background-color: #f9fafb;
}

.header {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  z-index: 20;
}

.quick-actions {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.5rem 1rem;
  flex-shrink: 0;
  z-index: 20;
}

.main-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* PC版レイアウト */
.pc-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.pc-map {
  height: 45%;
  min-height: 300px;
  flex-shrink: 0;
}

.pc-list {
  flex: 1;
  overflow-y: auto;
  background: white;
}

/* モバイル版レイアウト */
.mobile-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.mobile-map {
  flex-shrink: 0;
  transition: height 0.2s ease-out;
  position: relative;
  z-index: 1;
}

.mobile-map.is-minimized {
  cursor: pointer;
}

.map-expand-hint {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  pointer-events: none;
  z-index: 1000;
}

.mobile-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: white;
  -webkit-overflow-scrolling: touch;
}

/* タブレット以上（PC版） */
@media (min-width: 768px) {
  .pc-layout {
    flex-direction: row;
  }

  .pc-map {
    flex: 1;
    height: 100%;
    min-height: unset;
  }

  .pc-list {
    width: 320px;
    flex: none;
    flex-shrink: 0;
    border-left: 1px solid #e5e7eb;
  }
}

/* 大画面 */
@media (min-width: 1024px) {
  .pc-list {
    width: 360px;
  }
}

/* 超大画面 */
@media (min-width: 1280px) {
  .pc-list {
    width: 400px;
  }
}
</style>
