<template>
    <div class="attr-list v-talbe-attr">
        <CommonAttr></CommonAttr>
        <EditTable></EditTable>
        <el-form>
            <el-form-item label="斑马纹">
                <el-switch v-model="propValue.stripe"></el-switch>
            </el-form-item>
            <el-form-item label="表头加粗">
                <el-switch v-model="propValue.thBold"></el-switch>
            </el-form-item>
        </el-form>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from '@/store'
import { storeToRefs } from 'pinia'
import CommonAttr from '@/custom-component/common/CommonAttr.vue'
import EditTable from './EditTable.vue'

const store = useStore()
const { curComponent } = storeToRefs(store)

const propValue = computed(() => curComponent.value.propValue)
</script>
