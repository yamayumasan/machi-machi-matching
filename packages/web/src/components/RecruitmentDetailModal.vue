<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRecruitmentStore } from '../stores/recruitment'
import { AREA_LABELS } from '@machi/shared'
import ModalSheet from './ModalSheet.vue'
import MdiIcon from './MdiIcon.vue'
import UserAvatar from './UserAvatar.vue'
import EmbeddedGroupChat from './EmbeddedGroupChat.vue'
import { getIconPath, mdiMapMarker, mdiAccountGroup, mdiClock, mdiForum } from '../lib/icons'

interface Props {
  modelValue: boolean
  recruitmentId: string | null
  /** 参加中の場合のグループID（propsから渡す場合、APIレスポンスより優先） */
  groupId?: string | null
  /** 参加中かどうか（propsから渡す場合、APIレスポンスより優先） */
  isParticipating?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const router = useRouter()
const recruitmentStore = useRecruitmentStore()

const showApplyModal = ref(false)
const applyMessage = ref('')
// モバイル時のタブ切り替え（参加中の場合のみ使用）
const activeTab = ref<'detail' | 'chat'>('detail')

// グループID: propsから渡されたものがあればそれを優先、なければAPIレスポンスから取得
const effectiveGroupId = computed(() =>
  props.groupId ?? recruitmentStore.currentRecruitment?.groupId ?? null
)

// 参加中かどうか: propsから渡されたものがあればそれを優先、なければAPIレスポンスから取得
const effectiveIsParticipating = computed(() =>
  props.isParticipating ?? recruitmentStore.currentRecruitment?.isParticipating ?? false
)

// 参加中かつグループIDがある場合にチャットを表示可能
const canShowChat = computed(() => effectiveIsParticipating.value && effectiveGroupId.value)

const isLoading = computed(() => recruitmentStore.isLoading)
const recruitment = computed(() => recruitmentStore.currentRecruitment)
const error = computed(() => recruitmentStore.error)

// モーダルが開いたらデータを取得
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen && props.recruitmentId) {
      await recruitmentStore.fetchRecruitment(props.recruitmentId)
      // タブをリセット
      activeTab.value = 'detail'
    }
  },
  { immediate: true }
)

// IDが変わったらデータを再取得
watch(
  () => props.recruitmentId,
  async (newId) => {
    if (props.modelValue && newId) {
      await recruitmentStore.fetchRecruitment(newId)
    }
  }
)

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
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
    default:
      return status
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'OPEN':
      return 'bg-green-100 text-green-700'
    case 'CLOSED':
      return 'bg-yellow-100 text-yellow-700'
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-700'
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const getApplicationStatusLabel = (status: string | null | undefined) => {
  switch (status) {
    case 'PENDING':
      return '承認待ち'
    case 'APPROVED':
      return '承認済み'
    case 'REJECTED':
      return '不承認'
    default:
      return ''
  }
}

const handleApply = async () => {
  if (!recruitment.value) return

  const result = await recruitmentStore.applyToRecruitment(recruitment.value.id, applyMessage.value || undefined)
  if (result) {
    showApplyModal.value = false
    applyMessage.value = ''
  }
}

const goToApplications = async () => {
  if (recruitment.value) {
    const targetPath = `/recruitments/${recruitment.value.id}/applications`
    console.log('[RecruitmentDetailModal] goToApplications called, target:', targetPath)
    emit('update:modelValue', false)
    // Transitionのアニメーション完了を待つ（200ms + バッファ）
    await new Promise(resolve => setTimeout(resolve, 250))
    console.log('[RecruitmentDetailModal] Modal closed, pushing route...')
    try {
      await router.push(targetPath)
      console.log('[RecruitmentDetailModal] Route push completed')
    } catch (e) {
      console.error('[RecruitmentDetailModal] Route push failed:', e)
    }
  }
}
</script>

<template>
  <ModalSheet
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="募集詳細"
    :max-width="canShowChat ? '4xl' : '3xl'"
    :fullscreen="true"
  >
    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <svg class="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 px-4">
      <p class="text-red-600">{{ error }}</p>
    </div>

    <!-- Content (参加中の場合は2カラム / タブ切り替え) -->
    <div v-else-if="recruitment" class="h-full flex flex-col">
      <!-- モバイル用タブ（参加中の場合のみ表示） -->
      <div v-if="canShowChat" class="md:hidden flex border-b">
        <button
          @click="activeTab = 'detail'"
          :class="[
            'flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5',
            activeTab === 'detail'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          ]"
        >
          <MdiIcon :path="mdiAccountGroup" :size="18" />
          詳細
        </button>
        <button
          @click="activeTab = 'chat'"
          :class="[
            'flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5',
            activeTab === 'chat'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          ]"
        >
          <MdiIcon :path="mdiForum" :size="18" />
          チャット
        </button>
      </div>

      <!-- デスクトップ: 2カラム / モバイル: タブ切り替え -->
      <div :class="[
        'flex-1 min-h-0',
        canShowChat ? 'md:flex md:gap-4' : ''
      ]">
        <!-- 左カラム: 詳細情報 -->
        <div
          :class="[
            'overflow-y-auto',
            canShowChat ? 'md:w-1/2 md:border-r md:pr-4' : 'w-full',
            canShowChat && activeTab !== 'detail' ? 'hidden md:block' : ''
          ]"
        >
          <div class="p-4 space-y-4">
            <!-- Title & Status -->
            <div class="flex items-start gap-3">
              <div class="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <MdiIcon :path="getIconPath(recruitment.category.icon)" :size="28" class="text-orange-600" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm text-gray-500">{{ recruitment.category.name }}</span>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      getStatusClass(recruitment.status),
                    ]"
                  >
                    {{ getStatusLabel(recruitment.status) }}
                  </span>
                </div>
                <h2 class="text-lg font-bold">{{ recruitment.title }}</h2>
              </div>
            </div>

            <!-- Info -->
            <div class="flex flex-wrap gap-3 text-sm text-gray-600">
              <div class="flex items-center gap-1">
                <MdiIcon :path="mdiMapMarker" :size="16" />
                <span>{{ AREA_LABELS[recruitment.area as keyof typeof AREA_LABELS] }}</span>
              </div>
              <div class="flex items-center gap-1">
                <MdiIcon :path="mdiAccountGroup" :size="16" />
                <span>{{ recruitment.currentPeople }}/{{ recruitment.maxPeople }}人</span>
              </div>
              <div v-if="recruitment.datetime || recruitment.datetimeFlex" class="flex items-center gap-1">
                <MdiIcon :path="mdiClock" :size="16" />
                <span>{{ formatDate(recruitment.datetime) || recruitment.datetimeFlex }}</span>
              </div>
            </div>

            <!-- Location -->
            <div v-if="recruitment.location" class="bg-gray-50 rounded-lg p-3">
              <div class="flex items-center gap-2 text-sm">
                <MdiIcon :path="mdiMapMarker" :size="16" class="text-gray-400" />
                <span class="text-gray-600">{{ recruitment.location }}</span>
              </div>
            </div>

            <!-- Description -->
            <div v-if="recruitment.description" class="border-t border-gray-100 pt-4">
              <h3 class="text-sm font-medium text-gray-500 mb-2">詳細</h3>
              <p class="text-gray-800 whitespace-pre-wrap text-sm">{{ recruitment.description }}</p>
            </div>

            <!-- Creator -->
            <div class="border-t border-gray-100 pt-4">
              <h3 class="text-sm font-medium text-gray-500 mb-3">募集者</h3>
              <div class="flex items-center gap-3">
                <UserAvatar :src="recruitment.creator?.avatarUrl" :name="recruitment.creator?.nickname" size="lg" />
                <div class="flex-1">
                  <p class="font-semibold">{{ recruitment.creator?.nickname }}</p>
                  <p v-if="recruitment.creator?.bio" class="text-gray-500 text-sm line-clamp-2">
                    {{ recruitment.creator.bio }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Members Preview -->
            <div v-if="recruitment.members && recruitment.members.length > 0" class="border-t border-gray-100 pt-4">
              <h3 class="text-sm font-medium text-gray-500 mb-3">参加者 ({{ recruitment.members.length }}人)</h3>
              <div class="flex -space-x-2">
                <UserAvatar
                  v-for="member in recruitment.members.slice(0, 5)"
                  :key="member.id"
                  :src="member.avatarUrl"
                  :name="member.nickname"
                  size="sm"
                  class="ring-2 ring-white"
                />
                <div
                  v-if="recruitment.members.length > 5"
                  class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 ring-2 ring-white"
                >
                  +{{ recruitment.members.length - 5 }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右カラム: チャット（参加中の場合のみ） -->
        <div
          v-if="canShowChat && effectiveGroupId"
          :class="[
            'md:w-1/2 h-full',
            activeTab !== 'chat' ? 'hidden md:block' : ''
          ]"
        >
          <div class="h-full flex flex-col p-2 md:p-0">
            <div class="hidden md:block text-sm font-medium text-gray-500 mb-2 px-2">
              グループチャット
            </div>
            <div class="flex-1 min-h-0">
              <EmbeddedGroupChat :group-id="effectiveGroupId" class="h-full" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <!-- フッターは参加中でない場合のみ表示 -->
      <div v-if="!canShowChat" class="p-4 space-y-3">
        <!-- Owner actions -->
        <template v-if="recruitment?.isOwner">
          <button
            @click="goToApplications"
            class="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            申請を管理
          </button>
        </template>

        <!-- Visitor actions -->
        <template v-else-if="recruitment">
          <div v-if="recruitment.hasApplied" class="bg-gray-50 rounded-lg p-3 text-center">
            <p class="text-gray-600 text-sm">
              申請済み:
              <span class="font-semibold">{{ getApplicationStatusLabel(recruitment.applicationStatus) }}</span>
            </p>
          </div>
          <button
            v-else-if="recruitment.status === 'OPEN'"
            @click="showApplyModal = true"
            class="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            参加を申請する
          </button>
          <div v-else class="bg-gray-50 rounded-lg p-3 text-center">
            <p class="text-gray-500 text-sm">この募集は現在受け付けていません</p>
          </div>
        </template>
      </div>
      <!-- 参加中の場合はフッターボタンを表示（申請管理など） -->
      <div v-else-if="recruitment?.isOwner" class="p-4 border-t">
        <button
          @click="goToApplications"
          class="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          申請を管理
        </button>
      </div>
    </template>
  </ModalSheet>

  <!-- Apply Modal (nested) -->
  <ModalSheet
    v-model="showApplyModal"
    title="参加を申請"
    max-width="md"
  >
    <div class="p-4">
      <label class="block text-sm text-gray-600 mb-2">メッセージ（任意）</label>
      <textarea
        v-model="applyMessage"
        placeholder="自己紹介やコメントを入力できます"
        rows="3"
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
      ></textarea>
    </div>

    <template #footer>
      <div class="flex gap-3 p-4">
        <button
          @click="showApplyModal = false"
          class="flex-1 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
        <button
          @click="handleApply"
          :disabled="isLoading"
          class="flex-1 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          申請する
        </button>
      </div>
    </template>
  </ModalSheet>
</template>
