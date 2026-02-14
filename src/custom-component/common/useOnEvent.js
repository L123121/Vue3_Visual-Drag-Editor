import { onMounted, onBeforeUnmount } from 'vue'
import eventBus from '@/utils/eventBus'

export function useOnEvent(props, elementRef) {
    function changeStyle(data = []) {
        data.forEach(item => {
            item.style.forEach(e => {
                if (e.key) {
                    props.element.style[e.key] = e.value
                }
            })
        })
    }

    function onClick(componentId) {
        const data = props.linkage.data.filter(item => item.id === componentId && item.event === 'v-click')
        changeStyle(data)
    }

    function onHover(componentId) {
        const data = props.linkage.data.filter(item => item.id === componentId && item.event === 'v-hover')
        changeStyle(data)
    }

    onMounted(() => {
        const { data, duration } = props.linkage || {}
        if (data?.length) {
            if (elementRef && elementRef.value) {
                elementRef.value.style.transition = `all ${duration}s`
            }
            eventBus.on('v-click', onClick)
            eventBus.on('v-hover', onHover)
        }
    })

    onBeforeUnmount(() => {
        if (props.linkage?.data?.length) {
            eventBus.off('v-click', onClick)
            eventBus.off('v-hover', onHover)
        }
    })
}
