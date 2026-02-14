import { defineStore } from 'pinia'
import { deepCopy, swap, $ } from '@/utils/utils'
import eventBus from '@/utils/eventBus'
import animationClassData from '@/utils/animationClassData'
import { ElMessage } from 'element-plus'
import generateID from '@/utils/generateID'
import decomposeComponent from '@/utils/decomposeComponent'
import { createGroupStyle } from '@/utils/style'

export const useStore = defineStore('main', {
    state: () => ({
        editMode: 'edit', // edit, preview
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
        // 点击画布时是否点中组件，主要用于取消选中组件用。
        // 如果没点中组件，并且CvnasAttr也没有点击，那么就取消选中组件
        isClickComponent: false,
        editor: null,
        snapshotData: [], // 编辑器快照数据
        snapshotIndex: -1, // 快照索引
        menuTop: 0,
        menuLeft: 0,
        menuShow: false,
        copyData: null, // 复制粘贴剪切
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
    }),
    actions: {
        setClickComponentStatus(status) {
            this.isClickComponent = status
        },
        
        setEditor(el) {
            this.editor = el
        },

        getEditor() {
            this.editor = $('#editor')
        },

        setAreaData(data) {
            this.areaData = data
        },

        setCanvasStyle(style) {
            this.canvasStyleData = style
        },

        setCurComponent({ component, index }) {
            this.curComponent = component
            this.curComponentIndex = index
        },

        setShapeStyle({ top, left, width, height, rotate }) {
            if (top !== undefined) this.curComponent.style.top = Math.round(top)
            if (left !== undefined) this.curComponent.style.left = Math.round(left)
            if (width) this.curComponent.style.width = Math.round(width)
            if (height) this.curComponent.style.height = Math.round(height)
            if (rotate) this.curComponent.style.rotate = Math.round(rotate)
        },

        setShapeSingleStyle({ key, value }) {
            this.curComponent.style[key] = value
        },

        setComponentData(componentData = []) {
            this.componentData = componentData
        },

        addComponent({ component, index }) {
            if (index !== undefined) {
                this.componentData.splice(index, 0, component)
            } else {
                this.componentData.push(component)
            }
        },

        deleteComponent(index) {
            if (index === undefined) {
                index = this.curComponentIndex
            }
            
            if (index == this.curComponentIndex) {
                this.curComponentIndex = null
                this.curComponent = null
            }

            if (/\d/.test(index)) {
                this.componentData.splice(index, 1)
            }
        },

        isShowRightList() {
            this.rightList = !this.rightList
        },

        updateComponent({ index, key, value }) {
             // helper for update
        },

        updateComponentProps(data) {
            if (this.curComponent) {
                Object.assign(this.curComponent, data)
            }
        },
        
        upComponent() {
            // 上移图层 index，往后移
            if (this.curComponentIndex < this.componentData.length - 1) {
                swap(this.componentData, this.curComponentIndex, this.curComponentIndex + 1)
                this.curComponentIndex = this.curComponentIndex + 1
            } else {
                ElMessage.warning('已经到底了')
            }
        },

        downComponent() {
            // 下移图层 index，往前移
            if (this.curComponentIndex > 0) {
                swap(this.componentData, this.curComponentIndex, this.curComponentIndex - 1)
                this.curComponentIndex = this.curComponentIndex - 1
            } else {
                ElMessage.warning('已经到顶了')
            }
        },

        topComponent() {
            // 置顶
            if (this.curComponentIndex < this.componentData.length - 1) {
                swap(this.componentData, this.curComponentIndex, this.componentData.length - 1)
                this.curComponentIndex = this.componentData.length - 1
            } else {
                ElMessage.warning('已经到底了')
            }
        },

        bottomComponent() {
            // 置底
            if (this.curComponentIndex > 0) {
                swap(this.componentData, this.curComponentIndex, 0)
                this.curComponentIndex = 0
            } else {
                ElMessage.warning('已经到顶了')
            }
        },

        addAnimation(animation) {
            this.curComponent.animations.push(animation)
        },

        removeAnimation(index) {
            this.curComponent.animations.splice(index, 1)
        },

        addEvent({ event, param }) {
            this.curComponent.events[event] = param
        },

        removeEvent(event) {
            delete this.curComponent.events[event]
        },

        alterAnimation({ index, data = {} }) {
            if (typeof index === 'number') {
                const original = this.curComponent.animations[index]
                this.curComponent.animations[index] = { ...original, ...data }
            }
        },

        setEditMode(mode) {
            this.editMode = mode
        },

        setInEditorStatus(status) {
            this.isInEditor = status
        },
        
        recordSnapshot() {
            // 添加新的快照
            this.snapshotData[++this.snapshotIndex] = deepCopy(this.componentData)
            // 在 undo 过程中，添加新的快照时，要将它后面的快照清理掉
            if (this.snapshotIndex < this.snapshotData.length - 1) {
                this.snapshotData = this.snapshotData.slice(0, this.snapshotIndex + 1)
            }
        },

        undo() {
            if (this.snapshotIndex >= 0) {
                this.snapshotIndex--
                const data = deepCopy(this.snapshotData[this.snapshotIndex]) || []
                if (this.curComponent) {
                    // 如果当前组件不在 componentData 中，则置空
                    const needClean = !data.find(component => this.curComponent.id === component.id)
                    if (needClean) {
                        this.curComponent = null
                        this.curComponentIndex = null
                    }
                }
                this.componentData = data
            }
        },

        redo() {
            if (this.snapshotIndex < this.snapshotData.length - 1) {
                this.snapshotIndex++
                this.componentData = deepCopy(this.snapshotData[this.snapshotIndex])
            }
        },

        showContextMenu({ top, left }) {
            this.menuShow = true
            this.menuTop = top
            this.menuLeft = left
        },

        hideContextMenu() {
            this.menuShow = false
        },

        toggleDarkMode(val) {
            this.isDarkMode = val
            localStorage.setItem('isDarkMode', val)
        },

        lock() {
            this.curComponent.isLock = true
        },

        unlock() {
            this.curComponent.isLock = false
        },

        compose() {
            if (this.areaData.components.length) {
                const components = []
                this.areaData.components.forEach(component => {
                    if (component.component != 'Group') {
                        components.push(component)
                    } else {
                        // 如果要组合的组件中，已经存在组合数据，则需要提前拆分
                        const parentStyle = { ...component.style }
                        const subComponents = component.propValue
                        const editorRect = this.editor.getBoundingClientRect()

                        subComponents.forEach(component => {
                            decomposeComponent(component, editorRect, parentStyle)
                        })

                        components.push(...component.propValue)
                    }
                })

                const groupComponent = {
                    id: generateID(),
                    component: 'Group',
                    label: '组合',
                    icon: 'qunzu',
                    style: {
                        ...this.areaData.style,
                    },
                    propValue: components,
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

        decompose() {
            const parentStyle = { ...this.curComponent.style }
            const components = this.curComponent.propValue
            const editorRect = this.editor.getBoundingClientRect()

            components.forEach(component => {
                decomposeComponent(component, editorRect, parentStyle)
                this.addComponent({ component })
            })

            this.deleteComponent()
        },

        copy() {
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
                index: this.curComponentIndex,
            }
        },

        paste(isMouse) {
            if (!this.copyData) {
                ElMessage.warning('请选择组件')
                return
            }

            const data = this.copyData.data

            if (isMouse) {
                data.style.top = this.menuTop
                data.style.left = this.menuLeft
            } else {
                data.style.top += 10
                data.style.left += 10
            }

            data.id = generateID()
            
            // Group's sub components id
            if (data.component === 'Group') {
                data.propValue.forEach(component => {
                    component.id = generateID()
                })
            }

            this.addComponent({ component: deepCopy(data) })
            
            if (this.copyData.isCut) {
                this.copyData = null
            }
        },

        cut() {
            if (!this.curComponent) {
                ElMessage.warning('请选择组件')
                return
            }

            if (this.copyData) {
                const data = deepCopy(this.copyData.data)
                const index = this.copyData.index
                data.id = generateID()
                this.addComponent({ component: data, index })
                if (this.curComponentIndex >= index) {
                    this.curComponentIndex++
                }
            }

            this.copyData = {
                data: deepCopy(this.curComponent),
                index: this.curComponentIndex,
                isCut: true,
            }

            this.deleteComponent()
        },
    },
})

export function setDefaultcomponentData(data = []) {
    const store = useStore()
    store.setComponentData(data)
}
