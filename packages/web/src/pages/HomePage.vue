<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { CATEGORIES, AREA_LABELS } from '@machi/shared'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
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

    <main class="container mx-auto px-4 py-8">
      <!-- Welcome message -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-lg font-semibold mb-2">
          こんにちは、{{ user?.nickname }}さん！
        </h2>
        <p class="text-gray-600">
          {{ AREA_LABELS[user?.area as keyof typeof AREA_LABELS] || user?.area }}エリアで活動中
        </p>
      </div>

      <!-- User interests -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
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

      <!-- Quick actions -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <button
          class="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-shadow"
        >
          <div class="text-2xl mb-2">📝</div>
          <h3 class="font-semibold mb-1">やりたいことを表明</h3>
          <p class="text-sm text-gray-500">興味があることをアピール</p>
        </button>
        <button
          class="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-shadow"
        >
          <div class="text-2xl mb-2">📢</div>
          <h3 class="font-semibold mb-1">募集を作成</h3>
          <p class="text-sm text-gray-500">仲間を募集する</p>
        </button>
      </div>

      <!-- All categories -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-md font-semibold mb-4">すべてのカテゴリ</h3>
        <div class="grid grid-cols-3 md:grid-cols-5 gap-4">
          <div
            v-for="category in CATEGORIES"
            :key="category.id"
            class="flex flex-col items-center p-4 rounded-lg bg-gray-50 hover:bg-primary-50 transition-colors cursor-pointer"
          >
            <span class="text-3xl mb-2">{{ category.icon }}</span>
            <span class="text-sm text-gray-700">{{ category.name }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
