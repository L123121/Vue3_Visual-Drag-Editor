<template>
    <div style="overflow: hidden;">
        <canvas ref="canvas"></canvas>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useOnEvent } from '../common/useOnEvent'

const props = defineProps({
    propValue: {
        type: Object,
        required: true,
        default: () => {},
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

const canvas = ref(null)
let ctx = null
let img = null
let isFirst = true

useOnEvent(props, canvas)

onMounted(() => {
    ctx = canvas.value.getContext('2d')
    drawImage()
})

watch(() => props.element.style.width, drawImage)
watch(() => props.element.style.height, drawImage)
watch(() => props.propValue.flip.vertical, mirrorFlip)
watch(() => props.propValue.flip.horizontal, mirrorFlip)

function drawImage() {
    const { width, height } = props.element.style
    canvas.value.width = width
    canvas.value.height = height
    if (isFirst) {
        isFirst = false
        img = document.createElement('img')
        img.src = props.propValue.url
        img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height)
            mirrorFlip()
        }
    } else {
        mirrorFlip()
    }
}

function mirrorFlip() {
    const { vertical, horizontal } = props.propValue.flip
    const { width, height } = props.element.style
    const hvalue = horizontal ? -1 : 1
    const vValue = vertical ? -1 : 1

    // 清除图片
    ctx.clearRect(0, 0, width, height)
    // 平移图片
    ctx.translate(width / 2 - width * hvalue / 2, height / 2 - height * vValue / 2)
    // 对称镜像
    ctx.scale(hvalue, vValue)
    ctx.drawImage(img, 0, 0, width, height)
    // 还原坐标点
    ctx.setTransform(1, 0, 0, 1, 0, 0)
}
</script>
