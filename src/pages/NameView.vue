<script setup lang="ts">
import InputText from 'primevue/inputtext';
import ProgressBtn from '../components/ProgressBtn.vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import FloatLabel from 'primevue/floatlabel';

import { TreeNode, createFile, askGemini, readFile, storage } from '../global';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import { invoke, path } from '@tauri-apps/api';
import Database from 'tauri-plugin-sql-api';

const nameLoading = ref(false);
const iconLoading = ref(false);
const uploadLoading = ref(false);
const nameInvalid = ref(false);
const locationInvalid = ref(false);
const icon = ref('');

const toast = useToast();
const router = useRouter();

async function generateName() {
    nameLoading.value = true;
    const result = await askGemini({
        format: `
        interface Name {
            name: string;
        }`, 
        sysIns: `
            You are a computer science expert who is giving a name to a project based on the description. 
            Only output the name of the project.
        `, 
        userIns: "Project Description: \n" + storage.project.desc
    }, toast);
    storage.project.name = result.name;
    nameLoading.value = false;
}

async function generateIcon() {
    iconLoading.value = true;
    const result = await askGemini({
        format: `
        interface Name {
            iconLink: string;
        }`, 
        sysIns: `
        You are a computer science expert who is giving an icon to a project based on the description provided by the user. 
        Only output a link to the icon without any HTML or explanation. 
        `, 
        userIns: "Project Description: \n" + storage.project.desc
    }, toast);
    let img;
    try {
        img = await fetch(result.iconLink);
    } catch (e) {
        toast.add({
            severity: "error",
            summary: "Internal Error",
            detail: e
        });
        return;
    }
    storage.project.icon = await img.blob();
    icon.value = window.URL.createObjectURL(storage.project.icon);
    iconLoading.value = false;
}

async function upload() {
    const file: string = await invoke("open_file_dialog", {
        title: "Choose an Icon",
        filterName: "image/*",
        ext: ["jpg", "jpeg", "png", "webp", "svg"]
    });
    const data = await readFile(file);
    if (data instanceof String) {
        toast.add({
            severity: "error",
            summary: "Error Reading File",
            detail: data
        });
        return;
    }
    const blob = new Blob([data]);
    icon.value = window.URL.createObjectURL(blob);
    storage.project.icon = blob;
}

async function chooseFolder() {
    storage.project.location = await invoke("open_folder_dialog", {
        title: "Choose a Location"
    });
}

function back() {
    storage.project.name = null;
    storage.project.icon = null;
    storage.project.location = null;
    router.push('/structure');
}

async function blobToBase64(blob: Blob) {
    const reader = new FileReader();
    return new Promise((resolve, _) => {
        reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.substring(result.indexOf(',')+1));
        };
        reader.readAsDataURL(blob);
    });
}

async function createSourceFile(node: TreeNode, dir: string[]) {
    let e: string = '';
    dir.push(node.name);
    if (node.children) {
        for (const child of node.children) {
            e = await createSourceFile(child, dir);
            if (e) return e;
        }
    } else {
        e = await createFile(await path.join(...dir), []);
    }
    dir.pop();
    return e;
}

async function createProject() {
    const db = await Database.load("sqlite:projects.db");
    await db.execute(`INSERT INTO projects (name, path, icon, desc) VALUES($1, $2, $3, $4)`,
        [storage.project.name, await path.join(storage.project.location!, storage.project.name!), await blobToBase64(storage.project.icon!), storage.project.desc]);
    await db.close();

    const projectBase = await path.join(storage.project.location!, storage.project.name!);

    // .mindscript/config.json
    const config = JSON.stringify({
        name: storage.project.name,
        desc: storage.project.desc,
        tool: storage.project.toolchain!.tools,
        structure: storage.project.files!
    });
    const data = Array.from(config).map(letter => letter.charCodeAt(0));
    let e = await createFile(await path.join(projectBase, ".mindscript", "config.json"), data);
    if (e) {
        toast.add({
            severity: "error",
            summary: "Error Creating Project Files",
            detail: e
        });
        return false;
    }

    // .mindscript/icon
    const iconData: number[] = [...(new Uint8Array(await storage.project.icon!.arrayBuffer()))];
    e = await createFile(await path.join(projectBase, ".mindscript", "icon"), iconData);
    if (e) {
        toast.add({
            severity: "error",
            summary: "Error Creating Project Files",
            detail: e
        });
        return false;
    }

    // source files
    e = await createSourceFile(storage.project.files!, [projectBase]);
    if (e) {
        toast.add({
            severity: "error",
            summary: "Error Creating Project Files",
            detail: e
        });
        return false;
    }

    return true;
}

async function next() {
    let invalid = false;
    if (!storage.project.name) {
        invalid = true;
        nameInvalid.value = true;
        setInterval(() => nameInvalid.value = false, 1000);
    }
    if (!storage.project.location) {
        invalid = true;
        locationInvalid.value = true;
        setInterval(() => locationInvalid.value = false, 1000);
    } else if (!(await invoke("folder_exists", { "path": storage.project.location }))) {
        invalid = true;
        locationInvalid.value = true;
        setInterval(() => locationInvalid.value = false, 1000);
    }
    if (invalid) return;
    if (!await createProject()) return;
    router.push('/project/' + encodeURIComponent(storage.project.location!))
}
</script>
<template>
    <div class="container">
        <h1>Name & Icon</h1>
        <Card style="width: 20rem; margin: auto;">
            <template #header>
                <div style="margin: auto;">
                    <img v-if="icon" :src="icon" style="max-width: 15rem; max-height: 12rem;" alt="cover">
                    <span v-else class="pi pi-image" style="font-size: 10rem;" />
                </div>
                <div style="display: flex; margin: auto; width: 8rem; justify-content: space-between;">
                    <Button icon="pi pi-upload" @click="upload" :loading="uploadLoading" text rounded />
                    <Button icon="pi pi-lightbulb" @click="generateIcon" :loading="iconLoading" text rounded />
                </div>
            </template>
            <template #footer>
                <div style="display: flex;">
                    <FloatLabel>
                        <InputText v-model="storage.project.name" :invalid="nameInvalid" />
                        <label>Name</label>
                    </FloatLabel>
                    <Button icon="pi pi-lightbulb" @click="generateName" :loading="nameLoading" text rounded />
                </div>
                <div style="display: flex; margin-top: 5vh;">
                    <FloatLabel>
                        <InputText v-model="storage.project.location" :invalid="locationInvalid" />
                        <label>Location</label>
                    </FloatLabel>
                    <Button icon="pi pi-folder" @click="chooseFolder" text rounded />
                </div>
            </template>
        </Card>
        <ProgressBtn :back="back" :next="next" />
    </div>
</template>