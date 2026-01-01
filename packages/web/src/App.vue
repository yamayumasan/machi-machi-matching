<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const isInitializing = ref(true)

onMounted(async () => {
  // 認証の初期化を待つ（スプラッシュ表示中）
  await authStore.initialize()
  // 最低でも500ms表示してスムーズな遷移を実現
  await new Promise(resolve => setTimeout(resolve, 500))
  isInitializing.value = false
})
</script>

<template>
  <!-- スプラッシュ画面 -->
  <Transition name="fade">
    <div v-if="isInitializing" class="splash-screen">
      <div class="splash-content">
        <div class="splash-logo">
          <div class="logo-icon">
            <svg viewBox="0 0 64 64" class="w-20 h-20">
              <circle cx="32" cy="32" r="28" fill="currentColor" class="text-primary-500" />
              <circle cx="22" cy="28" r="4" fill="white" />
              <circle cx="42" cy="28" r="4" fill="white" />
              <path d="M 20 38 Q 32 48 44 38" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" />
            </svg>
          </div>
          <h1 class="splash-title">マチマチ<br />マッチング</h1>
        </div>
        <div class="splash-loader">
          <div class="loader-dot"></div>
          <div class="loader-dot"></div>
          <div class="loader-dot"></div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- メインコンテンツ -->
  <div v-if="!isInitializing" class="min-h-screen bg-gray-50">
    <RouterView :key="route.fullPath" />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.splash-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  z-index: 9999;
}

.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.splash-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.logo-icon {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.splash-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  text-align: center;
  line-height: 1.3;
}

.splash-loader {
  display: flex;
  gap: 0.5rem;
}

.loader-dot {
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite both;
}

.loader-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loader-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
