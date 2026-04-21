<template>
  <div class="line-shape"></div>
</template>

<script setup lang="ts">
import { useOnEvent } from '../common/useOnEvent'
import type { ComponentData, LinkageConfig } from '@/types'

interface Props {
  element: ComponentData
  linkage: LinkageConfig
}

const props = defineProps<Props>()

useOnEvent(props)
</script>

<style lang="scss" scoped>
.line-shape {
  width: 100%;
  height: 100%;
  overflow: auto;
}
</style>
