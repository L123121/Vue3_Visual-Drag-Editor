<template>
    <div class="line-shape"></div>
</template>

<script setup>
import { useOnEvent } from '../common/useOnEvent'

const props = defineProps({
    element: {
        type: Object,
        default: () => {},
    },
    linkage: {
        type: Object,
        default: () => {},
    },
})

useOnEvent(props)
</script>

<style lang="scss" scoped>
.line-shape {
    width: 100%;
    height: 100%;
    overflow: auto;
}
</style>
