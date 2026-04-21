import { BaseCommand } from './BaseCommand'
import { CommandType } from './types'
import type { ComponentData } from '@/types'
import { useStore } from '@/store'

/**
 * 删除组件命令
 */
export class DeleteComponentCommand extends BaseCommand {
  type = CommandType.DELETE_COMPONENT
  description = '删除组件'
  mergeable = false

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
    const idx = this.index ?? store.componentData.findIndex(c => c.id === this.componentId)
    if (idx < 0 || idx >= store.componentData.length) return

    this.deletedIndex = idx
    this.deletedComponent = store.componentData[idx]
    store.componentData.splice(idx, 1)

    if (store.curComponent?.id === this.componentId) {
      store.curComponent = null
      store.curComponentIndex = null
    } else if (store.curComponentIndex !== null && store.curComponentIndex > idx) {
      store.curComponentIndex -= 1
    }
  }

  undo(): void {
    const store = useStore()
    if (!this.deletedComponent || this.deletedIndex < 0) return

    store.componentData.splice(this.deletedIndex, 0, this.deletedComponent)
  }
}
