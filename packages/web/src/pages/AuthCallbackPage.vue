<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const error = ref('')

onMounted(async () => {
  // Get tokens from URL hash (Supabase returns them in the hash)
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  const accessToken = hashParams.get('access_token')
  const refreshToken = hashParams.get('refresh_token')

  if (!accessToken || !refreshToken) {
    error.value = '認証に失敗しました。もう一度お試しください。'
    setTimeout(() => {
      router.push('/login')
    }, 3000)
    return
  }

  const success = await authStore.handleOAuthCallback(accessToken, refreshToken)

  if (success) {
    if (authStore.needsOnboarding) {
      router.push('/onboarding')
    } else {
      router.push('/')
    }
  } else {
    error.value = authStore.error || '認証に失敗しました'
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 bg-gray-50">
    <div class="text-center">
      <div v-if="error" class="text-red-600 mb-4">
        {{ error }}
      </div>
      <div v-else class="flex flex-col items-center">
        <svg class="animate-spin h-8 w-8 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-gray-600">認証中...</p>
      </div>
    </div>
  </div>
</template>
