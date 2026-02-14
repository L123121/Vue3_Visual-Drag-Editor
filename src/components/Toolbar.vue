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

<script setup>
import { ref, onMounted } from 'vue'
import { useStore } from '@/store'
import { storeToRefs } from 'pinia'
import generateID from '@/utils/generateID'
import Preview from '@/components/Editor/Preview.vue'
import AceEditor from '@/components/Editor/AceEditor.vue'
import { commonStyle, commonAttr } from '@/custom-component/component-list'
import eventBus from '@/utils/eventBus'
import { $ } from '@/utils/utils'
import changeComponentsSizeWithScale, { changeComponentSizeWithScale } from '@/utils/changeComponentsSizeWithScale'
import { ElMessage } from 'element-plus'
import { 
    Sunny, Moon, Edit, Upload, Download, RefreshLeft, RefreshRight, 
    Picture, View, FolderChecked, Delete, Camera, Connection, 
    Remove, Lock, Unlock 
} from '@element-plus/icons-vue'

const store = useStore()
const { componentData, canvasStyleData, areaData, curComponent, isDarkMode } = storeToRefs(store)

const isShowPreview = ref(false)
const isShowAceEditor = ref(false)
const timer = ref(null)
const isScreenshot = ref(false)
const scale = ref(100)
const switchValue = ref(false)
const isShowDialog = ref(false)
const jsonData = ref('')
const isExport = ref(false)

onMounted(() => {
    eventBus.on('preview', preview)
    eventBus.on('save', save)
    eventBus.on('clearCanvas', clearCanvas)

    scale.value = canvasStyleData.value.scale
    const savedMode = JSON.parse(localStorage.getItem('isDarkMode'))
    if (savedMode) {
        handleToggleDarkMode(savedMode)
    }
})

function handleToggleDarkMode(value) {
    if (value !== null) {
        store.toggleDarkMode(value)
        switchValue.value = value
    }
}

function handleScaleChange() {
    clearTimeout(timer.value)
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
    store.compose()
    store.recordSnapshot()
}

function decompose() {
    store.decompose()
    store.recordSnapshot()
}

function undo() {
    store.undo()
}

function redo() {
    store.redo()
}

function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file.type.includes('image')) {
        ElMessage.error('只能插入图片')
        return
    }

    const reader = new FileReader()
    reader.onload = (res) => {
        const fileResult = res.target.result
        const img = new Image()
        img.onload = () => {
            const component = {
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
                },
            }

            // 根据画面比例修改组件样式比例 https://github.com/woai3c/visual-drag-demo/issues/91
            changeComponentSizeWithScale(component)

            store.addComponent({ component })
            store.recordSnapshot()

            // 修复重复上传同一文件，@change 不触发的问题
            $('#input').setAttribute('type', 'text')
            $('#input').setAttribute('type', 'file')
        }

        img.src = fileResult
    }

    reader.readAsDataURL(file)
}

function preview(screenshot) {
    isScreenshot.value = screenshot
    isShowPreview.value = true
    store.setEditMode('preview')
}

function save() {
    localStorage.setItem('canvasData', JSON.stringify(componentData.value))
    localStorage.setItem('canvasStyle', JSON.stringify(canvasStyleData.value))
    ElMessage.success('保存成功')
}

function clearCanvas() {
    store.setCurComponent({ component: null, index: null })
    store.setComponentData([])
    store.recordSnapshot()
}

function handlePreviewChange() {
    isShowPreview.value = false
    store.setEditMode('edit')
}

function onImportJSON() {
    jsonData.value = ''
    isExport.value = false
    isShowDialog.value = true
}

function processJSON() {
    try {
        const data = JSON.parse(jsonData.value)
        if (!Array.isArray(data)) {
            ElMessage.error('数据格式错误，组件数据必须是一个数组')
            return
        }

        if (isExport.value) {
            downloadFileUtil(jsonData.value, 'application/json', 'data.json')
        } else {
            store.setComponentData(data)
        }

        isShowDialog.value = false
    } catch (error) {
        ElMessage.error('数据格式错误，请传入合法的 JSON 格式数据')
    }
}

function onExportJSON() {
    isShowDialog.value = true
    isExport.value = true
    jsonData.value = JSON.stringify(componentData.value, null, 4)
}

function downloadFileUtil(data, type, fileName = '') {
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

function beforeUpload(e) {
    // 通过json文件导入
    const reader = new FileReader()
    reader.readAsText(e)
    reader.onload = function () {
        jsonData.value = this.result
    }

    return false
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
