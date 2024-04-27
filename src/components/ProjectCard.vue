<script setup lang="ts">
import Card from 'primevue/card';
import DOMPurify from "isomorphic-dompurify";

defineProps({
    name: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: false
    },
    desc: {
        type: String,
        required: true
    }
});
</script>

<template>
<RouterLink :to="`/project/${encodeURIComponent(path)}`">
    <Card class="card">
        <template #header v-if="icon" v-html="DOMPurify.sanitize(icon)" />
        <template #title>{{ name }}</template>
        <template #subtitle>{{ path }}</template>
        <template #content v-if="desc">
            <p class="m-0">{{ desc }}</p>
        </template>
  </Card>
</RouterLink>
</template>

<style scoped>
.card {
    user-select: none;
    cursor: pointer; 
    width: 35vw;
    overflow: hidden;
    display: inline-block;
    margin-left: 3vw;
    margin-right: 3vw;
    margin-top: 1em;
    margin-bottom: 1em;
    text-align: center;
}
</style>
