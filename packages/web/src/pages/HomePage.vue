<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { AREA_LABELS, type NearbyItem } from '@machi/shared'
import MdiIcon from '../components/MdiIcon.vue'
import UserAvatar from '../components/UserAvatar.vue'
import NotificationBell from '../components/NotificationBell.vue'
import NearbyMap from '../components/NearbyMap.vue'
import NearbyList from '../components/NearbyList.vue'
import RecruitmentDetailModal from '../components/RecruitmentDetailModal.vue'
import WantToDoDetailModal from '../components/WantToDoDetailModal.vue'
import ProfileModal from '../components/ProfileModal.vue'
import { mdiPlus, mdiBullhorn } from '../lib/icons'

const router = useRouter()
const authStore = useAuthStore()

const showRecruitmentDetailModal = ref(false)
const showWantToDoDetailModal = ref(false)
const showProfileModal = ref(false)
const selectedRecruitmentId = ref<string | null>(null)
const selectedWantToDoId = ref<string | null>(null)
// 参加中の募集の場合に使用
const selectedRecruitmentIsParticipating = ref(false)
const selectedRecruitmentGroupId = ref<string | null>(null)
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

// モバイル用: リサイズ可能レイアウト
const mobileLayoutRef = ref<HTMLElement | null>(null)

// 地図の高さ設定（%単位で管理）
const MAP_EXPANDED_PERCENT = 80 // % - 地図拡大時
const MAP_COLLAPSED_PERCENT = 20 // % - 地図縮小時
const currentMapPercent = ref(MAP_EXPANDED_PERCENT)

// 地図が縮小されているか
const isMapMinimized = computed(() => currentMapPercent.value <= MAP_COLLAPSED_PERCENT)

// ドラッグ中フラグ
const isDragging = ref(false)

// リサイズバーのドラッグ開始
const handleResizeStart = (e: TouchEvent | MouseEvent) => {
  e.preventDefault()
  isDragging.value = true

  const startY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const startPercent = currentMapPercent.value
  const layoutEl = mobileLayoutRef.value
  if (!layoutEl) return

  const layoutHeight = layoutEl.clientHeight

  const handleMove = (moveEvent: TouchEvent | MouseEvent) => {
    const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY
    const deltaY = currentY - startY
    const deltaPercent = (deltaY / layoutHeight) * 100
    const newPercent = Math.max(MAP_COLLAPSED_PERCENT, Math.min(MAP_EXPANDED_PERCENT, startPercent + deltaPercent))
    currentMapPercent.value = newPercent
  }

  const handleEnd = () => {
    isDragging.value = false
    document.removeEventListener('touchmove', handleMove)
    document.removeEventListener('touchend', handleEnd)
    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleEnd)
    // リサイズ完了後にマップのサイズを再計算
    nextTick(() => {
      mapRef.value?.invalidateSize()
    })
  }

  document.addEventListener('touchmove', handleMove, { passive: false })
  document.addEventListener('touchend', handleEnd)
  document.addEventListener('mousemove', handleMove)
  document.addEventListener('mouseup', handleEnd)
}

// リサイズバーをタップでトグル
const handleResizeToggle = () => {
  if (isDragging.value) return // ドラッグ中はトグルしない

  if (isMapMinimized.value) {
    currentMapPercent.value = MAP_EXPANDED_PERCENT
  } else {
    currentMapPercent.value = MAP_COLLAPSED_PERCENT
  }
  // トグル後にマップのサイズを再計算
  nextTick(() => {
    mapRef.value?.invalidateSize()
  })
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

// 詳細モーダルを開く
const handleDetailClick = (item: NearbyItem) => {
  if (item.type === 'recruitment') {
    selectedRecruitmentId.value = item.id
    // 参加中かどうかとグループIDを設定
    selectedRecruitmentIsParticipating.value = item.isParticipating ?? false
    selectedRecruitmentGroupId.value = item.groupId ?? null
    showRecruitmentDetailModal.value = true
  } else {
    selectedWantToDoId.value = item.id
    showWantToDoDetailModal.value = true
  }
}
</script>

<template>
  <div class="home-page">
    <!-- PC版: Header -->
    <header v-if="!isMobile" class="header">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 class="text-lg font-semibold text-primary-900 tracking-tight">マチマチマッチング</h1>
        <div class="flex items-center gap-3">
          <NotificationBell />
          <button
            @click="showProfileModal = true"
            class="flex items-center gap-2.5 hover:bg-primary-50 rounded-md px-2.5 py-1.5 transition-colors"
          >
            <UserAvatar :src="user?.avatarUrl" :name="user?.nickname" size="sm" />
            <div class="flex flex-col text-left">
              <span class="text-sm font-medium text-primary-800">{{ user?.nickname }}</span>
              <span class="text-xs text-primary-400">{{ AREA_LABELS[user?.area as keyof typeof AREA_LABELS] || user?.area }}</span>
            </div>
          </button>
        </div>
      </div>
    </header>

    <!-- PC版: Quick Actions -->
    <div v-if="!isMobile" class="quick-actions">
      <button
        @click="goToCreateRecruitment"
        class="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-600 text-white rounded-lg text-sm font-medium hover:bg-accent-700 transition-colors"
      >
        <MdiIcon :path="mdiBullhorn" :size="16" />
        <span>募集する</span>
      </button>
    </div>

    <!-- モバイル版: フローティングボタン（上部） -->
    <div v-if="isMobile" class="mobile-floating-buttons-top">
      <!-- 右上: 通知 & プロフィール -->
      <div class="floating-btn-group-right">
        <NotificationBell class="floating-notification" />
        <button
          @click.stop.prevent="showProfileModal = true"
          class="floating-btn floating-btn-profile"
          aria-label="プロフィール"
        >
          <UserAvatar :src="user?.avatarUrl" :name="user?.nickname" size="sm" />
        </button>
      </div>
    </div>

    <!-- モバイル版: 募集作成ボタン（右下FAB） -->
    <button
      v-if="isMobile"
      @click.stop.prevent="goToCreateRecruitment"
      class="mobile-fab"
      aria-label="募集を作成"
    >
      <MdiIcon :path="mdiPlus" :size="28" />
    </button>

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
        <div ref="mobileLayoutRef" class="mobile-layout">
          <!-- 地図エリア -->
          <div
            class="mobile-map"
            :class="{ 'is-minimized': isMapMinimized }"
            :style="{ height: `${currentMapPercent}%` }"
          >
            <NearbyMap
              ref="mapRef"
              height="100%"
              @item-select="handleMapItemSelect"
              @detail-click="handleDetailClick"
            />
          </div>

          <!-- リサイズバー -->
          <div
            class="resize-bar"
            :class="{ 'is-dragging': isDragging }"
            @touchstart.prevent="handleResizeStart"
            @mousedown.prevent="handleResizeStart"
            @click="handleResizeToggle"
          >
            <div class="resize-handle"></div>
          </div>

          <!-- リストエリア -->
          <div class="mobile-list">
            <NearbyList
              @item-click="handleListItemClick"
              @detail-click="handleDetailClick"
            />
          </div>
        </div>
      </template>
    </div>

    <!-- Recruitment Detail Modal -->
    <RecruitmentDetailModal
      v-model="showRecruitmentDetailModal"
      :recruitment-id="selectedRecruitmentId"
      :is-participating="selectedRecruitmentIsParticipating"
      :group-id="selectedRecruitmentGroupId"
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


<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background-color: #ffffff;
}

.header {
  background: white;
  border-bottom: 1px solid #e5e5e5;
  flex-shrink: 0;
  position: relative;
  z-index: 1100;
}

.quick-actions {
  background: white;
  border-bottom: 1px solid #e5e5e5;
  padding: 0.5rem 1rem;
  flex-shrink: 0;
  z-index: 20;
}

/* モバイル版: フローティングボタン（上部） */
.mobile-floating-buttons-top {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2000;
  padding: 12px 16px;
  padding-top: max(12px, env(safe-area-inset-top));
  pointer-events: none;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
}

/* モバイル版: 募集作成FAB（右下） */
.mobile-fab {
  position: fixed;
  bottom: 24px;
  right: 16px;
  z-index: 2000;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #16a34a;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(22, 163, 74, 0.3);
  transition: all 0.2s ease;
}

.mobile-fab:hover {
  background: #15803d;
  box-shadow: 0 6px 20px rgba(22, 163, 74, 0.4);
}

.mobile-fab:active {
  transform: scale(0.95);
}

.floating-btn {
  pointer-events: auto;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.floating-btn:active {
  transform: scale(0.95);
}

.floating-btn-profile {
  background: white;
  padding: 2px;
  overflow: hidden;
  border: 1px solid #e5e5e5;
}

.floating-btn-group-right {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.floating-notification {
  pointer-events: auto;
}

/* NotificationBellのスタイル調整 */
.mobile-floating-buttons-top :deep(.notification-bell) {
  width: 44px;
  height: 44px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-floating-buttons-top :deep(.notification-bell:hover) {
  background: #fafafa;
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

/* リサイズバー */
.resize-bar {
  flex-shrink: 0;
  height: 24px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ns-resize;
  touch-action: none;
  user-select: none;
  border-top: 1px solid #e5e5e5;
  border-bottom: 1px solid #e5e5e5;
  z-index: 10;
}

.resize-bar:active,
.resize-bar.is-dragging {
  background: #f5f5f5;
}

.resize-handle {
  width: 40px;
  height: 4px;
  background: #d4d4d4;
  border-radius: 2px;
}

.resize-bar:active .resize-handle,
.resize-bar.is-dragging .resize-handle {
  background: #a3a3a3;
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
    width: 380px;
    flex: none;
    flex-shrink: 0;
    border-left: 1px solid #e5e5e5;
  }
}

/* 大画面 */
@media (min-width: 1024px) {
  .pc-list {
    width: 420px;
  }
}

/* 超大画面 */
@media (min-width: 1280px) {
  .pc-list {
    width: 480px;
  }
}
</style>
