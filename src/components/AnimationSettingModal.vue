<template>
    <el-dialog
        :title="`${config.label} 动画配置`"
        v-model="centerDialogVisible"
        width="30%"
        center
        @close="handleCloseModal"
    >
        <div class="time">
            动画时长：<el-input-number
                v-model="config.animationTime"
                controls-position="right"
                :min="0.1"
                :precision="2"
                :step="0.01"
            />
        </div>
        <div class="loop">
            是否循环：<el-switch
                v-model="config.isLoop"
                active-text="是"
                inactive-text="否"
                :disabled="isDisabled"
            >
            </el-switch>
        </div>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="handleCloseModal">取 消</el-button>
                <el-button type="primary" @click="handleSaveSetting">确 定</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useStore } from '@/store'
import { storeToRefs } from 'pinia'
import eventBus from '@/utils/eventBus'

const props = defineProps({
    curIndex: {
        type: Number,
        default: 0,
    },
})

const emit = defineEmits(['close'])

const store = useStore()
const { curComponent } = storeToRefs(store)

const centerDialogVisible = ref(true)
const config = reactive({})

const isDisabled = computed(() => {
    return curComponent.value.animations.length > 1
})

// Initialize config
const { label, animationTime, isLoop = false, value } = curComponent.value.animations[props.curIndex] || {}
Object.assign(config, {
    animationTime,
    label,
    isLoop,
    value,
})

function handleCloseModal() {
    emit('close')
}

function handleSaveSetting() {
    const { isLoop } = config
    store.alterAnimation({
        index: props.curIndex,
        data: { 
            animationTime: config.animationTime,
            isLoop,
        },
    })
    eventBus.emit('stopAnimation')
    handleCloseModal()
}
</script>

<style scoped lang="scss">
.loop {
    margin-top: 10px;
}
</style>
