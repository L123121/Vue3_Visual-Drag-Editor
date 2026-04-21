import { BaseCommand } from './BaseCommand'
import { CommandType } from './types'
import type { ComponentData } from '@/types'
import { useStore } from '@/store'
import decomposeComponent from '@/utils/decomposeComponent'

/**
 * 拆分命令
 */
export class DecomposeCommand extends BaseCommand {
  type = CommandType.DECOMPOSE
  description = '拆分组合'
  mergeable = false

  private groupComponent: ComponentData | null = null
  private groupIndex: number = -1
  private subComponents: ComponentData[] = []

  constructor(private groupId: string) {
    super()
  }

  execute(): void {
    const store = useStore()
    const groupIdx = store.componentData.findIndex(c => c.id === this.groupId)

    if (groupIdx === -1) return

    this.groupIndex = groupIdx
    this.groupComponent = JSON.parse(JSON.stringify(store.componentData[groupIdx]))

    const parentStyle = { ...this.groupComponent.style }
    const components = this.groupComponent.propValue as ComponentData[]
    const editorRect = store.editor!.getBoundingClientRect()

    this.subComponents = []
    components.forEach(component => {
      const newComp = JSON.parse(JSON.stringify(component))
      decomposeComponent(newComp, editorRect, parentStyle)
      this.subComponents.push(newComp)
      store.componentData.push(newComp)
    })

    store.componentData.splice(groupIdx, 1)
  }

  undo(): void {
    const store = useStore()

    // 删除拆分出来的组件
    this.subComponents.forEach(comp => {
      const idx = store.componentData.findIndex(c => c.id === comp.id)
      if (idx !== -1) store.componentData.splice(idx, 1)
    })

    // 恢复组合组件
    if (this.groupComponent) {
      store.componentData.splice(this.groupIndex, 0, JSON.parse(JSON.stringify(this.groupComponent)))
    }
  }
}
