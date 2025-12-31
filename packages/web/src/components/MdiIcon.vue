<script setup lang="ts">
interface Props {
  path: string
  size?: number | string
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  color: 'currentColor',
})

const computedSize = typeof props.size === 'number' ? `${props.size}px` : props.size
</script>

<template>
  <svg
    :width="computedSize"
    :height="computedSize"
    viewBox="0 0 24 24"
    :fill="color"
    class="mdi-icon"
  >
    <path :d="path" />
  </svg>
</template>

<style scoped>
.mdi-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
