<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CATEGORIES } from '@machi/shared'

const apiStatus = ref<string>('確認中...')

onMounted(async () => {
  try {
    const response = await fetch('/api/health')
    const data = await response.json()
    apiStatus.value = data.status === 'ok' ? '接続OK' : '接続エラー'
  } catch {
    apiStatus.value = 'APIサーバーに接続できません'
  }
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <header class="text-center mb-12">
      <h1 class="text-4xl font-bold text-primary-600 mb-2">マチマチマッチング</h1>
      <p class="text-gray-600">街で、待ちで、マッチング。</p>
    </header>

    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">APIステータス</h2>
      <p class="text-lg">
        バックエンド接続:
        <span
          :class="apiStatus === '接続OK' ? 'text-green-600' : 'text-red-600'"
          class="font-semibold"
        >
          {{ apiStatus }}
        </span>
      </p>
    </div>

    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold mb-4">カテゴリ一覧</h2>
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
  </div>
</template>
