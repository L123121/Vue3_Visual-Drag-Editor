import { BaseCommand } from './BaseCommand'
import { CommandType } from './types'
import type { ComponentData } from '@/types'
import { useStore } from '@/store'

/**
 * 清空画布命令
 */
export class ClearCanvasCommand extends BaseCommand {
  type = CommandType.CLEAR_CANVAS
  description = '清空画布'
  mergeable = false

  private backupData: ComponentData[] = []

  execute(): void {
    const store = useStore()
    // 浅拷贝数组，复用未变化的组件对象，减少内存开销
    this.backupData = store.componentData.slice()
    this.data = {
      count: this.backupData.length,
    }

    store.componentData = []
    store.curComponent = null
    store.curComponentIndex = null
  }

  undo(): void {
    const store = useStore()
    store.componentData = this.backupData.slice()
  }
}
