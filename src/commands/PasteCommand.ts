import { BaseCommand } from './BaseCommand'
import { CommandType } from './types'
import type { ComponentData } from '@/types'
import { useStore } from '@/store'
import generateID from '@/utils/generateID'

function cloneComponent(component: ComponentData): ComponentData {
  return structuredClone(component)
}

/**
 * 粘贴命令
 */
export class PasteCommand extends BaseCommand {
  type = CommandType.PASTE
  description = '粘贴组件'
  mergeable = false

  private pastedComponent: ComponentData | null = null
  private pastedIndex = -1

  constructor(
    private sourceComponent: ComponentData,
    private isMouse?: boolean,
    private menuTop?: number,
    private menuLeft?: number
  ) {
    super()
    this.data = {
      componentId: sourceComponent.id,
      isMouse,
      menuTop,
      menuLeft,
    }
  }

  private buildPastedComponent(): ComponentData {
    const component = cloneComponent(this.sourceComponent)
    component.id = generateID()

    if (this.isMouse && this.menuTop !== undefined && this.menuLeft !== undefined) {
      component.style.top = this.menuTop
      component.style.left = this.menuLeft
    } else {
      component.style.top = (component.style.top ?? 0) + 10
      component.style.left = (component.style.left ?? 0) + 10
    }

    if (component.component === 'Group') {
      ;(component.propValue as ComponentData[]).forEach(comp => {
        comp.id = generateID()
      })
    }

    return component
  }

  execute(): void {
    const store = useStore()

    // 首次执行生成实体，重做时复用同一对象，保证结构共享与结果稳定
    if (!this.pastedComponent) {
      this.pastedComponent = this.buildPastedComponent()
    }

    store.componentData.push(this.pastedComponent)
    this.pastedIndex = store.componentData.length - 1
  }

  undo(): void {
    const store = useStore()
    if (!this.pastedComponent) return

    const idx = store.componentData.findIndex(c => c.id === this.pastedComponent!.id)
    if (idx !== -1) {
      store.componentData.splice(idx, 1)
    }
  }
}
