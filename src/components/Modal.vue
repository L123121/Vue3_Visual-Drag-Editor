<template>
    <div v-if="modelValue" class="modal-bg" @click="hide">
        <div class="fadeInLeft animated modal" @click="stopPropagation">
            <slot></slot>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false,
    }
})

const emit = defineEmits(['update:modelValue'])

function hide() {
    emit('update:modelValue', false)
}

function stopPropagation(e) {
    e.stopPropagation()
}
</script>

<style lang="scss" scoped>
.modal-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, .5);
    z-index: 1001;

    .modal {
        width: 400px;
        background: var(--main-bg-color);
        height: 100%;
    }
}
</style>
