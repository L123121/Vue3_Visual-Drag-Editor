import { BaseCommand } from './BaseCommand'
import { CommandType } from './types'
import { useStore } from '@/store'

/**
 * 旋转组件命令
 */
export class RotateCommand extends BaseCommand {
  type = CommandType.ROTATE_COMPONENT
  description = '旋转组件'
  mergeable = true

  constructor(
    private componentId: string,
    private oldRotate: number,
    private newRotate: number
  ) {
    super()
    this.data = {
      componentId,
      oldRotate,
      newRotate,
    }
  }

  execute(): void {
    const store = useStore()
    const component = store.componentData.find(c => c.id === this.componentId)
    if (!component) return

    component.style.rotate = this.newRotate
  }

  undo(): void {
    const store = useStore()
    const component = store.componentData.find(c => c.id === this.componentId)
    if (!component) return

    component.style.rotate = this.oldRotate
  }

  canMergeWith(other: import('./types').Command, _mergeTimeWindow: number): boolean {
    if (other.type !== CommandType.ROTATE_COMPONENT) return false
    if (!(other instanceof RotateCommand)) return false

    return this.componentId === other.componentId
  }

  merge(other: import('./types').Command): RotateCommand {
    if (!(other instanceof RotateCommand)) return this

    return new RotateCommand(this.componentId, this.oldRotate, other.newRotate)
  }
}
