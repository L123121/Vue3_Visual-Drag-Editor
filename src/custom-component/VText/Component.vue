<!-- eslint-disable vue/no-v-html -->
<template>
    <div
        v-if="editMode == 'edit'"
        class="v-text"
        @keydown="handleKeydown"
        @keyup="handleKeyup"
    >
        <!-- tabindex >= 0 使得双击时聚焦该元素 -->
        <div
            ref="text"
            :contenteditable="canEdit"
            :class="{ 'can-edit': canEdit }"
            tabindex="0"
            :style="{ verticalAlign: element.style.verticalAlign, padding:element.style.padding + 'px' }"
            @dblclick="setEdit"
            @paste="clearStyle"
            @mousedown="handleMousedown"
            @blur="handleBlur"
            @input="handleInput"
            v-html="element.propValue"
        ></div>
    </div>
    <div v-else class="v-text preview">
        <div :style="{ verticalAlign: element.style.verticalAlign, padding:element.style.padding + 'px' }" v-html="element.propValue"></div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useStore } from '@/store'
import { storeToRefs } from 'pinia'
import { keycodes } from '@/utils/shortcutKey.js'
import request from '@/utils/request'
import eventBus from '@/utils/eventBus'
import { useOnEvent } from '../common/useOnEvent'

const props = defineProps({
    propValue: {
        type: String,
        required: true,
        default: '',
    },
    request: {
        type: Object,
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

const emit = defineEmits(['input'])

const store = useStore()
const { editMode, curComponent } = storeToRefs(store)

const text = ref(null)
const canEdit = ref(false)
const ctrlKey = 17
const isCtrlDown = ref(false)
let cancelRequest = null

useOnEvent(props, text)

onMounted(() => {
    // 注意，修改时接口属性时不会发数据，在预览时才会发
    // 如果要在修改接口属性的同时发请求，需要 watch 一下 request 的属性
    if (props.request) {
        // 第二个参数是要修改数据的父对象，第三个参数是修改数据的 key，第四个数据修改数据的类型
        cancelRequest = request(props.request, props.element, 'propValue', 'string')
    }

    eventBus.on('componentClick', onComponentClick)
})

onBeforeUnmount(() => {
    // 组件销毁时取消请求
    if (props.request && cancelRequest) {
        cancelRequest()
    }
    eventBus.off('componentClick', onComponentClick)
})

function onComponentClick() {
    // 如果当前点击的组件 id 和 VText 不是同一个，需要设为不允许编辑 https://github.com/woai3c/visual-drag-demo/issues/90
    if (curComponent.value.id !== props.element.id) {
        canEdit.value = false
    }
}

function handleInput(e) {
    emit('input', props.element, e.target.innerHTML)
}

function handleKeydown(e) {
    // 阻止冒泡，防止触发复制、粘贴组件操作
    if (canEdit.value) {
        e.stopPropagation()
    }
    if (e.keyCode == ctrlKey) {
        isCtrlDown.value = true
    } else if (isCtrlDown.value && canEdit.value && keycodes.includes(e.keyCode)) {
        e.stopPropagation()
    } else if (e.keyCode == 46) { // deleteKey
        e.stopPropagation()
    }
}

function handleKeyup(e) {
    // 阻止冒泡，防止触发复制、粘贴组件操作
    if (canEdit.value) {
        e.stopPropagation()
    }
    if (e.keyCode == ctrlKey) {
        isCtrlDown.value = false
    }
}

function handleMousedown(e) {
    if (canEdit.value) {
        e.stopPropagation()
    }
}

function clearStyle(e) {
    e.preventDefault()
    const clp = e.clipboardData
    const textData = clp.getData('text/plain') || ''
    if (textData !== '') {
        document.execCommand('insertText', false, textData)
    }

    emit('input', props.element, e.target.innerHTML)
}

function handleBlur(e) {
    props.element.propValue = e.target.innerHTML || '&nbsp;'
    const html = e.target.innerHTML
    if (html !== '') {
        props.element.propValue = e.target.innerHTML
    } else {
        props.element.propValue = ''
        nextTick(() => {
            props.element.propValue = '&nbsp;'
        })
    }
    canEdit.value = false
}

function setEdit() {
    if (props.element.isLock) return

    canEdit.value = true
    // 全选
    selectText(text.value)
}

function selectText(element) {
    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(element)
    selection.removeAllRanges()
    selection.addRange(range)
}
</script>

<style lang="scss" scoped>
.v-text {
    width: 100%;
    height: 100%;
    display: table;

    div {
        display: table-cell;
        width: 100%;
        height: 100%;
        outline: none;
        word-break: break-all;
        padding: 4px;
    }

    .can-edit {
        cursor: text;
        height: 100%;
    }
}

.preview {
    user-select: none;
}
</style>
