<script setup lang="ts">
import ProgressSpinner from 'primevue/progressspinner';
import FileTree from '../components/FileTree.vue';
import ProgressBtn from '../components/ProgressBtn.vue';

import { Ref, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import { storage, askGemini } from '../global';

const loading: Ref<boolean> = ref(true);

const toast = useToast();
const router = useRouter();

async function ask() {
    storage.project.files = await askGemini({
        format: `
interface Node {
    name: string, 
    purpose: string, 
    children?: Node[]
        }`, 
        sysIns: `
        You are a computer science expert who is designing a project. 
        Host platform: ${storage.system.platform}; CPU architecture: ${storage.system.arch}. 
        Toolchains: ${storage.project.toolchain!}. 
        List the file structure of the project, with each file and directory explained. 
        Set filed "children" to an empty array if it's a directory; otherwise don't set the field at all. 
        `, 
        userIns: "Project Description: \n" + storage.project.desc!
    }, toast);
    loading.value = false;
}

function back() {
    storage.project.files = null;
    router.push('/install');
}

function next() {
    router.push('/name');
}

if (!storage.project.files) ask();
</script>
<template>
    <div class="container">
        <h1>Project Structure</h1>
        <ProgressSpinner v-if="loading" />
        <div v-if="!loading && storage.project.files">
            <div style="width: 60vw; margin: auto; padding-top: 1em;">
                <FileTree :tree-node="storage.project.files" />
            </div>
        </div>
    </div>
</template>
<style scoped>
</style>