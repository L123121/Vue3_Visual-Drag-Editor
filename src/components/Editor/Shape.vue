<template>
    <div
        ref="shapeRef"
        class="shape"
        :class="{ active }"
        @click="selectCurComponent"
        @mousedown="handleMouseDownOnShape"
    >
        <el-icon v-show="isActive()" class="icon-xiangyouxuanzhuan" @mousedown="handleRotate">
            <RefreshRight />
        </el-icon>
        <el-icon v-show="element.isLock" class="icon-suo">
            <Lock />
        </el-icon>
        <div
            v-for="item in (isActive()? getPointList() : [])"
            :key="item"
            class="shape-point"
            :style="getPointStyle(item)"
            @mousedown="handleMouseDownOnPoint(item, $event)"
        >
        </div>
        <slot></slot>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useStore } from '@/store'
import { storeToRefs } from 'pinia'
import { RefreshRight, Lock } from '@element-plus/icons-vue'
import eventBus from '@/utils/eventBus'
import runAnimation from '@/utils/runAnimation'
import calculateComponentPositonAndSize from '@/utils/calculateComponentPositonAndSize'
import { mod360 } from '@/utils/translate'
import { isPreventDrop } from '@/utils/utils'

const props = defineProps({
    active: {
        type: Boolean,
        default: false,
    },
    element: {
        required: true,
        type: Object,
        default: () => ({}),
    },
    defaultStyle: {
        required: true,
        type: Object,
        default: () => ({}),
    },
    index: {
        required: true,
        type: [Number, String],
        default: 0,
    },
})

const store = useStore()
const { curComponent, editor, showRight } = storeToRefs(store)

const shapeRef = ref(null)
const pointList = ['lt', 't', 'rt', 'r', 'rb', 'b', 'lb', 'l'] // 八个方向
const pointList2 = ['r', 'l'] // 左右两个方向
const initialAngle = { // 每个点对应的初始角度
    lt: 0,
    t: 45,
    rt: 90,
    r: 135,
    rb: 180,
    b: 225,
    lb: 270,
    l: 315,
}
const angleToCursor = [ // 每个范围的角度对应的光标
    { start: 338, end: 23, cursor: 'nw' },
    { start: 23, end: 68, cursor: 'n' },
    { start: 68, end: 113, cursor: 'ne' },
    { start: 113, end: 158, cursor: 'e' },
    { start: 158, end: 203, cursor: 'se' },
    { start: 203, end: 248, cursor: 's' },
    { start: 248, end: 293, cursor: 'sw' },
    { start: 293, end: 338, cursor: 'w' },
]
const cursors = ref({})

onMounted(() => {
    // 用于 Group 组件
    if (curComponent.value) {
        cursors.value = getCursor() // 根据旋转角度获取光标位置
    }
    eventBus.on('runAnimation', handleRunAnimation)
    eventBus.on('stopAnimation', handleStopAnimation)
})

onUnmounted(() => {
    eventBus.off('runAnimation', handleRunAnimation)
    eventBus.off('stopAnimation', handleStopAnimation)
})

function handleRunAnimation() {
    if (props.element === curComponent.value) {
        runAnimation(shapeRef.value, curComponent.value.animations)
    }
}

function handleStopAnimation() {
    shapeRef.value.classList.remove('animated', 'infinite')
}

function getPointList() {
    return props.element.component === 'line-shape' ? pointList2 : pointList
}

function isActive() {
    return props.active && !props.element.isLock
}

// 处理旋转
function handleRotate(e) {
    store.setClickComponentStatus(true)
    e.preventDefault()
    e.stopPropagation()
    // 初始坐标和初始角度
    const pos = { ...props.defaultStyle }
    const startY = e.clientY
    const startX = e.clientX
    const startRotate = pos.rotate

    // 获取元素中心点位置
    const rect = shapeRef.value.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // 旋转前的角度
    const rotateDegreeBefore = Math.atan2(startY - centerY, startX - centerX) / (Math.PI / 180)

    // 旋转期间禁止文字选中
    const preventSelect = (e) => e.preventDefault()
    document.addEventListener('selectstart', preventSelect)

    // 如果元素没有移动，则不保存快照
    let hasMove = false
    const move = (moveEvent) => {
        hasMove = true
        const curX = moveEvent.clientX
        const curY = moveEvent.clientY
        // 旋转后的角度
        const rotateDegreeAfter = Math.atan2(curY - centerY, curX - centerX) / (Math.PI / 180)
        // 获取旋转的角度值
        pos.rotate = startRotate + rotateDegreeAfter - rotateDegreeBefore
        // 修改当前组件样式
        store.setShapeStyle(pos)
    }

    const up = () => {
        hasMove && store.recordSnapshot()
        document.removeEventListener('mousemove', move)
        document.removeEventListener('mouseup', up)
        document.removeEventListener('selectstart', preventSelect)
        cursors.value = getCursor() // 根据旋转角度获取光标位置
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
}

function getPointStyle(point) {
    const { width, height } = props.defaultStyle
    const hasT = /t/.test(point)
    const hasB = /b/.test(point)
    const hasL = /l/.test(point)
    const hasR = /r/.test(point)
    let newLeft = 0
    let newTop = 0

    // 四个角的点
    if (point.length === 2) {
        newLeft = hasL ? 0 : width
        newTop = hasT ? 0 : height
    } else {
        // 上下两点的点，宽度居中
        if (hasT || hasB) {
            newLeft = width / 2
            newTop = hasT ? 0 : height
        }

        // 左右两边的点，高度居中
        if (hasL || hasR) {
            newLeft = hasL ? 0 : width
            newTop = Math.floor(height / 2)
        }
    }

    const style = {
        marginLeft: '-4px',
        marginTop: '-4px',
        left: `${newLeft}px`,
        top: `${newTop}px`,
        cursor: cursors.value[point],
    }

    return style
}

function getCursor() {
    // This logic relies on curComponent.style.rotate
    // But this component might not be the curComponent when mounted?
    // Wait, getCursor is called when mousedown or mounted.
    // In mounted, it checks `if (this.curComponent)`.
    
    // In original code: `const { angleToCursor, initialAngle, pointList, curComponent } = this`
    // It uses `curComponent.style.rotate`.
    // However, Shape component is rendered for ALL components.
    // If I am rotating component A, but Shape B calls getCursor?
    // Actually, `getCursor` is only used for `isActive()` components usually?
    // No, `cursors` is used in `getPointStyle`. `getPointStyle` is called in template `v-for="item in (isActive()? getPointList() : [])"`.
    // So only active component renders points and calls getPointStyle.
    // So `curComponent` should be `props.element` ideally, but since it is active, `props.element` === `curComponent`.
    
    // However, `curComponent` in store might be null if nothing selected.
    // But `isActive()` checks `props.active`.
    // If `props.active` is true, then `props.element` should be `curComponent` (or part of selection).
    
    const rotate = mod360(curComponent.value.style.rotate) // 取余 360
    const result = {}
    let lastMatchIndex = -1 // 从上一个命中的角度的索引开始匹配下一个，降低时间复杂度

    pointList.forEach(point => {
        const angle = mod360(initialAngle[point] + rotate)
        const len = angleToCursor.length
        // eslint-disable-next-line no-constant-condition
        while (true) {
            lastMatchIndex = (lastMatchIndex + 1) % len
            const angleLimit = angleToCursor[lastMatchIndex]
            if (angle < 23 || angle >= 338) {
                result[point] = 'nw-resize'

                return
            }

            if (angleLimit.start <= angle && angle < angleLimit.end) {
                result[point] = angleLimit.cursor + '-resize'

                return
            }
        }
    })

    return result
}

function handleMouseDownOnShape(e) {
    // 将当前点击组件的事件传播出去，目前的消费是 VText 组件 https://github.com/woai3c/visual-drag-demo/issues/90
    nextTick(() => eventBus.emit('componentClick'))

    store.setInEditorStatus(true)
    store.setClickComponentStatus(true)
    if (isPreventDrop(props.element.component)) {
        e.preventDefault()
    }

    e.stopPropagation()
    store.setCurComponent({ component: props.element, index: props.index })
    if (props.element.isLock) return

    cursors.value = getCursor() // 根据旋转角度获取光标位置

    const pos = { ...props.defaultStyle }
    const startY = e.clientY
    const startX = e.clientX
    // 如果直接修改属性，值的类型会变为字符串，所以要转为数值型
    const startTop = Number(pos.top)
    const startLeft = Number(pos.left)

    // 拖拽期间禁止文字选中
    const preventSelect = (e) => e.preventDefault()
    document.addEventListener('selectstart', preventSelect)

    // 如果元素没有移动，则不保存快照
    let hasMove = false
    const move = (moveEvent) => {
        hasMove = true
        const curX = moveEvent.clientX
        const curY = moveEvent.clientY
        pos.top = curY - startY + startTop
        pos.left = curX - startX + startLeft

        // 修改当前组件样式
        store.setShapeStyle(pos)
        // 等更新完当前组件的样式并绘制到屏幕后再判断是否需要吸附
        // 如果不使用 $nextTick，吸附后将无法移动
        nextTick(() => {
            // 触发元素移动事件，用于显示标线、吸附功能
            // 后面两个参数代表鼠标移动方向
            // curY - startY > 0 true 表示向下移动 false 表示向上移动
            // curX - startX > 0 true 表示向右移动 false 表示向左移动
            eventBus.emit('move', curY - startY > 0, curX - startX > 0)
        })
    }

    const up = () => {
        hasMove && store.recordSnapshot()
        // 触发元素停止移动事件，用于隐藏标线
        eventBus.emit('unmove')
        document.removeEventListener('mousemove', move)
        document.removeEventListener('mouseup', up)
        document.removeEventListener('selectstart', preventSelect)
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
}

function selectCurComponent(e) {
    // 阻止向父组件冒泡
    e.stopPropagation()
    e.preventDefault()
    store.hideContextMenu()
    // 打开右侧组件列表
    if (!store.rightList) {
        store.isShowRightList()
    }
}

function handleMouseDownOnPoint(point, e) {
    store.setInEditorStatus(true)
    store.setClickComponentStatus(true)
    e.stopPropagation()
    e.preventDefault()

    const style = { ...props.defaultStyle }

    // 组件宽高比
    const proportion = style.width / style.height

    // 组件中心点
    const center = {
        x: style.left + style.width / 2,
        y: style.top + style.height / 2,
    }

    // 获取画布位移信息
    // store.editor is DOM element
    const editorRectInfo = editor.value.getBoundingClientRect()

    // 获取 point 与实际拖动基准点的差值 @justJokee
    // fix https://github.com/woai3c/visual-drag-demo/issues/26#issue-937686285 
    const pointRect = e.target.getBoundingClientRect()
    // 当前点击圆点相对于画布的中心坐标
    const curPoint = {
        x: Math.round(pointRect.left - editorRectInfo.left + e.target.offsetWidth / 2),
        y: Math.round(pointRect.top - editorRectInfo.top + e.target.offsetHeight / 2),
    }

    // 获取对称点的坐标
    const symmetricPoint = {
        x: center.x - (curPoint.x - center.x),
        y: center.y - (curPoint.y - center.y),
    }

    // 是否需要保存快照
    let needSave = false
    let isFirst = true

    // 缩放期间禁止文字选中
    const preventSelect = (e) => e.preventDefault()
    document.addEventListener('selectstart', preventSelect)

    const needLockProportion = isNeedLockProportion()
    const move = (moveEvent) => {
        // 第一次点击时也会触发 move，所以会有“刚点击组件但未移动，组件的大小却改变了”的情况发生
        // 因此第一次点击时不触发 move 事件
        if (isFirst) {
            isFirst = false
            return
        }

        needSave = true
        const curPositon = {
            x: moveEvent.clientX - Math.round(editorRectInfo.left),
            y: moveEvent.clientY - Math.round(editorRectInfo.top),
        }

        calculateComponentPositonAndSize(point, style, curPositon, proportion, needLockProportion, {
            center,
            curPoint,
            symmetricPoint,
        })

        store.setShapeStyle(style)
    }

    const up = () => {
        document.removeEventListener('mousemove', move)
        document.removeEventListener('mouseup', up)
        document.removeEventListener('selectstart', preventSelect)
        needSave && store.recordSnapshot()
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
}

function isNeedLockProportion() {
    if (props.element.component != 'Group') return false
    const ratates = [0, 90, 180, 360]
    for (const component of props.element.propValue) {
        if (!ratates.includes(mod360(parseInt(component.style.rotate)))) {
            return true
        }
    }

    return false
}
</script>

<style lang="scss" scoped>
.shape {
    position: absolute;

    &:hover {
        cursor: move;
    }
}

.active {
    outline: 1px solid #70c0ff;
    user-select: none;
}

.shape-point {
    position: absolute;
    background: #fff;
    border: 1px solid #59c7f9;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    z-index: 1;
}

.icon-xiangyouxuanzhuan {
    position: absolute;
    top: -34px;
    left: 50%;
    transform: translateX(-50%);
    cursor: grab;
    color: #59c7f9;
    font-size: 20px;
    font-weight: 600;

    &:active {
        cursor: grabbing;
    }
}

.icon-suo {
    position: absolute;
    top: 0;
    right: 0;
}
</style>
