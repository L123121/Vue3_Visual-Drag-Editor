<template>
    <div class="rect-shape">
        <VText :prop-value="element.propValue" :element="element" />
    </div>
</template>

<script setup>
import { useOnEvent } from '../common/useOnEvent'

const props = defineProps({
    propValue: {
        type: String,
        required: true,
        default: '',
    },
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
.rect-shape {
    width: 100%;
    height: 100%;
    overflow: auto;
}
</style>
