import { BaseCommand } from './BaseCommand'
import { CommandType } from './types'
import type { ComponentData, CopyData } from '@/types'
import { useStore } from '@/store'

function cloneComponent(component: ComponentData): ComponentData {
  return structuredClone(component)
}

function cloneCopyData(copyData: CopyData): CopyData {
  return {
    data: cloneComponent(copyData.data),
    index: copyData.index,
    isCut: copyData.isCut,
  }
}

/**
 * 剪切命令（复合操作）：
 * 1. 若存在上一次未粘贴的剪切数据，则先还原
 * 2. 删除当前目标组件并写入新的剪贴板数据
 */
export class CutCommand extends BaseCommand {
  type = CommandType.CUT_COMPONENT
  description = '剪切组件'
  mergeable = false

  private previousCopyData: CopyData | null = null
  private restoredPreviousCut = false
  private restoredComponentId: string | null = null

  private deletedComponent: ComponentData | null = null
  private deletedIndex = -1

  constructor(
    private componentId: string,
    private index?: number
  ) {
    super()
    this.data = {
      componentId,
      index,
    }
  }

  execute(): void {
    const store = useStore()

    this.previousCopyData = store.copyData ? cloneCopyData(store.copyData) : null
    this.restoredPreviousCut = false
    this.restoredComponentId = null
    this.deletedComponent = null
    this.deletedIndex = -1

    let targetIndex = this.index ?? store.componentData.findIndex(c => c.id === this.componentId)
    if (targetIndex < 0 || targetIndex >= store.componentData.length) return

    const previousCut = store.copyData?.isCut ? cloneCopyData(store.copyData) : null
    if (previousCut) {
      store.componentData.splice(previousCut.index, 0, previousCut.data)
      this.restoredPreviousCut = true
      this.restoredComponentId = previousCut.data.id

      if (targetIndex >= previousCut.index) {
        targetIndex += 1
      }
    }

    const target = store.componentData[targetIndex]
    if (!target) return

    this.deletedComponent = target
    this.deletedIndex = targetIndex
    store.componentData.splice(targetIndex, 1)

    if (store.curComponent?.id === target.id) {
      store.curComponent = null
      store.curComponentIndex = null
    } else if (store.curComponentIndex !== null && store.curComponentIndex > targetIndex) {
      store.curComponentIndex -= 1
    }

    store.copyData = {
      data: cloneComponent(target),
      index: targetIndex,
      isCut: true,
    }
  }

  undo(): void {
    const store = useStore()
    if (!this.deletedComponent || this.deletedIndex === -1) return

    store.componentData.splice(this.deletedIndex, 0, this.deletedComponent)

    if (this.restoredPreviousCut && this.restoredComponentId) {
      const restoredIdx = store.componentData.findIndex(c => c.id === this.restoredComponentId)
      if (restoredIdx !== -1) {
        store.componentData.splice(restoredIdx, 1)
      }
    }

    store.copyData = this.previousCopyData ? cloneCopyData(this.previousCopyData) : null
  }
}
