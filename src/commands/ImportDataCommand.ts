import { BaseCommand } from './BaseCommand'
import { CommandType } from './types'
import type { ComponentData, CanvasStyleData } from '@/types'
import { useStore } from '@/store'

/**
 * 导入数据命令
 */
export class ImportDataCommand extends BaseCommand {
  type = CommandType.IMPORT_DATA
  description = '导入数据'
  mergeable = false

  private backupComponentData: ComponentData[] = []
  private backupCanvasStyle: CanvasStyleData | null = null

  constructor(
    private newComponentData: ComponentData[],
    private newCanvasStyle?: CanvasStyleData
  ) {
    super()
    this.data = {
      componentCount: newComponentData.length,
      hasCanvasStyle: Boolean(newCanvasStyle),
    }
  }

  execute(): void {
    const store = useStore()

    // 浅拷贝数组 + 样式浅拷贝，未变化对象保持共享
    this.backupComponentData = store.componentData.slice()
    this.backupCanvasStyle = { ...store.canvasStyleData }

    store.componentData = this.newComponentData.slice()
    if (this.newCanvasStyle) {
      store.canvasStyleData = { ...this.newCanvasStyle }
    }

    store.curComponent = null
    store.curComponentIndex = null
  }

  undo(): void {
    const store = useStore()
    store.componentData = this.backupComponentData.slice()
    if (this.backupCanvasStyle) {
      store.canvasStyleData = { ...this.backupCanvasStyle }
    }
  }
}
