<script setup lang="ts">
import { computed } from 'vue'
import MdiIcon from './MdiIcon.vue'
import { mdiAccount } from '../lib/icons'

interface Props {
  src?: string | null
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  alt?: string
}

const props = withDefaults(defineProps<Props>(), {
  src: null,
  name: null,
  size: 'md',
  alt: 'ユーザーアバター',
})

// サイズに応じたクラス
const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'w-6 h-6 text-xs'
    case 'sm':
      return 'w-8 h-8 text-sm'
    case 'md':
      return 'w-10 h-10 text-base'
    case 'lg':
      return 'w-12 h-12 text-lg'
    case 'xl':
      return 'w-16 h-16 text-xl'
    default:
      return 'w-10 h-10 text-base'
  }
})

// アイコンサイズ
const iconSize = computed(() => {
  switch (props.size) {
    case 'xs':
      return 14
    case 'sm':
      return 18
    case 'md':
      return 22
    case 'lg':
      return 26
    case 'xl':
      return 34
    default:
      return 22
  }
})

// イニシャルを取得
const initial = computed(() => {
  if (!props.name) return null
  // 最初の文字を取得（絵文字対応のためArray.fromを使用）
  const chars = Array.from(props.name.trim())
  return chars.length > 0 ? chars[0].toUpperCase() : null
})

// ユーザー名からハッシュを生成して背景色を決定
const backgroundColor = computed(() => {
  if (!props.name) return 'bg-gray-400'

  // 簡易ハッシュ関数
  let hash = 0
  for (let i = 0; i < props.name.length; i++) {
    hash = props.name.charCodeAt(i) + ((hash << 5) - hash)
  }

  // 色のバリエーション（Tailwindのカラーパレットから選択）
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ]

  return colors[Math.abs(hash) % colors.length]
})

// 画像読み込みエラー時のフラグ
const hasImageError = defineModel<boolean>('hasImageError', { default: false })

const handleImageError = () => {
  hasImageError.value = true
}
</script>

<template>
  <div
    class="rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
    :class="[sizeClasses, !src || hasImageError ? backgroundColor : 'bg-gray-200']"
  >
    <!-- 画像がある場合 -->
    <img
      v-if="src && !hasImageError"
      :src="src"
      :alt="alt"
      class="w-full h-full object-cover"
      @error="handleImageError"
    />
    <!-- イニシャル表示 -->
    <span
      v-else-if="initial"
      class="font-semibold text-white select-none"
    >
      {{ initial }}
    </span>
    <!-- フォールバック: アイコン -->
    <MdiIcon
      v-else
      :path="mdiAccount"
      :size="iconSize"
      class="text-white/80"
    />
  </div>
</template>
