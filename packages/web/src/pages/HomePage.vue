<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useWantToDoStore } from '../stores/wantToDo'
import { CATEGORIES, AREA_LABELS, TIMING_LABELS } from '@machi/shared'

const router = useRouter()
const authStore = useAuthStore()
const wantToDoStore = useWantToDoStore()

const showCreateModal = ref(false)

const user = computed(() => authStore.user)
const myWantToDos = computed(() => wantToDoStore.activeWantToDos)
const suggestions = computed(() => wantToDoStore.suggestions)

onMounted(async () => {
  await Promise.all([
    wantToDoStore.fetchMyWantToDos(),
    wantToDoStore.fetchSuggestions(),
  ])
})

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}

const getTimingLabel = (timing: string) => {
  return TIMING_LABELS[timing as keyof typeof TIMING_LABELS] || timing
}

const goToWantToDos = () => {
  router.push('/want-to-dos')
}

const goToWantToDoDetail = (id: string) => {
  router.push(`/want-to-dos/${id}`)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 class="text-xl font-bold text-primary-600">マチマチマッチング</h1>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
              <img v-if="user?.avatarUrl" :src="user.avatarUrl" :alt="user.nickname || ''" class="w-full h-full object-cover" />
              <span v-else class="text-primary-600 font-semibold text-sm">
                {{ user?.nickname?.charAt(0) || '?' }}
              </span>
            </div>
            <span class="text-sm font-medium text-gray-700">{{ user?.nickname }}</span>
          </div>
          <button
            @click="handleLogout"
            class="text-sm text-gray-500 hover:text-gray-700"
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>

    <main class="container mx-auto px-4 py-6 space-y-6">
      <!-- Welcome message -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-semibold mb-2">
          こんにちは、{{ user?.nickname }}さん！
        </h2>
        <p class="text-gray-600">
          {{ AREA_LABELS[user?.area as keyof typeof AREA_LABELS] || user?.area }}エリアで活動中
        </p>
      </div>

      <!-- Quick actions -->
      <div class="grid grid-cols-2 gap-4">
        <button
          @click="showCreateModal = true"
          class="bg-white rounded-lg shadow-sm p-5 text-left hover:shadow-md transition-shadow"
        >
          <div class="text-2xl mb-2">📝</div>
          <h3 class="font-semibold mb-1">やりたいことを表明</h3>
          <p class="text-sm text-gray-500">興味があることをアピール</p>
        </button>
        <button
          class="bg-white rounded-lg shadow-sm p-5 text-left hover:shadow-md transition-shadow opacity-50"
          disabled
        >
          <div class="text-2xl mb-2">📢</div>
          <h3 class="font-semibold mb-1">募集を作成</h3>
          <p class="text-sm text-gray-500">Coming soon...</p>
        </button>
      </div>

      <!-- My want-to-dos -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-md font-semibold">自分のやりたいこと</h3>
          <button @click="goToWantToDos" class="text-sm text-primary-600 hover:underline">
            一覧を見る
          </button>
        </div>

        <div v-if="myWantToDos.length === 0" class="text-center py-6">
          <p class="text-gray-500 mb-3">まだ表明していません</p>
          <button
            @click="showCreateModal = true"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700"
          >
            表明する
          </button>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="item in myWantToDos.slice(0, 3)"
            :key="item.id"
            @click="goToWantToDoDetail(item.id)"
            class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <span class="text-2xl">{{ item.category.icon }}</span>
            <div class="flex-1">
              <p class="font-medium">{{ item.category.name }}</p>
              <span class="text-xs text-primary-600">{{ getTimingLabel(item.timing) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Matching suggestions -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-md font-semibold">マッチング候補</h3>
          <button @click="goToWantToDos" class="text-sm text-primary-600 hover:underline">
            もっと見る
          </button>
        </div>

        <div v-if="suggestions.length === 0" class="text-center py-6">
          <p class="text-gray-500">マッチング候補はまだありません</p>
          <p class="text-sm text-gray-400 mt-1">同じエリア・カテゴリのユーザーが表明すると表示されます</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="item in suggestions.slice(0, 5)"
            :key="item.id"
            @click="goToWantToDoDetail(item.id)"
            class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img
                v-if="item.user?.avatarUrl"
                :src="item.user.avatarUrl"
                :alt="item.user.nickname || ''"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-primary-600 font-semibold text-sm">
                {{ item.user?.nickname?.charAt(0) || '?' }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium text-sm">{{ item.user?.nickname }}</span>
                <span class="text-xl">{{ item.category.icon }}</span>
              </div>
              <p class="text-sm text-gray-600">
                {{ item.category.name }} - {{ getTimingLabel(item.timing) }}
              </p>
              <p v-if="item.comment" class="text-xs text-gray-500 truncate mt-1">
                {{ item.comment }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- User interests -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h3 class="text-md font-semibold mb-4">興味のあるカテゴリ</h3>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="interest in user?.interests"
            :key="interest.id"
            class="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
          >
            {{ CATEGORIES.find(c => c.id === interest.id)?.icon }}
            {{ interest.name }}
          </span>
        </div>
      </div>
    </main>

    <!-- Create Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="showCreateModal = false"
      >
        <CreateWantToDoModal
          @close="showCreateModal = false"
          @created="wantToDoStore.fetchMyWantToDos()"
        />
      </div>
    </Teleport>
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
