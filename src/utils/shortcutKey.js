import { useStore } from '@/store'
import eventBus from '@/utils/eventBus'

const ctrlKey = 17,
    commandKey = 91, // mac command
    vKey = 86, // 粘贴
    cKey = 67, // 复制
    xKey = 88, // 剪切

    yKey = 89, // 重做
    zKey = 90, // 撤销

    gKey = 71, // 组合
    bKey = 66, // 拆分

    lKey = 76, // 锁定
    uKey = 85, // 解锁

    sKey = 83, // 保存
    pKey = 80, // 预览
    dKey = 68, // 删除
    deleteKey = 46, // 删除
    eKey = 69 // 清空画布

export const keycodes = [66, 67, 68, 69, 71, 76, 80, 83, 85, 86, 88, 89, 90]

function copy() {
    const store = useStore()
    store.copy()
}

function paste() {
    const store = useStore()
    store.paste()
    store.recordSnapshot()
}

function cut() {
    const store = useStore()
    store.cut()
}

function redo() {
    const store = useStore()
    store.redo()
}

function undo() {
    const store = useStore()
    store.undo()
}

function compose() {
    const store = useStore()
    if (store.areaData.components.length) {
        store.compose()
        store.recordSnapshot()
    }
}

function decompose() {
    const store = useStore()
    const curComponent = store.curComponent
    if (curComponent && !curComponent.isLock && curComponent.component == 'Group') {
        store.decompose()
        store.recordSnapshot()
    }
}

function save() {
    eventBus.emit('save')
}

function preview() {
    eventBus.emit('preview')
}

function deleteComponent() {
    const store = useStore()
    if (store.curComponent) {
        store.deleteComponent()
        store.recordSnapshot()
    }
}

function clearCanvas() {
    eventBus.emit('clearCanvas')
}

function lock() {
    const store = useStore()
    store.lock()
}

function unlock() {
    const store = useStore()
    store.unlock()
}

// 与组件状态无关的操作
const basemap = {
    [vKey]: paste,
    [yKey]: redo,
    [zKey]: undo,
    [sKey]: save,
    [pKey]: preview,
    [eKey]: clearCanvas,
}

// 组件锁定状态下可以执行的操作
const lockMap = {
    ...basemap,
    [uKey]: unlock,
}

// 组件未锁定状态下可以执行的操作
const unlockMap = {
    ...basemap,
    [cKey]: copy,
    [xKey]: cut,
    [gKey]: compose,
    [bKey]: decompose,
    [dKey]: deleteComponent,
    [deleteKey]: deleteComponent,
    [lKey]: lock,
}

let isCtrlOrCommandDown = false

export function listenGlobalKeyDown() {
    const handleKeyDown = (e) => {
        const store = useStore()
        if (!store.isInEditor) return

        const { curComponent } = store
        const { keyCode } = e
        if (keyCode === ctrlKey || keyCode === commandKey) {
            isCtrlOrCommandDown = true
        } else if (keyCode == deleteKey && curComponent) {
            store.deleteComponent()
            store.recordSnapshot()
        } else if (isCtrlOrCommandDown) {
            if (unlockMap[keyCode] && (!curComponent || !curComponent.isLock)) {
                e.preventDefault()
                unlockMap[keyCode]()
            } else if (lockMap[keyCode] && curComponent && curComponent.isLock) {
                e.preventDefault()
                lockMap[keyCode]()
            }
        }
    }

    const handleKeyUp = (e) => {
        if (e.keyCode === ctrlKey || e.keyCode === commandKey) {
            isCtrlOrCommandDown = false
        }
    }

    const handleMouseDown = () => {
        const store = useStore()
        store.setInEditorStatus(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousedown', handleMouseDown)

    return () => {
        window.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('keyup', handleKeyUp)
        window.removeEventListener('mousedown', handleMouseDown)
    }
}
