<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import MdiIcon from './MdiIcon.vue'
import { mdiClose } from '../lib/icons'

interface Props {
  /** モーダルの表示状態 */
  modelValue: boolean
  /** タイトル */
  title?: string
  /** フルスクリーン表示（モバイルのみ） */
  fullscreen?: boolean
  /** 閉じるボタンを表示 */
  showClose?: boolean
  /** 背景クリックで閉じる */
  closeOnBackdrop?: boolean
  /** 最大幅（PC時） */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  fullscreen: false,
  showClose: true,
  closeOnBackdrop: true,
  maxWidth: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

// モバイル判定
const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  document.removeEventListener('keydown', handleKeydown)
})

// ESCキーで閉じる
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue) {
    close()
  }
}

// 閉じる処理
const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

// 背景クリック
const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    close()
  }
}

// ボディスクロール制御
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)

onUnmounted(() => {
  document.body.style.overflow = ''
})

// PC時の最大幅クラス
const maxWidthClass = computed(() => {
  const widths: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  }
  return widths[props.maxWidth]
})

// モバイル時のシートクラス
const sheetClass = computed(() => {
  if (!isMobile.value) {
    // PC: 中央モーダル
    return `${maxWidthClass.value} w-full max-h-[90vh] rounded-xl`
  }
  // モバイル: ボトムシート
  if (props.fullscreen) {
    return 'w-full h-full rounded-none'
  }
  return 'w-full max-h-[85vh] rounded-t-2xl'
})

// コンテナクラス
const containerClass = computed(() => {
  if (!isMobile.value) {
    // PC: 中央配置
    return 'flex items-center justify-center p-4'
  }
  // モバイル: 下部配置
  if (props.fullscreen) {
    return 'flex items-stretch'
  }
  return 'flex items-end'
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[9999] bg-black/50"
        :class="containerClass"
        @click.self="handleBackdropClick"
      >
        <Transition
          :enter-active-class="isMobile && !fullscreen ? 'transition-transform duration-300 ease-out' : 'transition-all duration-200 ease-out'"
          :enter-from-class="isMobile && !fullscreen ? 'translate-y-full' : 'opacity-0 scale-95'"
          :enter-to-class="isMobile && !fullscreen ? 'translate-y-0' : 'opacity-100 scale-100'"
          :leave-active-class="isMobile && !fullscreen ? 'transition-transform duration-200 ease-in' : 'transition-all duration-200 ease-in'"
          :leave-from-class="isMobile && !fullscreen ? 'translate-y-0' : 'opacity-100 scale-100'"
          :leave-to-class="isMobile && !fullscreen ? 'translate-y-full' : 'opacity-0 scale-95'"
        >
          <div
            v-if="modelValue"
            class="bg-white shadow-2xl flex flex-col overflow-hidden"
            :class="sheetClass"
          >
            <!-- ドラッグハンドル（モバイル・非フルスクリーン時） -->
            <div
              v-if="isMobile && !fullscreen"
              class="flex justify-center py-2 flex-shrink-0"
            >
              <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>

            <!-- ヘッダー -->
            <div
              v-if="title || showClose"
              class="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0"
            >
              <h2 class="text-lg font-bold text-gray-900">{{ title }}</h2>
              <button
                v-if="showClose"
                @click="close"
                class="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <MdiIcon :path="mdiClose" :size="24" />
              </button>
            </div>

            <!-- コンテンツ -->
            <div class="flex-1 overflow-y-auto">
              <slot></slot>
            </div>

            <!-- フッター（オプション） -->
            <div v-if="$slots.footer" class="flex-shrink-0 border-t border-gray-100">
              <slot name="footer"></slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
