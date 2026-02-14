<template>
    <table class="v-table">
        <tbody>
            <tr
                v-for="(item, index) in propValue.data"
                :key="index"
                :class="{
                    stripe: propValue.stripe && index % 2,
                    bold: propValue.thBold && index === 0
                }"
            >
                <td v-for="(e, i) in item" :key="i">{{ e }}</td>
            </tr>
        </tbody>
    </table>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import request from '@/utils/request'
import { useOnEvent } from '../common/useOnEvent'

const props = defineProps({
    propValue: {
        type: Object,
        default: () => {},
    },
    request: {
        type: Object,
        default: () => {},
    },
    element: {
        type: Object,
        default: () => {},
    },
    linkage: {
        type: Object,
        default: () => {},
    },
})

let cancelRequest = null

useOnEvent(props)

onMounted(() => {
    if (props.request) {
        cancelRequest = request(props.request, props.propValue, 'data')
    }
})

onBeforeUnmount(() => {
    if (props.request && cancelRequest) {
        cancelRequest()
    }
})
</script>

<style lang="scss" scoped>
.v-table {
    border-collapse: collapse;
    table-layout: fixed;
    word-break: break-all;
    word-wrap: break-word;

    td {
        border: 1px solid #ebeef5;
        height: 40px;
        width: 60px;
        padding: 10px;
    }

    .bold {
        font-weight: bold;
    }

    .stripe {
        background-color: #fafafa;
    }
}
</style>
