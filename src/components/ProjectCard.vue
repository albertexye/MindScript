<script setup lang="ts">
import Card from 'primevue/card';
import { ref } from 'vue';

const props = defineProps({
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

const b64toBlob = (b64Data: string, sliceSize=512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
    
  const blob = new Blob(byteArrays);
  return blob;
}

const iconURL = ref(props.icon ? window.URL.createObjectURL(b64toBlob(props.icon)) : '');
</script>

<template>
<RouterLink :to="`/project/${encodeURIComponent(path)}`">
    <Card class="card">
        <template #header v-if="icon">
            <img :src="iconURL" style="max-width: 30vw; max-height: 10vh;">
        </template>
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
