import { defineStore } from 'pinia'
import type {
  StoreState,
  ComponentData,
  CanvasStyleData,
  AreaData,
  CopyData,
  SetCurComponentPayload,
  SetShapeStylePayload,
  AddComponentPayload,
  AddEventPayload,
  AlterAnimationPayload,
  ShowContextMenuPayload,
  ComponentStyle,
  PageVersion,
} from '@/types'
import { deepCopy, swap, $ } from '@/utils/utils'
import eventBus from '@/utils/eventBus'
import animationClassData from '@/utils/animationClassData'
import { ElMessage } from 'element-plus'
import generateID from '@/utils/generateID'
import decomposeComponent from '@/utils/decomposeComponent'
import { createGroupStyle } from '@/utils/style'
import { CommandManager } from '@/commands/CommandManager'
import {
  MoveCommand,
  ResizeCommand,
  RotateCommand,
  AddComponentCommand,
  DeleteComponentCommand,
  LayerCommand,
  ComposeCommand,
  DecomposeCommand,
  PasteCommand,
  ClearCanvasCommand,
  ImportDataCommand,
  CutCommand,
} from '@/commands'
import type { Command } from '@/commands'

// 命令管理器实例
const commandManager = new CommandManager({ mergeTimeWindow: 300 })

export const useStore = defineStore('main', {
  state: (): StoreState => ({
    editMode: 'edit',
    canvasStyleData: {
      width: 1200,
      height: 740,
      scale: 100,
      color: '#000',
      opacity: 1,
      backgroundColor: '#fff',
      fontSize: 14,
    },
    componentData: [],
    curComponent: null,
    curComponentIndex: null,
    isClickComponent: false,
    editor: null,
    menuTop: 0,
    menuLeft: 0,
    menuShow: false,
    copyData: null,
    isDarkMode: false,
    rightList: true,
    isInEditor: false,
    areaData: {
      style: {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
      },
      components: [],
    },
    versions: [],
  }),

  actions: {
    setClickComponentStatus(status: boolean): void {
      this.isClickComponent = status
    },

    setEditor(el: HTMLElement): void {
      this.editor = el
    },

    getEditor(): void {
      this.editor = $('#editor')
    },

    setAreaData(data: AreaData): void {
      this.areaData = data
    },

    setCanvasStyle(style: CanvasStyleData): void {
      this.canvasStyleData = style
    },

    setCurComponent({ component, index }: SetCurComponentPayload): void {
      this.curComponent = component
      this.curComponentIndex = index
    },

    setShapeStyle({ top, left, width, height, rotate }: SetShapeStylePayload): void {
      if (!this.curComponent) return

      if (top !== undefined) this.curComponent.style.top = Math.round(top)
      if (left !== undefined) this.curComponent.style.left = Math.round(left)
      if (width !== undefined) this.curComponent.style.width = Math.round(width)
      if (height !== undefined) this.curComponent.style.height = Math.round(height)
      if (rotate !== undefined) this.curComponent.style.rotate = Math.round(rotate)
    },

    setShapeSingleStyle({ key, value }: { key: string; value: unknown }): void {
      if (this.curComponent) {
        (this.curComponent.style as Record<string, unknown>)[key] = value
      }
    },

    setComponentData(componentData: ComponentData[] = []): void {
      this.componentData = componentData
    },

    addComponent({ component, index }: AddComponentPayload): void {
      if (index !== undefined) {
        this.componentData.splice(index, 0, component)
      } else {
        this.componentData.push(component)
      }
    },

    deleteComponent(index?: number): void {
      if (index === undefined) {
        index = this.curComponentIndex ?? undefined
      }

      if (index === undefined) return

      if (index === this.curComponentIndex) {
        this.curComponentIndex = null
        this.curComponent = null
      }

      if (typeof index === 'number' && index >= 0) {
        this.componentData.splice(index, 1)
      }
    },

    isShowRightList(): void {
      this.rightList = !this.rightList
    },

    updateComponentProps(data: Partial<ComponentData>): void {
      if (this.curComponent) {
        Object.assign(this.curComponent, data)
      }
    },

    upComponent(): void {
      // 上移图层 index，往后移
      if (this.curComponentIndex !== null && this.curComponentIndex < this.componentData.length - 1) {
        swap(this.componentData, this.curComponentIndex, this.curComponentIndex + 1)
        this.curComponentIndex = this.curComponentIndex + 1
      } else {
        ElMessage.warning('已经到顶了')
      }
    },

    downComponent(): void {
      // 下移图层 index，往前移
      if (this.curComponentIndex !== null && this.curComponentIndex > 0) {
        swap(this.componentData, this.curComponentIndex, this.curComponentIndex - 1)
        this.curComponentIndex = this.curComponentIndex - 1
      } else {
        ElMessage.warning('已经到底了')
      }
    },

    topComponent(): void {
      // 置顶
      if (this.curComponentIndex !== null && this.curComponentIndex < this.componentData.length - 1) {
        swap(this.componentData, this.curComponentIndex, this.componentData.length - 1)
        this.curComponentIndex = this.componentData.length - 1
      } else {
        ElMessage.warning('已经到顶了')
      }
    },

    bottomComponent(): void {
      // 置底
      if (this.curComponentIndex !== null && this.curComponentIndex > 0) {
        swap(this.componentData, this.curComponentIndex, 0)
        this.curComponentIndex = 0
      } else {
        ElMessage.warning('已经到底了')
      }
    },

    addAnimation(animation: { type: string }): void {
      if (this.curComponent) {
        this.curComponent.animations.push({
          ...animation,
          duration: 1000,
          delay: 0,
          interationNum: 1,
          infinite: false,
          applyTo: 'enter',
        })
      }
    },

    removeAnimation(index: number): void {
      if (this.curComponent) {
        this.curComponent.animations.splice(index, 1)
      }
    },

    addEvent({ event, param }: AddEventPayload): void {
      if (this.curComponent) {
        this.curComponent.events[event] = param
      }
    },

    removeEvent(event: string): void {
      if (this.curComponent) {
        delete this.curComponent.events[event]
      }
    },

    alterAnimation({ index, data = {} }: AlterAnimationPayload): void {
      if (this.curComponent && typeof index === 'number') {
        const original = this.curComponent.animations[index]
        if (original) {
          this.curComponent.animations[index] = { ...original, ...data }
        }
      }
    },

    setEditMode(mode: 'edit' | 'preview'): void {
      this.editMode = mode
    },

    setInEditorStatus(status: boolean): void {
      this.isInEditor = status
    },

    // ==================== 命令模式撤销重做 ====================

    /**
     * 执行命令
     */
    executeCommand(command: Command): void {
      commandManager.execute(command)
    },

    /**
     * 撤销
     */
    undo(): void {
      commandManager.undo()
      this.refreshCurComponent()
    },

    /**
     * 重做
     */
    redo(): void {
      commandManager.redo()
      this.refreshCurComponent()
    },

    /**
     * 是否可以撤销
     */
    canUndo(): boolean {
      return commandManager.canUndo()
    },

    /**
     * 是否可以重做
     */
    canRedo(): boolean {
      return commandManager.canRedo()
    },

    /**
     * 清空命令历史
     */
    clearCommandHistory(): void {
      commandManager.clear()
    },

    /**
     * 刷新当前组件引用（撤销重做后需要）
     */
    refreshCurComponent(): void {
      if (this.curComponent) {
        const idx = this.componentData.findIndex(c => c.id === this.curComponent!.id)
        if (idx !== -1) {
          this.curComponent = this.componentData[idx]
          this.curComponentIndex = idx
        } else {
          this.curComponent = null
          this.curComponentIndex = null
        }
      }
    },

    // ==================== 带命令的操作方法 ====================

    /**
     * 移动组件（带命令）
     */
    moveComponent(componentId: string, oldStyle: Partial<ComponentStyle>, newStyle: Partial<ComponentStyle>): void {
      this.executeCommand(new MoveCommand(componentId, oldStyle, newStyle))
    },

    /**
     * 缩放组件（带命令）
     */
    resizeComponent(componentId: string, oldStyle: Partial<ComponentStyle>, newStyle: Partial<ComponentStyle>): void {
      this.executeCommand(new ResizeCommand(componentId, oldStyle, newStyle))
    },

    /**
     * 旋转组件（带命令）
     */
    rotateComponent(componentId: string, oldRotate: number, newRotate: number): void {
      this.executeCommand(new RotateCommand(componentId, oldRotate, newRotate))
    },

    /**
     * 添加组件（带命令）
     */
    addComponentWithCommand(component: ComponentData, index?: number): void {
      this.executeCommand(new AddComponentCommand(component, index))
    },

    /**
     * 删除组件（带命令）
     */
    deleteComponentWithCommand(id?: string, index?: number): void {
      const componentId = id ?? this.curComponent?.id
      if (!componentId) return
      this.executeCommand(new DeleteComponentCommand(componentId, index))
    },

    /**
     * 图层操作（带命令）
     */
    layerOperation(componentId: string, action: 'up' | 'down' | 'top' | 'bottom'): void {
      this.executeCommand(new LayerCommand(componentId, action))
    },

    /**
     * 组合组件（带命令）
     */
    composeWithCommand(): void {
      const componentIds = this.areaData.components.map(c => c.id)
      if (componentIds.length > 0) {
        this.executeCommand(new ComposeCommand(componentIds))
        eventBus.emit('hideArea')
      }
    },

    /**
     * 拆分组件（带命令）
     */
    decomposeWithCommand(): void {
      if (this.curComponent && this.curComponent.component === 'Group') {
        this.executeCommand(new DecomposeCommand(this.curComponent.id))
      }
    },

    /**
     * 清空画布（带命令）
     */
    clearCanvasWithCommand(): void {
      this.executeCommand(new ClearCanvasCommand())
    },

    /**
     * 剪切组件（带命令）
     */
    cutWithCommand(id?: string, index?: number): void {
      const componentId = id ?? this.curComponent?.id
      if (!componentId) return
      this.executeCommand(new CutCommand(componentId, index))
    },

    /**
     * 导入数据（带命令）
     */
    importDataWithCommand(componentData: ComponentData[], canvasStyle?: CanvasStyleData): void {
      this.executeCommand(new ImportDataCommand(componentData, canvasStyle))
    },

    /**
     * 粘贴组件（带命令）
     */
    pasteWithCommand(isMouse?: boolean): void {
      if (!this.copyData) return
      this.executeCommand(new PasteCommand(
        this.copyData.data,
        isMouse,
        this.menuTop,
        this.menuLeft
      ))
    },

    showContextMenu({ top, left }: ShowContextMenuPayload): void {
      this.menuShow = true
      this.menuTop = top
      this.menuLeft = left
    },

    hideContextMenu(): void {
      this.menuShow = false
    },

    toggleDarkMode(val: boolean): void {
      this.isDarkMode = val
      localStorage.setItem('isDarkMode', String(val))
    },

    lock(): void {
      if (this.curComponent) {
        this.curComponent.isLock = true
      }
    },

    unlock(): void {
      if (this.curComponent) {
        this.curComponent.isLock = false
      }
    },

    compose(): void {
      if (this.areaData.components.length) {
        const components: ComponentData[] = []
        this.areaData.components.forEach(component => {
          if (component.component !== 'Group') {
            components.push(component)
          } else {
            // 如果要组合的组件中，已经存在组合数据，则需要提前拆分
            const parentStyle = { ...component.style }
            const subComponents = component.propValue as ComponentData[]
            const editorRect = this.editor!.getBoundingClientRect()

            subComponents.forEach(subComponent => {
              decomposeComponent(subComponent, editorRect, parentStyle)
            })

            components.push(...subComponents)
          }
        })

        const groupComponent: ComponentData = {
          id: generateID(),
          component: 'Group',
          label: '组合',
          icon: 'qunzu',
          style: {
            ...this.areaData.style,
          } as ComponentStyle,
          propValue: components,
          animations: [],
          events: {},
          groupStyle: {},
          isLock: false,
          collapseName: 'style',
          linkage: {
            duration: 0,
            data: [
              {
                id: '',
                label: '',
                event: '',
                style: [{ key: '', value: '' }],
              },
            ],
          },
        }

        createGroupStyle(groupComponent)

        this.addComponent({ component: groupComponent })

        eventBus.emit('hideArea')

        this.setCurComponent({
          component: groupComponent,
          index: this.componentData.length - 1,
        })

        this.areaData.components.forEach(component => {
          this.deleteComponent(this.componentData.findIndex(item => item.id === component.id))
        })
      }
    },

    decompose(): void {
      if (!this.curComponent || !this.editor) return

      const parentStyle = { ...this.curComponent.style }
      const components = this.curComponent.propValue as ComponentData[]
      const editorRect = this.editor.getBoundingClientRect()

      components.forEach(component => {
        decomposeComponent(component, editorRect, parentStyle)
        this.addComponent({ component })
      })

      this.deleteComponent()
    },

    copy(): void {
      if (!this.curComponent) {
        ElMessage.warning('请选择组件')
        return
      }

      // 如果有剪切数据，需要先还原
      if (this.copyData) {
        this.copyData = null
      }

      this.copyData = {
        data: deepCopy(this.curComponent),
        index: this.curComponentIndex!,
      }
    },

    paste(isMouse?: boolean): void {
      if (!this.copyData) {
        ElMessage.warning('请选择组件')
        return
      }

      const data = deepCopy(this.copyData.data)

      if (isMouse) {
        data.style.top = this.menuTop
        data.style.left = this.menuLeft
      } else {
        data.style.top = (data.style.top ?? 0) + 10
        data.style.left = (data.style.left ?? 0) + 10
      }

      data.id = generateID()

      // Group's sub components id
      if (data.component === 'Group') {
        (data.propValue as ComponentData[]).forEach(component => {
          component.id = generateID()
        })
      }

      this.addComponent({ component: deepCopy(data) })

      if (this.copyData.isCut) {
        this.copyData = null
      }
    },

    cut(): void {
      if (!this.curComponent) {
        ElMessage.warning('请选择组件')
        return
      }

      this.cutWithCommand()
    },

    // ==================== 版本管理 ====================

    saveVersion(name: string, description: string): void {
      const version: PageVersion = {
        id: generateID(),
        name,
        description,
        snapshot: deepCopy(this.componentData),
        createdAt: new Date().toISOString(),
      }
      this.versions.push(version)
      this.saveVersionsToStorage()
      ElMessage.success('版本保存成功')
    },

    restoreVersion(versionId: string): void {
      const version = this.versions.find(v => v.id === versionId)
      if (version) {
        this.importDataWithCommand(deepCopy(version.snapshot))
        ElMessage.success('版本恢复成功')
      }
    },

    deleteVersion(versionId: string): void {
      this.versions = this.versions.filter(v => v.id !== versionId)
      this.saveVersionsToStorage()
      ElMessage.success('版本删除成功')
    },

    saveVersionsToStorage(): void {
      localStorage.setItem('pageVersions', JSON.stringify(this.versions))
    },

    loadVersionsFromStorage(): void {
      const data = localStorage.getItem('pageVersions')
      if (data) {
        try {
          this.versions = JSON.parse(data)
        } catch {
          this.versions = []
        }
      }
    },
  },
})

export function setDefaultcomponentData(data: ComponentData[] = []): void {
  const store = useStore()
  store.setComponentData(data)
}

// 导入类型用于 compose 方法




