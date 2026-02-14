<template>
    <div :class="!isDarkMode? 'home' : 'home dark'">
        <Toolbar />

        <main>
            <!-- 左侧组件列表 -->
            <section :class="leftList ? 'left active' : 'left inactive'">
                <el-tabs v-model="leftActiveName">
                    <el-tab-pane name="components">
                        <template #label>
                            <span class="tab-label">
                                <el-icon><Box /></el-icon>
                                <span>组件列表</span>
                            </span>
                        </template>
                        <ComponentList />
                    </el-tab-pane>
                    <el-tab-pane name="layers">
                        <template #label>
                            <span class="tab-label">
                                <el-icon><Operation /></el-icon>
                                <span>图层</span>
                            </span>
                        </template>
                        <RealTimeComponentList />
                    </el-tab-pane>
                </el-tabs>
            </section>
            <el-button
                title="show-list-btn"
                class="btn show-list left-btn"
                :icon="leftList ? ArrowLeft : ArrowRight"
                @click="isShowLeft"
            >
            </el-button>
            <!-- 中间画布 -->
            <section class="center" :style="rightList ? 'margin-right:288px' : 'margin-right:10px'">
                <div
                    class="content"
                    @drop="handleDrop"
                    @dragover="handleDragOver"
                    @mousedown="handleMouseDown"
                    @mouseup="deselectCurComponent"
                >
                    <Editor />
                </div>
            </section>
            <!-- 右侧属性列表 -->
            <section :class="rightList ? 'right active' : 'right inactive'">
                <el-tabs v-if="curComponent" v-model="activeName">
                    <el-tab-pane name="attr">
                        <template #label>
                            <span class="tab-label">
                                <el-icon><CollectionTag /></el-icon>
                                <span>属性</span>
                            </span>
                        </template>
                        <component :is="curComponent.component + 'Attr'" />
                    </el-tab-pane>
                    <el-tab-pane name="animation">
                        <template #label>
                            <span class="tab-label">
                                <el-icon><Film /></el-icon>
                                <span>动画</span>
                            </span>
                        </template>
                        <AnimationList />
                    </el-tab-pane>
                    <el-tab-pane name="events">
                        <template #label>
                            <span class="tab-label">
                                <el-icon><Pointer /></el-icon>
                                <span>事件</span>
                            </span>
                        </template>
                        <EventList />
                    </el-tab-pane>
                </el-tabs>
                <CanvasAttr v-else></CanvasAttr>
            </section>
            <el-button
                title="show-list-btn"
                class="btn show-list right-btn"
                :icon="rightList ? ArrowRight : ArrowLeft"
                @click="isShowRight"
            >
            </el-button>
        </main>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from '@/store'
import { storeToRefs } from 'pinia'
import Editor from '@/components/Editor/index.vue'
import ComponentList from '@/components/ComponentList.vue' // 左侧列表组件
import AnimationList from '@/components/AnimationList.vue' // 右侧动画列表
import EventList from '@/components/EventList.vue' // 右侧事件列表
import componentList from '@/custom-component/component-list' // 左侧列表数据
import Toolbar from '@/components/Toolbar.vue'
import { deepCopy } from '@/utils/utils'
import generateID from '@/utils/generateID'
import { listenGlobalKeyDown } from '@/utils/shortcutKey'
import RealTimeComponentList from '@/components/RealTimeComponentList.vue'
import CanvasAttr from '@/components/CanvasAttr.vue'
import { changeComponentSizeWithScale } from '@/utils/changeComponentsSizeWithScale'
import { setDefaultcomponentData } from '@/store/index'
import { ArrowLeft, ArrowRight, Box, Operation, CollectionTag, Film, Pointer } from '@element-plus/icons-vue'

const store = useStore()
const { componentData, curComponent, isClickComponent, canvasStyleData, editor, rightList, isDarkMode } = storeToRefs(store)

const activeName = ref('attr')
const leftActiveName = ref('components')
const leftList = ref(true)

onMounted(() => {
    restore()
    // 全局监听按键事件
    const cleanup = listenGlobalKeyDown()
    onUnmounted(() => {
        cleanup()
    })

    const savedMode = localStorage.getItem('isDarkMode')
    if (savedMode !== null) {
        store.toggleDarkMode(JSON.parse(savedMode))
    } else {
        store.isDarkMode = false
    }
})

function restore() {
    // 用保存的数据恢复画布
    if (localStorage.getItem('canvasData')) {
        setDefaultcomponentData(JSON.parse(localStorage.getItem('canvasData')))
        store.setComponentData(JSON.parse(localStorage.getItem('canvasData')))
    }

    if (localStorage.getItem('canvasStyle')) {
        store.setCanvasStyle(JSON.parse(localStorage.getItem('canvasStyle')))
    }
}

function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()

    const index = e.dataTransfer.getData('index')
    const rectInfo = store.editor.getBoundingClientRect()
    if (index) {
        const component = deepCopy(componentList[index])
        component.style.top = e.clientY - rectInfo.y
        component.style.left = e.clientX - rectInfo.x
        component.id = generateID()

        // 根据画面比例修改组件样式比例
        changeComponentSizeWithScale(component)

        store.addComponent({ component })
        store.recordSnapshot()
    }
}

function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
}

function handleMouseDown(e) {
    e.stopPropagation()
    store.setClickComponentStatus(false)
    store.setInEditorStatus(true)
}

function deselectCurComponent(e) {
    if (!isClickComponent.value) {
        store.setCurComponent({ component: null, index: null })
    }

    // 0 左击 1 滚轮 2 右击
    if (e.button != 2) {
        store.hideContextMenu()
    }
}

function isShowLeft() {
    leftList.value = !leftList.value
}

function isShowRight() {
    store.isShowRightList()
}
</script>

<style lang="scss">
.home {
    height: 100vh;
    background: var(--main-bg-color);

    main {
        height: calc(100% - var(--toolbar-height));
        position: relative;
        background: var(--secondary-bg-color);

        .show-list {
            position: absolute;
            z-index: 10;
            top: 50%;
            transform: translateY(-50%);
            transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            border: 1px solid var(--border-color);
            background: var(--main-bg-color);
            height: 48px;
            width: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;

            &:hover {
                color: var(--primary-color);
                background: var(--button-active-bg-color);
            }
        }

        .left-btn {
            margin-left: var(--sidebar-width);
            left: -1px;
            border-radius: 0 4px 4px 0;
            padding: 0;
        }

        .right-btn {
            right: 0;
            margin-right: 288px;
            border-radius: 4px 0 0 4px;
            padding: 0;
        }

        .left,
        .right {
            position: absolute;
            height: 100%;
            top: 0;
            transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
            background: var(--panel-bg);
            color: var(--text-color);
            box-shadow: 0 0 10px rgba(0,0,0,0.02);
            z-index: 5;
        }

        .left {
            width: var(--sidebar-width);
            left: 0;
            border-right: 1px solid var(--border-color);

            .real-time-component-list .list:hover {
                color: var(--text-color);
            }

            .real-time-component-list .actived.list {
                color: var(--actived-text-color);
                background-color: var(--actived-bg-color);
            }

            .real-time-component-list .list {
                color: var(--text-color);
            }

            & > div {
                overflow: auto;

                &:first-child {
                    border-bottom: 1px solid var(--border-color);
                }
            }
        }

        .center {
            margin: 0 288px 0 200px;
            background: var(--secondary-bg-color);
            height: 100%;
            overflow: auto;
            padding: 20px;
            transition: all .3s;
        }

        .placeholder {
            text-align: center;
            color: var(--placeholder-text-color);
        }

        .left.inactive {
            width: 0;
            border-right: none;
            overflow: hidden;

            div {
                opacity: 0;
            }
        }

        .left.inactive ~ .center {
            margin-left: 0;
        }

        .left.inactive ~ .btn.left-btn {
            margin-left: 0;
        }

        .right.inactive ~ .btn.right-btn {
            margin-right: 0;
        }

        .right {
            position: absolute;
            height: 100%;
            width: 288px;
            right: 0;
            top: 0;
            transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
            background-color: var(--panel-bg);
            border-left: 1px solid var(--border-color);
            z-index: 5;

            .el-select {
                width: 100%;
            }

            .el-form-item__label {
                color: var(--text-color);
            }

            .el-tabs__item.is-top {
                color: var(--text-color);

                &.is-active {
                    color: var(--actived-text-color);
                }
            }

            .el-input__inner {
                background-color: var(--placeholder-bg-color);
                color: var(--text-color);
                border-color: var(--border-color);
            }

            textarea.el-textarea__inner {
                background-color: var(--placeholder-bg-color);
                color: var(--text-color);
            }

            .el-select-dropdown__item {
                color: var(--text-color);
            }

            .linkage-container .linkage-component {
                border-color: var(--border-color);

                .div-guanbi {
                    color: var(--border-color);
                    border-color: var(--border-color);
                }
            }
        }

        .right.inactive {
            width: 0;
            overflow: hidden;

            div {
                opacity: 0;
            }
        }

        .right.inactive ~ .center {
            margin-right: 0;
        }

        .center {
            margin-left: var(--sidebar-width);
            margin-right: 288px;
            background: var(--secondary-bg-color);
            height: 100%;
            overflow: auto;
            padding: 40px;
            transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: flex-start;
            justify-content: center;

            .content {
                box-shadow: 0 0 20px rgba(0,0,0,0.05);
                background: #fff;
                flex-shrink: 0;
            }
        }
    }

    .placeholder {
        text-align: center;
        color: var(--placeholder-text-color);
    }

    .global-attr {
        padding: 10px;
    }

    .el-collapse {
        border-color: var(--border-color);
    }

    .el-collapse-item__header,
    .el-collapse-item__wrap {
        border-color: var(--border-color);
        background-color: var(--main-bg-color);
        color: var(--text-color);
    }

    .el-collapse-item__header.is-active {
        border-bottom-color: transparent !important;
    }

    .el-tabs__item {
        color: var(--text-color);
    }

    .animation-list {
        .el-tabs.el-tabs--top {
            background-color: var(--main-bg-color);
        }

        .el-scrollbar__view {
            margin-top: 30px;
        }
    }

    .ace {
        background: var(--ace-bg-color);
        border-color: var(--main-bg-color);

        .ace_editor,
        .ace_gutter {
            background-color: var(--main-bg-color);
            color: var(--text-color);
        }
    }
}

</style>
