import { BaseCommand } from './BaseCommand'
import { CommandType, type PositionData } from './types'
import type { ComponentStyle } from '@/types'
import { useStore } from '@/store'

/**
 * 移动组件命令
 */
export class MoveCommand extends BaseCommand {
  type = CommandType.MOVE_COMPONENT
  description = '移动组件'
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
      oldStyle: { top: oldStyle.top, left: oldStyle.left },
      newStyle: { top: newStyle.top, left: newStyle.left },
    }
    this.data = this.positionData as unknown as Record<string, unknown>
  }

  execute(): void {
    const store = useStore()
    const component = store.componentData.find(c => c.id === this.positionData.componentId)
    if (!component) return

    component.style.top = this.positionData.newStyle.top
    component.style.left = this.positionData.newStyle.left
  }

  undo(): void {
    const store = useStore()
    const component = store.componentData.find(c => c.id === this.positionData.componentId)
    if (!component) return

    component.style.top = this.positionData.oldStyle.top
    component.style.left = this.positionData.oldStyle.left
  }

  canMergeWith(other: import('./types').Command, _mergeTimeWindow: number): boolean {
    if (other.type !== CommandType.MOVE_COMPONENT) return false
    if (!(other instanceof MoveCommand)) return false

    return this.positionData.componentId === other.positionData.componentId
  }

  merge(other: import('./types').Command): MoveCommand {
    if (!(other instanceof MoveCommand)) return this

    return new MoveCommand(
      this.positionData.componentId,
      this.positionData.oldStyle,
      other.positionData.newStyle
    )
  }
}
