<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useRecruitmentStore } from '../stores/recruitment'
import { useWantToDoStore } from '../stores/wantToDo'
import { AREA_LABELS, TIMING_LABELS, type Timing } from '@machi/shared'
import ModalSheet from './ModalSheet.vue'
import MdiIcon from './MdiIcon.vue'
import UserAvatar from './UserAvatar.vue'
import { getIconPath, mdiMapMarker, mdiLogout, mdiClock, mdiAccountGroup } from '../lib/icons'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const router = useRouter()
const authStore = useAuthStore()
const recruitmentStore = useRecruitmentStore()
const wantToDoStore = useWantToDoStore()

// タブ管理
type TabType = 'recruitments' | 'wantToDos'
const activeTab = ref<TabType>('recruitments')

const user = computed(() => authStore.user)
const myRecruitments = computed(() => recruitmentStore.myRecruitments)
const myWantToDos = computed(() => wantToDoStore.myWantToDos)
const isLoading = computed(() => recruitmentStore.isLoading || wantToDoStore.isLoading)

// モーダルが開いたらデータを取得
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      await Promise.all([
        recruitmentStore.fetchMyRecruitments(),
        wantToDoStore.fetchMyWantToDos(),
      ])
    }
  },
  { immediate: true }
)

const getTimingLabel = (timing: string) => {
  return TIMING_LABELS[timing as Timing] || timing
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  })
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'OPEN':
      return '募集中'
    case 'CLOSED':
      return '締め切り'
    case 'COMPLETED':
      return '完了'
    case 'CANCELLED':
      return 'キャンセル'
    case 'ACTIVE':
      return '有効'
    case 'EXPIRED':
      return '期限切れ'
    default:
      return status
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'OPEN':
    case 'ACTIVE':
      return 'bg-green-100 text-green-700'
    case 'CLOSED':
      return 'bg-yellow-100 text-yellow-700'
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-700'
    case 'CANCELLED':
    case 'EXPIRED':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const handleLogout = async () => {
  emit('update:modelValue', false)
  await nextTick()
  await authStore.signOut()
  router.push('/login')
}

const goToRecruitmentApplications = async (recruitmentId: string) => {
  emit('update:modelValue', false)
  await nextTick()
  router.push(`/recruitments/${recruitmentId}/applications`)
}

const closeModal = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <ModalSheet
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="プロフィール"
    max-width="lg"
    :fullscreen="true"
  >
    <div class="p-4 space-y-4">
      <!-- User Info -->
      <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
        <UserAvatar
          :src="user?.avatarUrl"
          :name="user?.nickname"
          size="xl"
        />
        <div class="flex-1 min-w-0">
          <h2 class="text-lg font-bold truncate">{{ user?.nickname || '未設定' }}</h2>
          <div class="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <MdiIcon :path="mdiMapMarker" :size="14" />
            <span>{{ AREA_LABELS[user?.area as keyof typeof AREA_LABELS] || user?.area || '未設定' }}</span>
          </div>
          <p v-if="user?.bio" class="text-gray-600 text-sm mt-2 line-clamp-2">
            {{ user.bio }}
          </p>
        </div>
      </div>

      <!-- Interests -->
      <div v-if="user?.interests && user.interests.length > 0" class="space-y-2">
        <h3 class="text-sm font-medium text-gray-500">興味のあるカテゴリ</h3>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="interest in user.interests"
            :key="interest.id"
            class="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
          >
            {{ interest.name }}
          </span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <div class="flex">
          <button
            @click="activeTab = 'recruitments'"
            :class="[
              'flex-1 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'recruitments'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ]"
          >
            募集 ({{ myRecruitments.length }})
          </button>
          <button
            @click="activeTab = 'wantToDos'"
            :class="[
              'flex-1 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'wantToDos'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ]"
          >
            表明 ({{ myWantToDos.length }})
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-8">
        <svg class="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Recruitments Tab -->
      <div v-else-if="activeTab === 'recruitments'" class="space-y-3">
        <div v-if="myRecruitments.length === 0" class="text-center py-8 text-gray-500">
          <p>まだ募集を作成していません</p>
        </div>
        <div
          v-for="recruitment in myRecruitments"
          :key="recruitment.id"
          class="bg-white border border-gray-200 rounded-lg p-4 space-y-2"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <MdiIcon :path="getIconPath(recruitment.category.icon)" :size="18" class="text-orange-600" />
              </div>
              <div>
                <h4 class="font-medium text-gray-900 line-clamp-1">{{ recruitment.title }}</h4>
                <p class="text-xs text-gray-500">{{ recruitment.category.name }}</p>
              </div>
            </div>
            <span
              :class="[
                'px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                getStatusClass(recruitment.status),
              ]"
            >
              {{ getStatusLabel(recruitment.status) }}
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <div v-if="recruitment.datetime || recruitment.datetimeFlex" class="flex items-center gap-1">
              <MdiIcon :path="mdiClock" :size="14" />
              <span>{{ formatDate(recruitment.datetime) || recruitment.datetimeFlex }}</span>
            </div>
            <div class="flex items-center gap-1">
              <MdiIcon :path="mdiAccountGroup" :size="14" />
              <span>{{ recruitment.currentPeople }}/{{ recruitment.maxPeople }}人</span>
            </div>
          </div>

          <button
            v-if="recruitment.status === 'OPEN'"
            @click="goToRecruitmentApplications(recruitment.id)"
            class="w-full py-2 text-sm text-primary-600 font-medium hover:bg-primary-50 rounded-lg transition-colors"
          >
            申請を管理
          </button>
        </div>
      </div>

      <!-- WantToDos Tab -->
      <div v-else-if="activeTab === 'wantToDos'" class="space-y-3">
        <div v-if="myWantToDos.length === 0" class="text-center py-8 text-gray-500">
          <p>まだ表明をしていません</p>
        </div>
        <div
          v-for="wantToDo in myWantToDos"
          :key="wantToDo.id"
          class="bg-white border border-gray-200 rounded-lg p-4 space-y-2"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <MdiIcon :path="getIconPath(wantToDo.category.icon)" :size="18" class="text-green-600" />
              </div>
              <div>
                <h4 class="font-medium text-gray-900">{{ wantToDo.category.name }}</h4>
                <p class="text-xs text-gray-500">{{ getTimingLabel(wantToDo.timing) }}</p>
              </div>
            </div>
            <span
              :class="[
                'px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                getStatusClass(wantToDo.status || 'ACTIVE'),
              ]"
            >
              {{ getStatusLabel(wantToDo.status || 'ACTIVE') }}
            </span>
          </div>

          <p v-if="wantToDo.comment" class="text-sm text-gray-600 line-clamp-2">
            {{ wantToDo.comment }}
          </p>

          <div class="text-xs text-gray-400">
            {{ formatDate(wantToDo.createdAt) }} 投稿
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="p-4 space-y-3">
        <button
          @click="handleLogout"
          class="w-full flex items-center justify-center gap-2 py-3 border border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors"
        >
          <MdiIcon :path="mdiLogout" :size="20" />
          <span>ログアウト</span>
        </button>
        <button
          @click="closeModal"
          class="w-full py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          閉じる
        </button>
      </div>
    </template>
  </ModalSheet>
</template>
