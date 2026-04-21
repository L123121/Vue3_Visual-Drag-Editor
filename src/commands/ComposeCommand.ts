import { BaseCommand } from './BaseCommand'
import { CommandType } from './types'
import type { ComponentData, ComponentStyle } from '@/types'
import { useStore } from '@/store'
import generateID from '@/utils/generateID'
import { createGroupStyle } from '@/utils/style'

/**
 * 组合命令
 */
export class ComposeCommand extends BaseCommand {
  type = CommandType.COMPOSE
  description = '组合组件'
  mergeable = false

  private groupComponent: ComponentData | null = null
  private originalComponents: ComponentData[] = []
  private originalIndices: number[] = []

  constructor(private componentIds: string[]) {
    super()
  }

  execute(): void {
    const store = useStore()

    // 收集要组合的组件
    this.originalComponents = []
    this.originalIndices = []

    const components: ComponentData[] = []
    this.componentIds.forEach(id => {
      const idx = store.componentData.findIndex(c => c.id === id)
      if (idx !== -1) {
        this.originalIndices.push(idx)
        const comp = store.componentData[idx]
        this.originalComponents.push(JSON.parse(JSON.stringify(comp)))
        components.push(comp)
      }
    })

    // 创建组合组件
    this.groupComponent = {
      id: generateID(),
      component: 'Group',
      label: '组合',
      icon: 'qunzu',
      style: { ...this.calculateGroupBounds(components) } as ComponentStyle,
      propValue: components,
      animations: [],
      events: {},
      groupStyle: {},
      isLock: false,
      collapseName: 'style',
      linkage: {
        duration: 0,
        data: [{ id: '', label: '', event: '', style: [{ key: '', value: '' }] }],
      },
    }

    createGroupStyle(this.groupComponent)

    // 删除原有组件，添加组合组件
    this.componentIds.forEach(id => {
      const idx = store.componentData.findIndex(c => c.id === id)
      if (idx !== -1) store.componentData.splice(idx, 1)
    })

    store.componentData.push(this.groupComponent)
    store.setCurComponent({ component: this.groupComponent, index: store.componentData.length - 1 })
  }

  undo(): void {
    const store = useStore()

    if (!this.groupComponent) return

    // 删除组合组件
    const groupIdx = store.componentData.findIndex(c => c.id === this.groupComponent!.id)
    if (groupIdx !== -1) {
      store.componentData.splice(groupIdx, 1)
    }

    // 恢复原有组件
    this.originalComponents.forEach((comp, i) => {
      const idx = this.originalIndices[i]
      store.componentData.splice(idx, 0, JSON.parse(JSON.stringify(comp)))
    })
  }

  private calculateGroupBounds(components: ComponentData[]): Partial<ComponentStyle> {
    let minTop = Infinity,
      minLeft = Infinity
    let maxBottom = -Infinity,
      maxRight = -Infinity

    components.forEach(comp => {
      const top = comp.style.top ?? 0
      const left = comp.style.left ?? 0
      minTop = Math.min(minTop, top)
      minLeft = Math.min(minLeft, left)
      maxBottom = Math.max(maxBottom, top + (comp.style.height ?? 0))
      maxRight = Math.max(maxRight, left + (comp.style.width ?? 0))
    })

    return {
      top: minTop,
      left: minLeft,
      width: maxRight - minLeft,
      height: maxBottom - minTop,
      rotate: 0,
      opacity: 1,
    }
  }
}
