<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRecruitmentStore } from '../stores/recruitment'
import { AREA_LABELS } from '@machi/shared'
import UserAvatar from '../components/UserAvatar.vue'

const router = useRouter()
const route = useRoute()
const recruitmentStore = useRecruitmentStore()

const showRespondConfirm = ref(false)
const selectedApplication = ref<{ id: string; action: 'APPROVE' | 'REJECT' } | null>(null)

const isLoading = computed(() => recruitmentStore.isLoading)
const recruitment = computed(() => recruitmentStore.currentRecruitment)
const applications = computed(() => recruitmentStore.applications)

onMounted(async () => {
  const id = route.params.id as string
  await Promise.all([
    recruitmentStore.fetchRecruitment(id),
    recruitmentStore.fetchApplications(id),
  ])
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDING':
      return '承認待ち'
    case 'APPROVED':
      return '承認済み'
    case 'REJECTED':
      return '不承認'
    case 'CANCELLED':
      return 'キャンセル'
    default:
      return status
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-700'
    case 'APPROVED':
      return 'bg-green-100 text-green-700'
    case 'REJECTED':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const openRespondConfirm = (applicationId: string, action: 'APPROVE' | 'REJECT') => {
  selectedApplication.value = { id: applicationId, action }
  showRespondConfirm.value = true
}

const handleRespond = async () => {
  if (!selectedApplication.value || !recruitment.value) return

  const success = await recruitmentStore.respondToApplication(
    recruitment.value.id,
    selectedApplication.value.id,
    selectedApplication.value.action
  )

  if (success) {
    showRespondConfirm.value = false
    selectedApplication.value = null
  }
}

const goBack = () => {
  router.back()
}

const pendingApplications = computed(() =>
  applications.value.filter((a) => a.status === 'PENDING')
)

const respondedApplications = computed(() =>
  applications.value.filter((a) => a.status !== 'PENDING')
)
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
        <h1 class="text-lg font-bold">申請管理</h1>
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

      <template v-else>
        <!-- Recruitment info -->
        <div v-if="recruitment" class="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div class="flex items-center gap-3">
            <span class="text-2xl">{{ recruitment.category.icon }}</span>
            <div>
              <h2 class="font-semibold">{{ recruitment.title }}</h2>
              <p class="text-sm text-gray-500">
                {{ recruitment.currentPeople }}/{{ recruitment.maxPeople }}人参加中
              </p>
            </div>
          </div>
        </div>

        <!-- Pending Applications -->
        <div class="mb-8">
          <h3 class="text-sm font-medium text-gray-500 mb-4">
            承認待ち ({{ pendingApplications.length }})
          </h3>

          <div v-if="pendingApplications.length === 0" class="bg-white rounded-lg shadow-sm p-6 text-center">
            <p class="text-gray-500">承認待ちの申請はありません</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="app in pendingApplications"
              :key="app.id"
              class="bg-white rounded-lg shadow-sm p-4"
            >
              <div class="flex items-start gap-4">
                <UserAvatar
                  :src="app.applicant?.avatarUrl"
                  :name="app.applicant?.nickname"
                  size="lg"
                  class="flex-shrink-0"
                />

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-medium">{{ app.applicant?.nickname }}</span>
                    <span v-if="app.applicant?.area" class="text-xs text-gray-400">
                      {{ AREA_LABELS[app.applicant.area as keyof typeof AREA_LABELS] }}
                    </span>
                  </div>
                  <p v-if="app.applicant?.bio" class="text-sm text-gray-600 mb-2">
                    {{ app.applicant.bio }}
                  </p>
                  <div v-if="app.message" class="bg-gray-50 rounded p-2 mb-2">
                    <p class="text-sm text-gray-700">{{ app.message }}</p>
                  </div>
                  <p class="text-xs text-gray-400">
                    {{ formatDate(app.createdAt) }} に申請
                  </p>
                </div>
              </div>

              <div class="flex gap-3 mt-4">
                <button
                  @click="openRespondConfirm(app.id, 'REJECT')"
                  class="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  お断りする
                </button>
                <button
                  @click="openRespondConfirm(app.id, 'APPROVE')"
                  class="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  承認する
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Responded Applications -->
        <div>
          <h3 class="text-sm font-medium text-gray-500 mb-4">
            対応済み ({{ respondedApplications.length }})
          </h3>

          <div v-if="respondedApplications.length === 0" class="bg-white rounded-lg shadow-sm p-6 text-center">
            <p class="text-gray-500">対応済みの申請はありません</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="app in respondedApplications"
              :key="app.id"
              class="bg-white rounded-lg shadow-sm p-4"
            >
              <div class="flex items-center gap-4">
                <UserAvatar
                  :src="app.applicant?.avatarUrl"
                  :name="app.applicant?.nickname"
                  size="md"
                  class="flex-shrink-0"
                />

                <div class="flex-1 min-w-0">
                  <span class="font-medium">{{ app.applicant?.nickname }}</span>
                  <p class="text-xs text-gray-400">
                    {{ formatDate(app.respondedAt || app.createdAt) }}
                  </p>
                </div>

                <span
                  :class="[
                    'px-3 py-1 rounded-full text-xs font-medium',
                    getStatusClass(app.status),
                  ]"
                >
                  {{ getStatusLabel(app.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>

    <!-- Respond Confirm Modal -->
    <Teleport to="body">
      <div
        v-if="showRespondConfirm && selectedApplication"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="showRespondConfirm = false"
      >
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
          <h3 class="text-lg font-bold mb-4">
            {{ selectedApplication.action === 'APPROVE' ? '申請を承認' : '申請をお断り' }}
          </h3>
          <p class="text-gray-600 mb-6">
            {{
              selectedApplication.action === 'APPROVE'
                ? 'この申請を承認しますか？参加者に通知されます。'
                : 'この申請をお断りしますか？'
            }}
          </p>
          <div class="flex gap-3">
            <button
              @click="showRespondConfirm = false"
              class="flex-1 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              @click="handleRespond"
              :disabled="isLoading"
              :class="[
                'flex-1 py-2 rounded-lg font-semibold disabled:opacity-50',
                selectedApplication.action === 'APPROVE'
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700',
              ]"
            >
              {{ selectedApplication.action === 'APPROVE' ? '承認する' : 'お断りする' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
