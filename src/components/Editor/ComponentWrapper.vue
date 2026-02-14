<template>
    <div @click="onClick" @mouseenter="onMouseEnter">
        <component
            :is="config.component"
            v-if="config.component.startsWith('SVG')"
            ref="componentRef"
            class="component"
            :style="getSVGStyle(config.style)"
            :prop-value="config.propValue"
            :element="config"
            :request="config.request"
            :linkage="config.linkage"
        />

        <component
            :is="config.component"
            v-else
            ref="componentRef"
            class="component"
            :style="getStyle(config.style)"
            :prop-value="config.propValue"
            :element="config"
            :request="config.request"
            :linkage="config.linkage"
        />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getStyle, getSVGStyle } from '@/utils/style'
import runAnimation from '@/utils/runAnimation'
import { events } from '@/utils/events'
import eventBus from '@/utils/eventBus'

const props = defineProps({
    config: {
        type: Object,
        required: true,
        default: () => ({}),
    },
})

const componentRef = ref(null)

onMounted(() => {
    runAnimation(componentRef.value.$el, props.config.animations)
})

function onClick() {
    const eventMap = props.config.events
    Object.keys(eventMap).forEach(key => {
        if (events[key]) {
            events[key](eventMap[key])
        }
    })

    eventBus.emit('v-click', props.config.id)
}

function onMouseEnter() {
    eventBus.emit('v-hover', props.config.id)
}
</script>

<style lang="scss" scoped>
.component {
    position: absolute;
}
</style>
