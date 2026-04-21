import { BaseCommand } from './BaseCommand'
import { CommandType, type PositionData } from './types'
import type { ComponentStyle } from '@/types'
import { useStore } from '@/store'

/**
 * 缩放组件命令
 */
export class ResizeCommand extends BaseCommand {
  type = CommandType.RESIZE_COMPONENT
  description = '缩放组件'
  mergeable = true

  private positionData: PositionData

  constructor(
    componentId: string,
    oldStyle: Partial<ComponentStyle>,
    newStyle: Partial<ComponentStyle>
  ) {
    super()
    this.positionData = {
      componentId,
      oldStyle: {
        width: oldStyle.width,
        height: oldStyle.height,
        top: oldStyle.top,
        left: oldStyle.left,
      },
      newStyle: {
        width: newStyle.width,
        height: newStyle.height,
        top: newStyle.top,
        left: newStyle.left,
      },
    }
    this.data = this.positionData as unknown as Record<string, unknown>
  }

  execute(): void {
    const store = useStore()
    const component = store.componentData.find(c => c.id === this.positionData.componentId)
    if (!component) return

    Object.assign(component.style, this.positionData.newStyle)
  }

  undo(): void {
    const store = useStore()
    const component = store.componentData.find(c => c.id === this.positionData.componentId)
    if (!component) return

    Object.assign(component.style, this.positionData.oldStyle)
  }

  canMergeWith(other: import('./types').Command, _mergeTimeWindow: number): boolean {
    if (other.type !== CommandType.RESIZE_COMPONENT) return false
    if (!(other instanceof ResizeCommand)) return false

    return this.positionData.componentId === other.positionData.componentId
  }

  merge(other: import('./types').Command): ResizeCommand {
    if (!(other instanceof ResizeCommand)) return this

    return new ResizeCommand(
      this.positionData.componentId,
      this.positionData.oldStyle,
      other.positionData.newStyle
    )
  }
}
