<template>
    <v-chart 
        ref="chart" 
        class="chart" 
        :option="propValue.option"
        autoresize
    />
</template>

<script setup>
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { ScatterChart, BarChart, LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { useOnEvent } from '../common/useOnEvent'

use([
    CanvasRenderer,
    ScatterChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent,
    BarChart,
    LineChart,
])

const props = defineProps({
    propValue: {
        type: Object,
        require: true,
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

useOnEvent(props)
</script>

<style scoped>
.chart {
    height: 400px;
}
</style>
