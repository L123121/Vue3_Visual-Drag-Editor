import { useStore } from '@/store'
import eventBus from '@/utils/eventBus'

// 键盘按键码
const ctrlKey = 17
const commandKey = 91 // mac command
const vKey = 86 // 粘贴
const cKey = 67 // 复制
const xKey = 88 // 剪切
const yKey = 89 // 重做
const zKey = 90 // 撤销
const gKey = 71 // 组合
const bKey = 66 // 拆分
const lKey = 76 // 锁定
const uKey = 85 // 解锁
const sKey = 83 // 保存
const pKey = 80 // 预览
const dKey = 68 // 删除
const deleteKey = 46 // 删除
const eKey = 69 // 清空画布

export const keycodes = [66, 67, 68, 69, 71, 76, 80, 83, 85, 86, 88, 89, 90]

// 操作函数
function copy(): void {
  const store = useStore()
  store.copy()
}

function paste(): void {
  const store = useStore()
  store.pasteWithCommand()
}

function cut(): void {
  const store = useStore()
  store.cutWithCommand()
}

function redo(): void {
  const store = useStore()
  store.redo()
}

function undo(): void {
  const store = useStore()
  store.undo()
}

function compose(): void {
  const store = useStore()
  if (store.areaData.components.length) {
    store.composeWithCommand()
  }
}

function decompose(): void {
  const store = useStore()
  const curComponent = store.curComponent
  if (curComponent && !curComponent.isLock && curComponent.component === 'Group') {
    store.decomposeWithCommand()
  }
}

function save(): void {
  eventBus.emit('save')
}

function preview(): void {
  eventBus.emit('preview')
}

function deleteComponent(): void {
  const store = useStore()
  if (store.curComponent) {
    store.deleteComponentWithCommand()
  }
}

function clearCanvas(): void {
  eventBus.emit('clearCanvas')
}

function lock(): void {
  const store = useStore()
  store.lock()
}

function unlock(): void {
  const store = useStore()
  store.unlock()
}

// 快捷键映射类型
type KeyMap = Record<number, () => void>

// 与组件状态无关的操作
const basemap: KeyMap = {
  [vKey]: paste,
  [yKey]: redo,
  [zKey]: undo,
  [sKey]: save,
  [pKey]: preview,
  [eKey]: clearCanvas,
}

// 组件锁定状态下可以执行的操作
const lockMap: KeyMap = {
  ...basemap,
  [uKey]: unlock,
}

// 组件未锁定状态下可以执行的操作
const unlockMap: KeyMap = {
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

/**
 * 监听全局键盘事件
 * @returns 清理函数
 */
export function listenGlobalKeyDown(): () => void {
  const handleKeyDown = (e: KeyboardEvent): void => {
    const store = useStore()
    if (!store.isInEditor) return

    const { curComponent } = store
    const { keyCode } = e

    if (keyCode === ctrlKey || keyCode === commandKey) {
      isCtrlOrCommandDown = true
    } else if (keyCode === deleteKey && curComponent) {
      store.deleteComponentWithCommand()
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

  const handleKeyUp = (e: KeyboardEvent): void => {
    if (e.keyCode === ctrlKey || e.keyCode === commandKey) {
      isCtrlOrCommandDown = false
    }
  }

  const handleMouseDown = (): void => {
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

