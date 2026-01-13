<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRecruitmentStore } from '../stores/recruitment'
import { useAuthStore } from '../stores/auth'
import { CATEGORIES, AREA_LABELS, type Area } from '@machi/shared'
import MdiIcon from '../components/MdiIcon.vue'
import LocationPicker from '../components/LocationPicker.vue'
import RecruitmentCreatedModal from '../components/RecruitmentCreatedModal.vue'
import { getIconPath, mdiClose } from '../lib/icons'

const router = useRouter()
const recruitmentStore = useRecruitmentStore()
const authStore = useAuthStore()

const isLoading = computed(() => recruitmentStore.isLoading)

// Form data
const title = ref('')
const categoryId = ref('')
const description = ref('')
const useDatetime = ref(true) // true = 具体的な日時, false = 柔軟な日時
const datetime = ref('')
const datetimeFlex = ref('')
const area = ref<string>(authStore.user?.area || 'TOKYO')
const locationText = ref('')
const locationData = ref<{
  latitude: number | null
  longitude: number | null
  locationName: string | null
}>({
  latitude: authStore.user?.latitude ?? null,
  longitude: authStore.user?.longitude ?? null,
  locationName: authStore.user?.locationName ?? null,
})
const minPeople = ref(2)
const maxPeople = ref(5)

// 完了モーダル関連
const showCreatedModal = ref(false)
const createdRecruitmentId = ref('')
const createdRecruitmentTitle = ref('')

// エリア変更時に位置情報をリセット
watch(area, () => {
  locationData.value = {
    latitude: null,
    longitude: null,
    locationName: null,
  }
})

// Validation
const errors = ref<Record<string, string>>({})

const validate = () => {
  errors.value = {}

  if (!title.value.trim()) {
    errors.value.title = 'タイトルを入力してください'
  }

  if (!categoryId.value) {
    errors.value.categoryId = 'カテゴリを選択してください'
  }

  if (!useDatetime.value && !datetimeFlex.value.trim()) {
    errors.value.datetimeFlex = '日時の柔軟性を入力してください'
  }

  if (minPeople.value < 1) {
    errors.value.minPeople = '最少人数は1以上にしてください'
  }

  if (maxPeople.value < minPeople.value) {
    errors.value.maxPeople = '最大人数は最少人数以上にしてください'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validate()) return

  const result = await recruitmentStore.createRecruitment({
    title: title.value.trim(),
    categoryId: categoryId.value,
    description: description.value.trim() || null,
    datetime: useDatetime.value && datetime.value ? new Date(datetime.value).toISOString() : null,
    datetimeFlex: !useDatetime.value ? datetimeFlex.value.trim() : null,
    area: area.value,
    location: locationText.value.trim() || locationData.value.locationName || null,
    latitude: locationData.value.latitude,
    longitude: locationData.value.longitude,
    locationName: locationData.value.locationName,
    minPeople: minPeople.value,
    maxPeople: maxPeople.value,
  })

  if (result) {
    createdRecruitmentId.value = result.id
    createdRecruitmentTitle.value = title.value.trim()
    showCreatedModal.value = true
  }
}

// フォームをリセット
const resetForm = () => {
  title.value = ''
  categoryId.value = ''
  description.value = ''
  useDatetime.value = true
  datetime.value = ''
  datetimeFlex.value = ''
  area.value = authStore.user?.area || 'TOKYO'
  locationText.value = ''
  locationData.value = {
    latitude: authStore.user?.latitude ?? null,
    longitude: authStore.user?.longitude ?? null,
    locationName: authStore.user?.locationName ?? null,
  }
  minPeople.value = 2
  maxPeople.value = 5
  errors.value = {}
}

// モーダルアクション
const handleGoHome = () => {
  router.push('/')
}

const handleCreateAnother = () => {
  resetForm()
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <header class="bg-white border-b border-primary-200 sticky top-0 z-10">
      <div class="container mx-auto px-4 py-4 flex items-center gap-4">
        <button @click="goBack" class="text-primary-500 hover:text-primary-700">
          <MdiIcon :path="mdiClose" :size="24" />
        </button>
        <h1 class="text-lg font-semibold text-primary-900">募集を作成</h1>
      </div>
    </header>

    <main class="container mx-auto px-4 py-6">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Title -->
        <div class="bg-white rounded-lg border border-primary-200 p-4">
          <label class="block text-sm font-medium text-primary-700 mb-2">
            タイトル <span class="text-red-500">*</span>
          </label>
          <input
            v-model="title"
            type="text"
            placeholder="例：週末にカフェでコーヒー飲みませんか？"
            class="w-full px-4 py-3 text-base border border-primary-200 rounded-md focus:ring-2 focus:ring-accent-500/20 focus:border-accent-600"
            :class="{ 'border-red-500': errors.title }"
          />
          <p v-if="errors.title" class="mt-1 text-sm text-red-500">{{ errors.title }}</p>
        </div>

        <!-- Category -->
        <div class="bg-white rounded-lg border border-primary-200 p-4">
          <label class="block text-sm font-medium text-primary-700 mb-2">
            カテゴリ <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="cat in CATEGORIES"
              :key="cat.id"
              type="button"
              @click="categoryId = cat.id"
              :class="[
                'p-3 rounded-lg border-2 text-center transition-colors',
                categoryId === cat.id
                  ? 'border-accent-600 bg-accent-50'
                  : 'border-primary-200 hover:border-primary-300',
              ]"
            >
              <MdiIcon :path="getIconPath(cat.icon)" :size="28" :class="categoryId === cat.id ? 'text-accent-600' : 'text-primary-600'" class="mb-1" />
              <div class="text-xs font-medium text-primary-700">{{ cat.name }}</div>
            </button>
          </div>
          <p v-if="errors.categoryId" class="mt-2 text-sm text-red-500">{{ errors.categoryId }}</p>
        </div>

        <!-- Description -->
        <div class="bg-white rounded-lg border border-primary-200 p-4">
          <label class="block text-sm font-medium text-primary-700 mb-2">
            詳細説明
          </label>
          <textarea
            v-model="description"
            placeholder="募集の詳細を入力してください（任意）"
            rows="4"
            class="w-full px-4 py-3 text-base border border-primary-200 rounded-md focus:ring-2 focus:ring-accent-500/20 focus:border-accent-600 resize-none"
          ></textarea>
        </div>

        <!-- DateTime -->
        <div class="bg-white rounded-lg border border-primary-200 p-4">
          <label class="block text-sm font-medium text-primary-700 mb-2">
            日時
          </label>
          <div class="flex gap-4 mb-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                v-model="useDatetime"
                :value="true"
                class="text-accent-600 focus:ring-accent-500"
              />
              <span class="text-sm text-primary-700">日時を指定</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                v-model="useDatetime"
                :value="false"
                class="text-accent-600 focus:ring-accent-500"
              />
              <span class="text-sm text-primary-700">柔軟に調整</span>
            </label>
          </div>

          <div v-if="useDatetime">
            <input
              v-model="datetime"
              type="datetime-local"
              class="w-full px-4 py-3 text-base border border-primary-200 rounded-md focus:ring-2 focus:ring-accent-500/20 focus:border-accent-600"
            />
          </div>
          <div v-else>
            <input
              v-model="datetimeFlex"
              type="text"
              placeholder="例：今週末の午後、平日の夜など"
              class="w-full px-4 py-3 text-base border border-primary-200 rounded-md focus:ring-2 focus:ring-accent-500/20 focus:border-accent-600"
              :class="{ 'border-red-500': errors.datetimeFlex }"
            />
            <p v-if="errors.datetimeFlex" class="mt-1 text-sm text-red-500">{{ errors.datetimeFlex }}</p>
          </div>
        </div>

        <!-- Area -->
        <div class="bg-white rounded-lg border border-primary-200 p-4">
          <label class="block text-sm font-medium text-primary-700 mb-2">
            エリア <span class="text-red-500">*</span>
          </label>
          <div class="flex gap-4">
            <label
              v-for="(label, key) in AREA_LABELS"
              :key="key"
              class="flex-1"
            >
              <input
                type="radio"
                v-model="area"
                :value="key"
                class="sr-only peer"
              />
              <div
                class="p-4 text-center rounded-lg border-2 cursor-pointer transition-colors peer-checked:border-accent-600 peer-checked:bg-accent-50 border-primary-200 hover:border-primary-300"
              >
                <span class="font-medium text-primary-700">{{ label }}</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Location -->
        <div class="bg-white rounded-lg border border-primary-200 p-4">
          <LocationPicker
            v-model="locationData"
            :area="area as Area"
            :show-map-option="true"
            label="場所"
          />
          <div v-if="!locationData.locationName" class="mt-3">
            <p class="text-sm text-primary-500 mb-2">または直接入力</p>
            <input
              v-model="locationText"
              type="text"
              placeholder="例：仙台駅周辺、渋谷のカフェなど"
              class="w-full px-4 py-3 text-base border border-primary-200 rounded-md focus:ring-2 focus:ring-accent-500/20 focus:border-accent-600"
            />
          </div>
        </div>

        <!-- People -->
        <div class="bg-white rounded-lg border border-primary-200 p-4">
          <label class="block text-sm font-medium text-primary-700 mb-2">
            募集人数
          </label>
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <label class="block text-xs text-primary-500 mb-1">最少人数</label>
              <select
                v-model="minPeople"
                class="w-full px-4 py-3 text-base border border-primary-200 rounded-md focus:ring-2 focus:ring-accent-500/20 focus:border-accent-600"
              >
                <option v-for="n in 10" :key="n" :value="n">{{ n }}人</option>
              </select>
            </div>
            <span class="text-primary-400 pt-4">〜</span>
            <div class="flex-1">
              <label class="block text-xs text-primary-500 mb-1">最大人数</label>
              <select
                v-model="maxPeople"
                class="w-full px-4 py-3 text-base border border-primary-200 rounded-md focus:ring-2 focus:ring-accent-500/20 focus:border-accent-600"
              >
                <option v-for="n in 20" :key="n" :value="n">{{ n }}人</option>
              </select>
            </div>
          </div>
          <p v-if="errors.minPeople" class="mt-1 text-sm text-red-500">{{ errors.minPeople }}</p>
          <p v-if="errors.maxPeople" class="mt-1 text-sm text-red-500">{{ errors.maxPeople }}</p>
          <p class="mt-2 text-xs text-primary-500">※ 募集者を含む人数を指定してください</p>
        </div>

        <!-- Error message -->
        <div v-if="recruitmentStore.error" class="bg-red-50 border border-red-200 rounded-md p-4">
          <p class="text-red-600 text-sm">{{ recruitmentStore.error }}</p>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-4 bg-accent-600 text-white rounded-lg font-medium hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="isLoading">作成中...</span>
          <span v-else>募集を作成する</span>
        </button>
      </form>
    </main>

    <!-- 作成完了モーダル -->
    <RecruitmentCreatedModal
      v-model="showCreatedModal"
      :recruitment-id="createdRecruitmentId"
      :recruitment-title="createdRecruitmentTitle"
      @go-home="handleGoHome"
      @create-another="handleCreateAnother"
    />
  </div>
</template>
