<template>
    <div ref="container" class="bg">
        <el-button v-if="!isScreenshot" class="close" @click="close">关闭</el-button>
        <el-button v-else class="close" @click="htmlToImage">确定</el-button>
        <div class="canvas-container">
            <div
                class="canvas"
                :style="{
                    ...getCanvasStyle(canvasStyleData),
                    width: changeStyleWithScale(canvasStyleData.width) + 'px',
                    height: changeStyleWithScale(canvasStyleData.height) + 'px',
                }"
            >
                <ComponentWrapper
                    v-for="(item, index) in copyData"
                    :key="index"
                    :config="item"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getCanvasStyle } from '@/utils/style'
import ComponentWrapper from './ComponentWrapper.vue'
import { changeStyleWithScale } from '@/utils/translate'
import { toPng } from 'html-to-image'
import { deepCopy } from '@/utils/utils'
import { useStore } from '@/store'
import { storeToRefs } from 'pinia'
import type { ComponentData } from '@/types'

const props = defineProps({
  isScreenshot: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useStore()
const { componentData, canvasStyleData } = storeToRefs(store)

const copyData = ref<ComponentData[]>([])
const container = ref<HTMLElement | null>(null)

onMounted(() => {
  copyData.value = deepCopy(componentData.value)
})

function close(): void {
  emit('close')
}

function htmlToImage(): void {
  if (!container.value) return
  const canvas = container.value.querySelector('.canvas') as HTMLElement
  if (!canvas) return

  toPng(canvas)
    .then(dataUrl => {
      const a = document.createElement('a')
      a.setAttribute('download', 'screenshot')
      a.href = dataUrl
      a.click()
    })
    .catch(error => {
      console.error('oops, something went wrong!', error)
    })
    .finally(close)
}
</script>

<style lang="scss" scoped>
.bg {
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
    position: fixed;
    background: rgba(0, 0, 0, .8);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 0;

    .canvas-container {
        width: 100%;
        height: 100%;
        overflow: auto;
        padding: 60px;
        display: flex;
        align-items: flex-start;
        justify-content: center;

        .canvas {
            background: #fff;
            position: relative;
            flex-shrink: 0;
            box-shadow: 0 0 20px rgba(0,0,0,0.2);
        }
    }

    .close {
        position: absolute;
        right: 40px;
        top: 30px;
        z-index: 10001;
    }
}
</style>
