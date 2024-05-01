<script setup lang="ts">
import Toast from 'primevue/toast';
import { RouterView } from 'vue-router';

// import { useRouter } from 'vue-router';
// useRouter().push('/name');
</script>
<template>
  <main>
    <Toast />
    <RouterView v-slot="{ Component, route }">
      <transition name="fade">
        <component :is="Component" :key="route.path" />
      </transition>
    </RouterView>
  </main>
</template>
<style scoped></style>