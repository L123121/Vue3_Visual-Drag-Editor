<template>
    <div class="svg-triangle-container">
        <svg
            version="1.1"
            baseProfile="full"
            xmlns="http://www.w3.org/2000/svg"
        >
            <polygon
                ref="triangle"
                :points="points"
                :stroke="element.style.borderColor"
                :fill="element.style.backgroundColor"
                stroke-width="1"
            />
        </svg>
        <VText :prop-value="element.propValue" :element="element" />
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useOnEvent } from '../../common/useOnEvent'

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

const points = ref('')
useOnEvent(props)

onMounted(() => {
    draw()
})

watch(() => props.element.style.width, draw)
watch(() => props.element.style.height, draw)

function draw() {
    const { width, height } = props.element.style
    drawTriangle(width, height)
}

function drawTriangle(width, height) {
    // 五角星十个坐标点的比例集合
    const pointsArr = [
        [0.5, 0.05],
        [1, 0.95],
        [0, 0.95],
    ]

    const coordinatePoints = pointsArr.map(point => width * point[0] + ' ' + height * point[1])
    points.value = coordinatePoints.toString()
}
</script>

<style lang="scss" scoped>
.svg-triangle-container {
    width: 100%;
    height: 100%;

    svg {
        width: 100%;
        height: 100%;
    }

    .v-text {
        position: absolute;
        top: 72%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 50%;
        height: 40%;
    }
}
</style>
