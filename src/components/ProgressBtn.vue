<script setup lang="ts">
import Button from 'primevue/button';

defineProps(['back', 'next', 'loading'])
</script>
<template>
    <div class="button-between" style="padding-top: 2em; width: 25em; margin: auto;">
        <Button severity="secondary" icon="pi pi-angle-left" label="Back" @click="back" icon-pos="left" />
        <Button icon="pi pi-angle-right" label="Next" :loading="loading" @click="next" icon-pos="right" />
    </div>
</template>
<style scoped>
.button-between {
    display: flex;
    justify-content: space-between;
    padding-top: 2em;
    width: 25em;
    margin: auto;
}
</style>