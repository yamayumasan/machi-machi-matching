<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRecruitmentStore } from '../stores/recruitment'
import { AREA_LABELS } from '@machi/shared'

const router = useRouter()
const route = useRoute()
const recruitmentStore = useRecruitmentStore()

const showApplyModal = ref(false)
const showCloseConfirm = ref(false)
const showCancelConfirm = ref(false)
const applyMessage = ref('')

const isLoading = computed(() => recruitmentStore.isLoading)
const recruitment = computed(() => recruitmentStore.currentRecruitment)
const error = computed(() => recruitmentStore.error)

onMounted(async () => {
  const id = route.params.id as string
  await recruitmentStore.fetchRecruitment(id)
})

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatCreatedAt = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const handleApply = async () => {
  if (!recruitment.value) return

  const result = await recruitmentStore.applyToRecruitment(recruitment.value.id, applyMessage.value || undefined)
  if (result) {
    showApplyModal.value = false
    applyMessage.value = ''
  }
}

const handleClose = async () => {
  if (!recruitment.value) return

  const success = await recruitmentStore.closeRecruitment(recruitment.value.id)
  if (success) {
    showCloseConfirm.value = false
  }
}

const handleCancel = async () => {
  if (!recruitment.value) return

  const success = await recruitmentStore.cancelRecruitment(recruitment.value.id)
  if (success) {
    showCancelConfirm.value = false
    router.push('/recruitments')
  }
}

const goBack = () => {
  router.back()
}

const goToApplications = () => {
  router.push(`/recruitments/${recruitment.value?.id}/applications`)
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
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="container mx-auto px-4 py-4 flex items-center gap-4">
        <button @click="goBack" class="text-gray-500 hover:text-gray-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-lg font-bold">募集詳細</h1>
      </div>
    </header>

    <main class="container mx-auto px-4 py-6">
      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <svg class="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-600">{{ error }}</p>
        <button @click="goBack" class="mt-4 px-4 py-2 text-primary-600 hover:underline">
          戻る
        </button>
      </div>

      <!-- Content -->
      <div v-else-if="recruitment" class="space-y-6">
        <!-- Title & Status -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <span class="text-3xl">{{ recruitment.category.icon }}</span>
              <div>
                <span class="text-sm text-gray-500">{{ recruitment.category.name }}</span>
                <h2 class="text-xl font-bold">{{ recruitment.title }}</h2>
              </div>
            </div>
            <span
              :class="[
                'px-3 py-1 rounded-full text-sm font-medium',
                getStatusClass(recruitment.status),
              ]"
            >
              {{ getStatusLabel(recruitment.status) }}
            </span>
          </div>

          <div class="flex flex-wrap gap-4 text-sm text-gray-600">
            <div class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span>{{ AREA_LABELS[recruitment.area as keyof typeof AREA_LABELS] }}</span>
            </div>
            <div class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{{ recruitment.currentPeople }}/{{ recruitment.maxPeople }}人参加</span>
            </div>
          </div>
        </div>

        <!-- DateTime & Location -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="space-y-4">
            <div v-if="recruitment.datetime || recruitment.datetimeFlex" class="flex items-start gap-3">
              <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p class="text-sm text-gray-500">日時</p>
                <p class="font-medium">{{ formatDate(recruitment.datetime) || recruitment.datetimeFlex }}</p>
              </div>
            </div>

            <div v-if="recruitment.location" class="flex items-start gap-3">
              <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p class="text-sm text-gray-500">場所</p>
                <p class="font-medium">{{ recruitment.location }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div v-if="recruitment.description" class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-sm font-medium text-gray-500 mb-2">詳細</h3>
          <p class="text-gray-800 whitespace-pre-wrap">{{ recruitment.description }}</p>
        </div>

        <!-- Creator -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-sm font-medium text-gray-500 mb-4">募集者</h3>
          <div class="flex items-start gap-4">
            <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                v-if="recruitment.creator?.avatarUrl"
                :src="recruitment.creator.avatarUrl"
                :alt="recruitment.creator.nickname || ''"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-primary-600 font-semibold text-xl">
                {{ recruitment.creator?.nickname?.charAt(0) || '?' }}
              </span>
            </div>
            <div>
              <p class="font-semibold text-lg">{{ recruitment.creator?.nickname }}</p>
              <p v-if="recruitment.creator?.bio" class="text-gray-600 mt-1 text-sm">
                {{ recruitment.creator.bio }}
              </p>
            </div>
          </div>
        </div>

        <!-- Members -->
        <div v-if="recruitment.members && recruitment.members.length > 0" class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-sm font-medium text-gray-500 mb-4">参加者</h3>
          <div class="flex flex-wrap gap-3">
            <div
              v-for="member in recruitment.members"
              :key="member.id"
              class="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1"
            >
              <div class="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                <img
                  v-if="member.avatarUrl"
                  :src="member.avatarUrl"
                  :alt="member.nickname || ''"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-primary-600 font-semibold text-xs">
                  {{ member.nickname?.charAt(0) || '?' }}
                </span>
              </div>
              <span class="text-sm">{{ member.nickname }}</span>
              <span v-if="member.role === 'OWNER'" class="text-xs text-primary-600">(主催)</span>
            </div>
          </div>
        </div>

        <!-- Meta -->
        <div class="text-center text-sm text-gray-400">
          {{ formatCreatedAt(recruitment.createdAt) }} に投稿
        </div>

        <!-- Actions -->
        <div class="space-y-3">
          <!-- Owner actions -->
          <template v-if="recruitment.isOwner">
            <button
              @click="goToApplications"
              class="w-full py-3 bg-white border border-primary-500 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              申請を管理
            </button>
            <button
              v-if="recruitment.status === 'OPEN'"
              @click="showCloseConfirm = true"
              class="w-full py-3 bg-white border border-yellow-500 text-yellow-600 rounded-lg font-semibold hover:bg-yellow-50 transition-colors"
            >
              募集を締め切る
            </button>
            <button
              v-if="recruitment.status === 'OPEN'"
              @click="showCancelConfirm = true"
              class="w-full py-3 bg-white border border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors"
            >
              募集をキャンセル
            </button>
          </template>

          <!-- Visitor actions -->
          <template v-else>
            <div v-if="recruitment.hasApplied" class="bg-gray-50 rounded-lg p-4 text-center">
              <p class="text-gray-600">
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
            <div v-else class="bg-gray-50 rounded-lg p-4 text-center">
              <p class="text-gray-600">この募集は現在受け付けていません</p>
            </div>
          </template>
        </div>
      </div>
    </main>

    <!-- Apply Modal -->
    <Teleport to="body">
      <div
        v-if="showApplyModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="showApplyModal = false"
      >
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h3 class="text-lg font-bold mb-4">参加を申請</h3>
          <div class="mb-4">
            <label class="block text-sm text-gray-600 mb-2">メッセージ（任意）</label>
            <textarea
              v-model="applyMessage"
              placeholder="自己紹介やコメントを入力できます"
              rows="3"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            ></textarea>
          </div>
          <div class="flex gap-3">
            <button
              @click="showApplyModal = false"
              class="flex-1 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              @click="handleApply"
              :disabled="isLoading"
              class="flex-1 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
            >
              申請する
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Close Confirm Modal -->
    <Teleport to="body">
      <div
        v-if="showCloseConfirm"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="showCloseConfirm = false"
      >
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
          <h3 class="text-lg font-bold mb-4">募集を締め切る</h3>
          <p class="text-gray-600 mb-6">
            募集を締め切りますか？新しい申請を受け付けなくなります。
          </p>
          <div class="flex gap-3">
            <button
              @click="showCloseConfirm = false"
              class="flex-1 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              @click="handleClose"
              :disabled="isLoading"
              class="flex-1 py-2 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 disabled:opacity-50"
            >
              締め切る
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Cancel Confirm Modal -->
    <Teleport to="body">
      <div
        v-if="showCancelConfirm"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="showCancelConfirm = false"
      >
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
          <h3 class="text-lg font-bold mb-4">募集をキャンセル</h3>
          <p class="text-gray-600 mb-6">
            募集をキャンセルしますか？この操作は取り消せません。
          </p>
          <div class="flex gap-3">
            <button
              @click="showCancelConfirm = false"
              class="flex-1 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
            >
              戻る
            </button>
            <button
              @click="handleCancel"
              :disabled="isLoading"
              class="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
