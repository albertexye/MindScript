<script setup lang="ts">
import ProgressSpinner from 'primevue/progressspinner';
import FileTree from '../components/FileTree.vue';
import ProgressBtn from '../components/ProgressBtn.vue';

import { Ref, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import { storage } from '../global';

const loading: Ref<boolean> = ref(true);

const toast = useToast();
const router = useRouter();
const model = storage.gemini.gen_ai.getGenerativeModel({
    model: storage.gemini.model_name,
    systemInstruction: {
        role: 'System',
        parts: [
            {
                text: `
You are a computer science expert who is designing a project. 
Host platform: ${storage.system.platform}; CPU architecture: ${storage.system.arch}. 
Toolchains: ${storage.project.toolchain!}. 
Using JSON format only, list the file structure of the project, with each file and directory explained. 
Strictly follow the format: 
interface Node {
    name: string, 
    purpose: string, 
    children?: Node[]
}. 
`.replace('\n', '')
            }
        ]
    }
})!;

async function ask() {
    let result;
    const re = new RegExp("^```json\n.*?\n```", "mgsv");
    try {
        result = await model.generateContent("Project Description: \n" + storage.project.desc!);
    } catch (e) {
        toast.add({
            severity: "error",
            summary: "Internal Error",
            detail: e
        });
        return;
    }
    const text = result.response.text();
    const match_result = text.match(re);
    if (match_result == null) {
        toast.add({
            severity: "error",
            summary: "Internal Error",
            detail: text
        });
        return;
    }
    const json = match_result[0].substring(8, match_result[0].length - 4);
    storage.project.files = JSON.parse(json);
    loading.value = false;
}

function back() {
    storage.project.files = null;
    router.push('/install');
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
    <ProgressBtn :back="back" />
</template>
<style scoped>
</style>