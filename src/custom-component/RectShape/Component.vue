<template>
  <div class="rect-shape">
    <VText :prop-value="element.propValue" :element="element" />
  </div>
</template>

<script setup lang="ts">
import { useOnEvent } from '../common/useOnEvent'
import type { ComponentData, LinkageConfig } from '@/types'

interface Props {
  propValue: string
  element: ComponentData
  linkage: LinkageConfig
}

const props = defineProps<Props>()

useOnEvent(props)
</script>

<style lang="scss" scoped>
.rect-shape {
  width: 100%;
  height: 100%;
  overflow: auto;
}
</style>
