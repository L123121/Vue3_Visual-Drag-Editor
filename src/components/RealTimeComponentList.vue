<template>
    <div class="real-time-component-list">
        <div
            v-for="(item, index) in componentData"
            :key="index"
            class="list"
            :class="{ actived: transformIndex(index) === curComponentIndex }"
            @click="onClick(transformIndex(index))"
        >
            <el-icon v-if="getComponent(index).icon === 'DataAnalysis'" class="mr-4">
                <DataAnalysis />
            </el-icon>
            <span v-else class="iconfont" :class="'icon-' + getComponent(index).icon"></span>
            
            <span class="label">{{ getComponent(index).label }}</span>
            
            <div class="icon-container">
                <el-button link :icon="ArrowUp" size="small" @click.stop="upComponent(transformIndex(index))"></el-button>
                <el-button link :icon="ArrowDown" size="small" @click.stop="downComponent(transformIndex(index))"></el-button>
                <el-button link :icon="Delete" size="small" type="danger" @click.stop="deleteComponent(transformIndex(index))"></el-button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useStore } from '@/store'
import { storeToRefs } from 'pinia'
import { DataAnalysis, ArrowUp, ArrowDown, Delete } from '@element-plus/icons-vue'

const store = useStore()
const { componentData, curComponentIndex, rightList } = storeToRefs(store)

function getComponent(index) {
    return componentData.value[componentData.value.length - 1 - index]
}

function transformIndex(index) {
    return componentData.value.length - 1 - index
}

function onClick(index) {
    if (!rightList.value) {
        store.isShowRightList()
    }
    setCurComponent(index)
}

function deleteComponent() {
    setTimeout(() => {
        store.deleteComponent()
        store.recordSnapshot()
    })
}

function upComponent() {
    setTimeout(() => {
        store.upComponent()
        store.recordSnapshot()
    })
}

function downComponent() {
    setTimeout(() => {
        store.downComponent()
        store.recordSnapshot()
    })
}

function setCurComponent(index) {
    store.setCurComponent({ component: componentData.value[index], index })
}
</script>

<style lang="scss" scoped>
.real-time-component-list {
    height: 35%;
    overflow: auto;

    .list {
        height: 40px;
        cursor: grab;
        text-align: center;
        color: var(--text-color);
        display: flex;
        align-items: center;
        font-size: 13px;
        padding: 0 10px;
        position: relative;
        user-select: none;
        opacity: 1;
        transition: background-color 0.2s;
        border-bottom: 1px solid var(--border-color);

        &:active {
            cursor: grabbing;
        }

        &:hover {
            background-color: var(--button-active-bg-color);

            .icon-container {
                display: flex;
            }
        }
        
        &.actived {
            background-color: var(--actived-bg-color);
            color: var(--actived-text-color);
        }

        .iconfont {
            margin-right: 8px;
            font-size: 16px;
        }
        
        .mr-4 {
            margin-right: 8px;
            font-size: 16px;
        }
        
        .label {
            flex: 1;
            text-align: left;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .icon-container {
            position: absolute;
            right: 10px;
            display: none;
            align-items: center;

            .el-button {
                padding: 4px;
                margin-left: 2px;
            }
        }
    }
}
</style>
