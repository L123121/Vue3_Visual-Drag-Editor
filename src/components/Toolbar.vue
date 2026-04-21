<template>
    <div>
        <div :class="isDarkMode ? 'dark toolbar' : 'toolbar'">
            <el-button-group>
                <el-button @click="onAceEditorChange" :icon="Edit">JSON</el-button>
                <el-button @click="onImportJSON" :icon="Upload">导入</el-button>
                <el-button @click="onExportJSON" :icon="Download">导出</el-button>
            </el-button-group>
            
            <el-button-group class="ml-10">
                <el-button @click="undo" :icon="RefreshLeft">撤消</el-button>
                <el-button @click="redo" :icon="RefreshRight">重做</el-button>
            </el-button-group>

            <label for="input" class="insert">
                <el-button :icon="Picture" style="pointer-events: none;">插入图片</el-button>
                <input
                    id="input"
                    type="file"
                    hidden
                    @change="handleFileChange"
                />
            </label>

            <el-button-group class="ml-10">
                <el-button @click="preview(false)" :icon="View">预览</el-button>
                <el-button @click="save" :icon="FolderChecked">保存</el-button>
                <el-button @click="clearCanvas" :icon="Delete">清空</el-button>
                <el-button @click="preview(true)" :icon="Camera">截图</el-button>
            </el-button-group>

            <el-button-group class="ml-10">
                <el-button :disabled="!areaData.components.length" @click="compose" :icon="Connection">组合</el-button>
                <el-button
                    :disabled="!curComponent || curComponent.isLock || curComponent.component != 'Group'"
                    @click="decompose"
                    :icon="Remove"
                >
                    拆分
                </el-button>
            </el-button-group>

            <el-button-group class="ml-10">
                <el-button :disabled="!curComponent || curComponent.isLock" @click="lock" :icon="Lock">锁定</el-button>
                <el-button :disabled="!curComponent || !curComponent.isLock" @click="unlock" :icon="Unlock">解锁</el-button>
            </el-button-group>

            <el-button-group class="ml-10">
                <el-button @click="showVersionHistory" :icon="Clock">版本历史</el-button>
            </el-button-group>

            <div class="canvas-config ml-10">
                <span>画布大小</span>
                <input v-model="canvasStyleData.width" />
                <span>*</span>
                <input v-model="canvasStyleData.height" />
            </div>
            <div class="canvas-config">
                <span>画布比例</span>
                <input v-model="scale" @input="handleScaleChange" /> %
            </div>
            <el-switch
                v-model="switchValue"
                class="dark-mode-switch"
                :active-icon="Sunny"
                :inactive-icon="Moon"
                active-color="#000"
                @change="handleToggleDarkMode"
            >
            </el-switch>
        </div>

        <!-- 预览 -->
        <Preview v-if="isShowPreview" :is-screenshot="isScreenshot" @close="handlePreviewChange" />
        <AceEditor v-if="isShowAceEditor" @closeEditor="closeEditor" />

        <!-- 版本历史面板 -->
        <el-drawer
            v-model="isShowVersionHistory"
            title="版本历史"
            direction="rtl"
            size="400px"
            :with-header="false"
        >
            <VersionHistory />
        </el-drawer>

        <el-dialog
            v-model="isShowDialog"
            :title="isExport ? '导出数据' : '导入数据'"
            :close-on-press-escape="false"
            :close-on-click-modal="false"
            width="600px"
        >
            <el-input
                v-model="jsonData"
                type="textarea"
                :rows="20"
                placeholder="请输入 JSON 数据"
            >
            </el-input>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="isShowDialog = false">取 消</el-button>
                    <el-upload
                        v-show="!isExport"
                        action="/"
                        :before-upload="beforeUpload"
                        :show-file-list="false"
                        accept="application/json"
                    >
                        <el-button type="primary">选择 JSON 文件</el-button>
                    </el-upload>
                    <el-button type="primary" @click="processJSON">确 定</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useStore } from '@/store'
import { storeToRefs } from 'pinia'
import generateID from '@/utils/generateID'
import Preview from '@/components/Editor/Preview.vue'
import AceEditor from '@/components/Editor/AceEditor.vue'
import VersionHistory from '@/components/VersionHistory.vue'
import { commonStyle, commonAttr } from '@/custom-component/component-list'
import eventBus from '@/utils/eventBus'
import { $ } from '@/utils/utils'
import changeComponentsSizeWithScale, { changeComponentSizeWithScale } from '@/utils/changeComponentsSizeWithScale'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    Sunny, Moon, Edit, Upload, Download, RefreshLeft, RefreshRight,
    Picture, View, FolderChecked, Delete, Camera, Connection,
    Remove, Lock, Unlock, Clock
} from '@element-plus/icons-vue'
import type { ComponentData, CanvasStyleData, ComponentStyle } from '@/types'
import { validateAuto } from '@/utils/validation'

// 导出数据格式
interface ExportData {
    version: string
    timestamp: number
    canvasStyle: CanvasStyleData
    componentData: ComponentData[]
}

const store = useStore()
const { componentData, canvasStyleData, areaData, curComponent, isDarkMode } = storeToRefs(store)

const isShowPreview = ref(false)
const isShowAceEditor = ref(false)
const timer = ref<ReturnType<typeof setTimeout> | null>(null)
const isScreenshot = ref(false)
const scale = ref(100)
const switchValue = ref(false)
const isShowDialog = ref(false)
const jsonData = ref('')
const isExport = ref(false)
const isShowVersionHistory = ref(false)

// 当前版本号，用于数据兼容性检查
const DATA_VERSION = '1.0.0'

onMounted(() => {
    eventBus.on('preview', preview)
    eventBus.on('save', save)
    eventBus.on('clearCanvas', clearCanvas)

    scale.value = canvasStyleData.value.scale
    const savedMode = localStorage.getItem('isDarkMode')
    if (savedMode) {
        handleToggleDarkMode(JSON.parse(savedMode))
    }
})

onUnmounted(() => {
    eventBus.off('preview', preview)
    eventBus.off('save', save)
    eventBus.off('clearCanvas', clearCanvas)
})

function handleToggleDarkMode(value: boolean): void {
    store.toggleDarkMode(value)
    switchValue.value = value
}

function handleScaleChange(): void {
    if (timer.value) clearTimeout(timer.value)
    store.setLastScale(scale.value)
    timer.value = setTimeout(() => {
        // 画布比例设一个最小值，不能为 0
        // eslint-disable-next-line no-bitwise
        scale.value = ~~scale.value || 1
        changeComponentsSizeWithScale(scale.value)
    }, 1000)
}

function onAceEditorChange() {
    isShowAceEditor.value = !isShowAceEditor.value
}

function closeEditor() {
    onAceEditorChange()
}

function lock() {
    store.lock()
}

function unlock() {
    store.unlock()
}

function compose() {
    store.composeWithCommand()
}

function decompose() {
    store.decomposeWithCommand()
}

function undo() {
    store.undo()
}

function redo() {
    store.redo()
}

function handleFileChange(e: Event): void {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    if (!file.type.includes('image')) {
        ElMessage.error('只能插入图片')
        return
    }

    const reader = new FileReader()
    reader.onload = (res) => {
        const fileResult = res.target?.result as string
        const img = new Image()
        img.onload = () => {
            const component: ComponentData = {
                ...commonAttr,
                id: generateID(),
                component: 'Picture',
                label: '图片',
                icon: '',
                propValue: {
                    url: fileResult,
                    flip: {
                        horizontal: false,
                        vertical: false,
                    },
                },
                style: {
                    ...commonStyle,
                    top: 0,
                    left: 0,
                    width: img.width,
                    height: img.height,
                } as ComponentStyle,
            }

            // 根据画面比例修改组件样式比例 https://github.com/woai3c/visual-drag-demo/issues/91
            changeComponentSizeWithScale(component)

            store.addComponentWithCommand(component)

            // 修复重复上传同一文件，@change 不触发的问题
            const input = $('#input') as HTMLInputElement
            if (input) {
                input.type = 'text'
                input.type = 'file'
            }
        }

        img.src = fileResult
    }

    reader.readAsDataURL(file)
}

function preview(screenshot: boolean): void {
    isScreenshot.value = screenshot
    isShowPreview.value = true
    store.setEditMode('preview')
}

function save(): void {
    localStorage.setItem('canvasData', JSON.stringify(componentData.value))
    localStorage.setItem('canvasStyle', JSON.stringify(canvasStyleData.value))
    ElMessage.success('保存成功')
}

function clearCanvas(): void {
    ElMessageBox.confirm('确定要清空画布吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(() => {
        store.clearCanvasWithCommand()
        ElMessage.success('画布已清空')
    }).catch(() => {
        // 用户取消
    })
}

function handlePreviewChange(): void {
    isShowPreview.value = false
    store.setEditMode('edit')
}

function onImportJSON(): void {
    jsonData.value = ''
    isExport.value = false
    isShowDialog.value = true
}

/**
 * 为组件生成新的 ID（导入时避免 ID 冲突）
 */
function regenerateComponentIds(components: ComponentData[]): ComponentData[] {
    return components.map(comp => ({
        ...comp,
        id: generateID(),
        // 如果是组合组件，递归处理子组件
        ...(comp.component === 'Group' && Array.isArray(comp.propValue)
            ? { propValue: regenerateComponentIds(comp.propValue as ComponentData[]) }
            : {})
    }))
}

function processJSON(): void {
    try {
        const data = JSON.parse(jsonData.value)

        if (isExport.value) {
            // 导出：下载文件
            downloadFileUtil(jsonData.value, 'application/json', `lowcode-project-${Date.now()}.json`)
            ElMessage.success('导出成功')
        } else {
            // 导入：使用 Zod 校验
            const result = validateAuto(data)
            if (!result.success) {
                ElMessage.error(`数据校验失败: ${result.errors?.join(', ')}`)
                return
            }

            const { componentData: components, canvasStyle } = result.data!

            // 为组件生成新 ID，避免冲突
            const newComponents = regenerateComponentIds(components)

            // 如果当前画布有内容，询问是否覆盖
            if (componentData.value.length > 0) {
                ElMessageBox.confirm(
                    '当前画布有内容，导入将覆盖现有内容，是否继续？',
                    '导入确认',
                    {
                        confirmButtonText: '覆盖',
                        cancelButtonText: '取消',
                        type: 'warning',
                    }
                ).then(() => {
                    applyImport(newComponents, canvasStyle ?? null)
                }).catch(() => {
                    // 用户取消
                })
            } else {
                applyImport(newComponents, canvasStyle ?? null)
            }
        }

        isShowDialog.value = false
    } catch (error) {
        ElMessage.error('数据格式错误，请传入合法的 JSON 格式数据')
        console.error('Import error:', error)
    }
}

/**
 * 应用导入的数据
 */
function applyImport(components: ComponentData[], canvasStyle: CanvasStyleData | null): void {
    store.importDataWithCommand(components, canvasStyle ?? undefined)
    if (canvasStyle) {
        scale.value = canvasStyle.scale
    }
    ElMessage.success(`导入成功，共 ${components.length} 个组件`)
}

function onExportJSON(): void {
    isShowDialog.value = true
    isExport.value = true

    // 导出完整的项目数据（包含画布样式）
    const exportData: ExportData = {
        version: DATA_VERSION,
        timestamp: Date.now(),
        canvasStyle: canvasStyleData.value,
        componentData: componentData.value,
    }

    jsonData.value = JSON.stringify(exportData, null, 2)
}

/**
 * 下载文件工具函数
 */
function downloadFileUtil(data: string, type: string, fileName: string): void {
    const url = window.URL.createObjectURL(new Blob([data], { type }))
    const link = document.createElement('a')

    link.style.display = 'none'
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
}

/**
 * 上传文件前的处理
 */
function beforeUpload(file: File): boolean {
    // 检查文件类型
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
        ElMessage.error('只支持 JSON 格式文件')
        return false
    }

    // 检查文件大小（限制 10MB）
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
        ElMessage.error('文件大小不能超过 10MB')
        return false
    }

    const reader = new FileReader()
    reader.readAsText(file)
    reader.onload = function () {
        jsonData.value = this.result as string
    }
    reader.onerror = function () {
        ElMessage.error('文件读取失败')
    }

    return false
}

function showVersionHistory(): void {
    isShowVersionHistory.value = true
}
</script>

<style lang="scss" scoped>
.toolbar {
    height: var(--toolbar-height);
    line-height: var(--toolbar-height);
    background: #fff;
    border-bottom: 1px solid var(--toolbar-border-color);
    padding: 0 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    z-index: 100;
    position: relative;

    .ml-10 {
        margin-left: 0;
    }

    .canvas-config {
        display: flex;
        align-items: center;
        font-size: 13px;
        color: var(--secondary-text-color);
        gap: 8px;
        margin-left: 12px;
        padding-left: 12px;
        border-left: 1px solid var(--border-color);

        input {
            width: 50px;
            height: 28px;
            border: 1px solid var(--border-color);
            outline: none;
            text-align: center;
            border-radius: 4px;
            font-size: 12px;
            color: var(--text-color);
            transition: border-color 0.2s;

            &:focus {
                border-color: var(--primary-color);
            }
        }

        span {
            white-space: nowrap;
        }
    }

    .insert {
        display: inline-block;
        line-height: 1;
        vertical-align: middle;
    }

    .dark-mode-switch {
        margin-left: auto;
    }

    :deep(.el-button) {
        height: 32px;
        padding: 8px 15px;
        font-size: 13px;
        border-radius: 4px;
        
        &.is-disabled {
            background-color: transparent;
        }
    }

    :deep(.el-button-group) {
        display: flex;
        gap: 1px;
        background: var(--border-color);
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid var(--border-color);

        .el-button {
            border: none;
            margin: 0;
            border-radius: 0;
        }
    }
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;

    & > * {
        margin-left: 10px;
    }
}
</style>
