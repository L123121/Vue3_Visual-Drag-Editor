<template>
    <div class="circle-shape">
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
.circle-shape {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: auto;
}
</style>
