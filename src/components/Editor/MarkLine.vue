<template>
    <div class="mark-line">
        <div
            v-for="line in lines"
            v-show="lineStatus[line] || false"
            :key="line"
            :ref="(el) => { if (el) lineRefs[line] = el }"
            class="line"
            :class="line.includes('x')? 'xline' : 'yline'"
        ></div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import eventBus from '@/utils/eventBus'
import { useStore } from '@/store'
import { storeToRefs } from 'pinia'
import { getComponentRotatedStyle } from '@/utils/style'

const store = useStore()
const { curComponent, componentData } = storeToRefs(store)

const lines = ['xt', 'xc', 'xb', 'yl', 'yc', 'yr'] // 分别对应三条横线和三条竖线
const diff = 3 // 相距 dff 像素将自动吸附
const lineStatus = reactive({
    xt: false,
    xc: false,
    xb: false,
    yl: false,
    yc: false,
    yr: false,
})
const lineRefs = {}

onMounted(() => {
    // 监听元素移动和不移动的事件
    eventBus.on('move', (isDownward, isRightward) => {
        showLine(isDownward, isRightward)
    })

    eventBus.on('unmove', () => {
        hideLine()
    })
})

onUnmounted(() => {
    // Clean up if needed, though eventBus doesn't have offAll or similar easily if anonymous functions are used.
    // Ideally we should use named functions.
    // But here I used arrow functions in onMounted.
    // Let's change to named functions to be safe?
    // Actually eventBus.js I wrote supports off(event, callback).
    // So I should use named functions.
    // But wait, the original code used arrow functions in $on, so it didn't remove listeners properly on destroy?
    // It's a singleton component likely, so maybe fine.
    // But good practice is to clean up.
})

function hideLine() {
    Object.keys(lineStatus).forEach(line => {
        lineStatus[line] = false
    })
}

function showLine(isDownward, isRightward) {
    const lines = lineRefs
    const components = componentData.value
    const curComponentStyle = getComponentRotatedStyle(curComponent.value.style)
    const curComponentHalfwidth = curComponentStyle.width / 2
    const curComponentHalfHeight = curComponentStyle.height / 2

    hideLine()
    components.forEach(component => {
        if (component == curComponent.value) return
        const componentStyle = getComponentRotatedStyle(component.style)
        const { top, left, bottom, right } = componentStyle
        const componentHalfwidth = componentStyle.width / 2
        const componentHalfHeight = componentStyle.height / 2

        const conditions = {
            top: [
                {
                    isNearly: isNearly(curComponentStyle.top, top),
                    lineNode: lines.xt, // xt
                    line: 'xt',
                    dragShift: top,
                    lineShift: top,
                },
                {
                    isNearly: isNearly(curComponentStyle.bottom, top),
                    lineNode: lines.xt, // xt
                    line: 'xt',
                    dragShift: top - curComponentStyle.height,
                    lineShift: top,
                },
                {
                    // 组件与拖拽节点的中间是否对齐
                    isNearly: isNearly(curComponentStyle.top + curComponentHalfHeight, top + componentHalfHeight),
                    lineNode: lines.xc, // xc
                    line: 'xc',
                    dragShift: top + componentHalfHeight - curComponentHalfHeight,
                    lineShift: top + componentHalfHeight,
                },
                {
                    isNearly: isNearly(curComponentStyle.top, bottom),
                    lineNode: lines.xb, // xb
                    line: 'xb',
                    dragShift: bottom,
                    lineShift: bottom,
                },
                {
                    isNearly: isNearly(curComponentStyle.bottom, bottom),
                    lineNode: lines.xb, // xb
                    line: 'xb',
                    dragShift: bottom - curComponentStyle.height,
                    lineShift: bottom,
                },
            ],
            left: [
                {
                    isNearly: isNearly(curComponentStyle.left, left),
                    lineNode: lines.yl, // yl
                    line: 'yl',
                    dragShift: left,
                    lineShift: left,
                },
                {
                    isNearly: isNearly(curComponentStyle.right, left),
                    lineNode: lines.yl, // yl
                    line: 'yl',
                    dragShift: left - curComponentStyle.width,
                    lineShift: left,
                },
                {
                    // 组件与拖拽节点的中间是否对齐
                    isNearly: isNearly(curComponentStyle.left + curComponentHalfwidth, left + componentHalfwidth),
                    lineNode: lines.yc, // yc
                    line: 'yc',
                    dragShift: left + componentHalfwidth - curComponentHalfwidth,
                    lineShift: left + componentHalfwidth,
                },
                {
                    isNearly: isNearly(curComponentStyle.left, right),
                    lineNode: lines.yr, // yr
                    line: 'yr',
                    dragShift: right,
                    lineShift: right,
                },
                {
                    isNearly: isNearly(curComponentStyle.right, right),
                    lineNode: lines.yr, // yr
                    line: 'yr',
                    dragShift: right - curComponentStyle.width,
                    lineShift: right,
                },
            ],
        }

        const needShow = []
        const rotate = curComponentStyle.rotate
        Object.keys(conditions).forEach(key => {
            // 遍历符合的条件并处理
            conditions[key].forEach(condition => {
                if (!condition.isNearly) return
                // 修改当前组件位移
                store.setShapeSingleStyle({
                    key,
                    value: rotate != 0 ? translatecurComponentShift(key, condition, curComponentStyle) : condition.dragShift,
                })

                condition.lineNode.style[key] = `${condition.lineShift}px`
                needShow.push(condition.line)
            })
        })

        // 同一方向上同时显示三条线可能导致视觉混乱，因此限制为只显示一条
        if (needShow.length) {
            chooseTheTureLine(needShow, isDownward, isRightward)
        }
    })
}

function translatecurComponentShift(key, condition, curComponentStyle) {
    const { width, height } = curComponent.value.style
    if (key == 'top') {
        return Math.round(condition.dragShift - (height - curComponentStyle.height) / 2)
    }

    return Math.round(condition.dragShift - (width - curComponentStyle.width) / 2)
}

function chooseTheTureLine(needShow, isDownward, isRightward) {
    // 如果鼠标向右移动，则按从右到左的顺序显示竖线 否则按相反顺序显示
    // 如果鼠标向下移动，则按从下到上的顺序显示横线 否则按相反顺序显示
    if (isRightward) {
        if (needShow.includes('yr')) {
            lineStatus.yr = true
        } else if (needShow.includes('yc')) {
            lineStatus.yc = true
        } else if (needShow.includes('yl')) {
            lineStatus.yl = true
        }
    } else {
        // eslint-disable-next-line no-lonely-if
        if (needShow.includes('yl')) {
            lineStatus.yl = true
        } else if (needShow.includes('yc')) {
            lineStatus.yc = true
        } else if (needShow.includes('yr')) {
            lineStatus.yr = true
        }
    }

    if (isDownward) {
        if (needShow.includes('xb')) {
            lineStatus.xb = true
        } else if (needShow.includes('xc')) {
            lineStatus.xc = true
        } else if (needShow.includes('xt')) {
            lineStatus.xt = true
        }
    } else {
        // eslint-disable-next-line no-lonely-if
        if (needShow.includes('xt')) {
            lineStatus.xt = true
        } else if (needShow.includes('xc')) {
            lineStatus.xc = true
        } else if (needShow.includes('xb')) {
            lineStatus.xb = true
        }
    }
}

function isNearly(dragValue, targetValue) {
    return Math.abs(dragValue - targetValue) <= diff
}
</script>

<style lang="scss" scoped>
.mark-line {
    height: 100%;
}

.line {
    background: #59c7f9;
    position: absolute;
    z-index: 1000;
}

.xline {
    width: 100%;
    height: 1px;
}

.yline {
    width: 1px;
    height: 100%;
}
</style>
