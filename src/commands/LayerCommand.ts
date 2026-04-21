import { BaseCommand } from './BaseCommand'
import { CommandType } from './types'
import { useStore } from '@/store'
import { swap } from '@/utils/utils'

/**
 * 图层操作类型
 */
type LayerAction = 'up' | 'down' | 'top' | 'bottom'

/**
 * 图层操作命令
 */
export class LayerCommand extends BaseCommand {
  type = CommandType.LAYER_UP
  description = '图层操作'
  mergeable = false

  private oldIndex: number = -1
  private newIndex: number = -1

  constructor(
    private componentId: string,
    private action: LayerAction
  ) {
    super()
    this.type = this.getTypeFromAction(action)
    this.description = this.getDescriptionFromAction(action)
  }

  private getTypeFromAction(action: LayerAction): CommandType {
    const map: Record<LayerAction, CommandType> = {
      up: CommandType.LAYER_UP,
      down: CommandType.LAYER_DOWN,
      top: CommandType.LAYER_TOP,
      bottom: CommandType.LAYER_BOTTOM,
    }
    return map[action]
  }

  private getDescriptionFromAction(action: LayerAction): string {
    const map: Record<LayerAction, string> = {
      up: '上移图层',
      down: '下移图层',
      top: '置顶图层',
      bottom: '置底图层',
    }
    return map[action]
  }

  execute(): void {
    const store = useStore()
    const currentIndex = store.componentData.findIndex(c => c.id === this.componentId)

    if (currentIndex === -1) return
    this.oldIndex = currentIndex

    switch (this.action) {
      case 'up':
        if (currentIndex < store.componentData.length - 1) {
          this.newIndex = currentIndex + 1
          swap(store.componentData, currentIndex, this.newIndex)
          this.updateCurComponentIndex(store, this.newIndex)
        }
        break
      case 'down':
        if (currentIndex > 0) {
          this.newIndex = currentIndex - 1
          swap(store.componentData, currentIndex, this.newIndex)
          this.updateCurComponentIndex(store, this.newIndex)
        }
        break
      case 'top':
        if (currentIndex < store.componentData.length - 1) {
          this.newIndex = store.componentData.length - 1
          swap(store.componentData, currentIndex, this.newIndex)
          this.updateCurComponentIndex(store, this.newIndex)
        }
        break
      case 'bottom':
        if (currentIndex > 0) {
          this.newIndex = 0
          swap(store.componentData, currentIndex, this.newIndex)
          this.updateCurComponentIndex(store, this.newIndex)
        }
        break
    }
  }

  undo(): void {
    const store = useStore()
    if (this.oldIndex !== -1 && this.newIndex !== -1) {
      // 反向交换
      swap(store.componentData, this.newIndex, this.oldIndex)
      this.updateCurComponentIndex(store, this.oldIndex)
    }
  }

  private updateCurComponentIndex(store: ReturnType<typeof useStore>, index: number): void {
    if (store.curComponent?.id === this.componentId) {
      store.curComponentIndex = index
    }
  }
}
