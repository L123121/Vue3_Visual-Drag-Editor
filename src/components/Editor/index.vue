<template>
    <div
        id="editor"
        class="editor"
        :class="{ edit: isEdit }"
        :style="{
            ...getCanvasStyle(canvasStyleData),
            width: changeStyleWithScale(canvasStyleData.width) + 'px',
            height: changeStyleWithScale(canvasStyleData.height) + 'px',
        }"
        @contextmenu="handleContextMenu"
        @mousedown="handleMouseDown"
    >
        <!-- 网格线 -->
        <Grid :is-dark-mode="isDarkMode" />

        <!--页面组件列表展示-->
        <Shape
            v-for="(item, index) in componentData"
            :key="item.id"
            :default-style="item.style"
            :style="getShapeStyle(item.style)"
            :active="item.id === (curComponent || {}).id"
            :element="item"
            :index="index"
            :class="{ lock: item.isLock }"
        >
            <component
                :is="item.component"
                v-if="item.component.startsWith('SVG')"
                :id="'component' + item.id"
                :style="getSVGStyle(item.style)"
                class="component"
                :prop-value="item.propValue"
                :element="item"
                :request="item.request"
            />

            <component
                :is="item.component"
                v-else-if="item.component != 'VText'"
                :id="'component' + item.id"
                class="component"
                :style="getComponentStyle(item.style)"
                :prop-value="item.propValue"
                :element="item"
                :request="item.request"
            />

            <component
                :is="item.component"
                v-else
                :id="'component' + item.id"
                class="component"
                :style="getComponentStyle(item.style)"
                :prop-value="item.propValue"
                :element="item"
                :request="item.request"
                @input="handleInput"
            />
        </Shape>
        <!-- 右击菜单 -->
        <ContextMenu />
        <!-- 标线 -->
        <MarkLine />
        <!-- 选中区域 -->
        <Area
            v-show="isShowArea"
            :start="start"
            :width="width"
            :height="height"
        />
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useStore } from '@/store'
import { storeToRefs } from 'pinia'
import Shape from './Shape.vue'
import ContextMenu from './ContextMenu.vue'
import MarkLine from './MarkLine.vue'
import Area from './Area.vue'
import Grid from './Grid.vue'
import eventBus from '@/utils/eventBus'
import { getStyle, getComponentRotatedStyle, getShapeStyle as getShapeStyleUtils, getSVGStyle as getSVGStyleUtils, getCanvasStyle as getCanvasStyleUtils } from '@/utils/style'
import { $, isPreventDrop } from '@/utils/utils'
import { changeStyleWithScale as changeStyleWithScaleUtils } from '@/utils/translate'

const props = defineProps({
    isEdit: {
        type: Boolean,
        default: true,
    },
})

const store = useStore()
const { componentData, curComponent, canvasStyleData, editor, isDarkMode } = storeToRefs(store)

const editorX = ref(0)
const editorY = ref(0)
const start = ref({ x: 0, y: 0 })
const width = ref(0)
const height = ref(0)
const isShowArea = ref(false)
const svgFilterAttrs = ['width', 'height', 'top', 'left', 'rotate']

onMounted(() => {
    // 获取编辑器元素
    store.getEditor()

    eventBus.on('hideArea', hideArea)
})

onUnmounted(() => {
    eventBus.off('hideArea', hideArea)
})

function getShapeStyle(style) {
    return getShapeStyleUtils(style)
}

function getCanvasStyle(style) {
    return getCanvasStyleUtils(style)
}

function changeStyleWithScale(value) {
    return changeStyleWithScaleUtils(value)
}

function handleMouseDown(e) {
    // 如果没有选中组件 在画布上点击时需要调用 e.preventDefault() 防止触发 drop 事件
    if (!curComponent.value || (isPreventDrop(curComponent.value.component))) {
        e.preventDefault()
    }

    hideArea()

    // 获取编辑器的位移信息，每次点击时都需要获取一次。主要是为了方便开发时调试用。
    const rectInfo = editor.value.getBoundingClientRect()
    editorX.value = rectInfo.x
    editorY.value = rectInfo.y

    const startX = e.clientX
    const startY = e.clientY
    start.value.x = startX - editorX.value
    start.value.y = startY - editorY.value
    // 展示选中区域
    isShowArea.value = true

    // 框选期间禁止文字选中
    const preventSelect = (e) => e.preventDefault()
    document.addEventListener('selectstart', preventSelect)

    const move = (moveEvent) => {
        width.value = Math.abs(moveEvent.clientX - startX)
        height.value = Math.abs(moveEvent.clientY - startY)
        if (moveEvent.clientX < startX) {
            start.value.x = moveEvent.clientX - editorX.value
        }

        if (moveEvent.clientY < startY) {
            start.value.y = moveEvent.clientY - editorY.value
        }
    }

    const up = (e) => {
        document.removeEventListener('mousemove', move)
        document.removeEventListener('mouseup', up)
        document.removeEventListener('selectstart', preventSelect)

        if (e.clientX == startX && e.clientY == startY) {
            hideArea()
            return
        }

        createGroup()
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
}

function hideArea() {
    isShowArea.value = false
    width.value = 0
    height.value = 0

    store.setAreaData({
        style: {
            left: 0,
            top: 0,
            width: 0,
            height: 0,
        },
        components: [],
    })
}

function createGroup() {
    // 获取选中区域的组件数据
    const areaData = getSelectArea()
    if (areaData.length <= 1) {
        hideArea()
        return
    }

    // 根据选中区域和区域中每个组件的位移信息来创建 Group 组件
    // 要遍历选择区域的每个组件，获取它们的 left top right bottom 信息来进行比较
    let top = Infinity, left = Infinity
    let right = -Infinity, bottom = -Infinity
    areaData.forEach(component => {
        let style = {}
        if (component.component == 'Group') {
            component.propValue.forEach(item => {
                const rectInfo = $(`#component${item.id}`).getBoundingClientRect()
                style.left = rectInfo.left - editorX.value
                style.top = rectInfo.top - editorY.value
                style.right = rectInfo.right - editorX.value
                style.bottom = rectInfo.bottom - editorY.value

                if (style.left < left) left = style.left
                if (style.top < top) top = style.top
                if (style.right > right) right = style.right
                if (style.bottom > bottom) bottom = style.bottom
            })
        } else {
            style = getComponentRotatedStyle(component.style)
        }

        if (style.left < left) left = style.left
        if (style.top < top) top = style.top
        if (style.right > right) right = style.right
        if (style.bottom > bottom) bottom = style.bottom
    })

    start.value.x = left
    start.value.y = top
    width.value = right - left
    height.value = bottom - top

    // 设置选中区域位移大小信息和区域内的组件数据
    store.setAreaData({
        style: {
            left,
            top,
            width: width.value,
            height: height.value,
        },
        components: areaData,
    })
}

function getSelectArea() {
    const result = []
    // 区域起点坐标
    const { x, y } = start.value
    // 计算所有的组件数据，判断是否在选中区域内
    componentData.value.forEach(component => {
        if (component.isLock) return

        const { left, top, width: compWidth, height: compHeight } = getComponentRotatedStyle(component.style)
        if (x <= left && y <= top && (left + compWidth <= x + width.value) && (top + compHeight <= y + height.value)) {
            result.push(component)
        }
    })

    // 返回在选中区域内的所有组件
    return result
}

function handleContextMenu(e) {
    e.stopPropagation()
    e.preventDefault()

    // 计算菜单相对于编辑器的位移
    let target = e.target
    let top = e.offsetY
    let left = e.offsetX
    while (target instanceof SVGElement) {
        target = target.parentNode
    }

    while (!target.className.includes('editor')) {
        left += target.offsetLeft
        top += target.offsetTop
        target = target.parentNode
    }

    store.showContextMenu({ top, left })
}

function getComponentStyle(style) {
    return getStyle(style, svgFilterAttrs)
}

function getSVGStyle(style) {
    return getSVGStyleUtils(style, svgFilterAttrs)
}

function handleInput(element, value) {
    // 根据文本组件高度调整 shape 高度
    store.setShapeStyle({ height: getTextareaHeight(element, value) })
}

function getTextareaHeight(element, text) {
    let { lineHeight, fontSize, height } = element.style
    if (lineHeight === '') {
        lineHeight = 1.5
    }

    const newHeight = (text.split('<br>').length - 1) * lineHeight * (fontSize || canvasStyleData.value.fontSize)
    return height > newHeight ? height : newHeight
}
</script>

<style lang="scss" scoped>
.editor {
    position: relative;
    background: var(--main-bg-color);
    margin: auto;

    .lock {
        opacity: .5;

        &:hover {
            cursor: not-allowed;
        }
    }
}

.edit {
    .component {
        outline: none;
        width: 100%;
        height: 100%;
    }
}
</style>
