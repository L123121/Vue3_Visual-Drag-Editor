import { BaseCommand } from './BaseCommand'
import { CommandType } from './types'
import type { ComponentData } from '@/types'
import { useStore } from '@/store'

/**
 * 新增组件命令
 */
export class AddComponentCommand extends BaseCommand {
  type = CommandType.ADD_COMPONENT
  description = '添加组件'
  mergeable = false

  constructor(
    private component: ComponentData,
    private index?: number
  ) {
    super()
  }

  execute(): void {
    const store = useStore()
    if (this.index !== undefined) {
      store.componentData.splice(this.index, 0, this.component)
    } else {
      store.componentData.push(this.component)
    }
  }

  undo(): void {
    const store = useStore()
    const idx = store.componentData.findIndex(c => c.id === this.component.id)
    if (idx !== -1) {
      store.componentData.splice(idx, 1)
      // 恢复当前组件状态
      if (store.curComponent?.id === this.component.id) {
        store.curComponent = null
        store.curComponentIndex = null
      }
    }
  }
}
