<script setup lang="ts">
import { Icon } from "@iconify/vue";
import Textarea from "primevue/textarea";
import Dialog from "primevue/dialog";
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { TreeNode } from "../global";

import { Ref, ref } from "vue";

import file_icon from "../assets/file-icon.json";

const props = defineProps({
    treeNode: {
        type: Object as ()=>TreeNode,
        required: true
    }
});

const state: Ref<boolean> = ref(true);
const show_dialog: Ref<boolean> = ref(false);
const icon = (()=>{
    const treeNode = props.treeNode;
    if (treeNode.children) return "flat-color-icons:folder";
    return file_icon[treeNode.name.substring(treeNode.name.lastIndexOf('.')+1)] || "file-icons:default";
})();

const name = ref('');
const desc = ref('');

function edit() {
    name.value = props.treeNode.name;
    desc.value = props.treeNode.purpose;
    show_dialog.value = true;
}

function save() {
    props.treeNode.name = name.value;
    props.treeNode.purpose = desc.value;
    show_dialog.value = false;
}
</script>
<template>
    <Dialog v-model:visible="show_dialog" modal header="Edit File/Folder" style="width: 25rem;">
        <div class="input-field">
            <label>Name</label>
            <InputText v-model="name" style="flex: auto;" autocomplete="off" />
        </div>
        <div class="input-field">
            <label>Description</label>
            <Textarea rows="3" cols="32" v-model="desc" class="no-scrollbar" />
        </div>
        <div class="dialog-buttons">
            <Button label="Cancel" severity="secondary" @click="show_dialog=false"></Button>
            <Button label="Save" @click="save"></Button>
        </div>
    </Dialog>
    <div style="text-align: left; display: flex; margin-top: 0.8em;">
        <Button v-if="treeNode.children" 
            style="height: 2em; width: 2em;"
            v-bind:icon="state ? 'pi pi-angle-down' : 'pi pi-angle-right'" 
            text rounded 
            @click="state = !state" />
        <span v-else style="padding-left: 2em;" />
        <Icon 
            :icon="icon" 
            width="1.8em" height="1.8em" />
        <span class="node-name">{{ treeNode.name }}</span>
        <Button
            style="height: 2em; width: 2em;"
            icon="pi pi-pencil" 
            @click="edit"
            text rounded />
        <Textarea v-model="props.treeNode.purpose"
            rows="1" cols="20"
            style="margin-left: 2em; "
            class="no-scrollbar" 
            disabled />
    </div>
    <div v-show="state">
        <div v-for="child in treeNode.children" style="padding-left: 6vw;">
            <FileTree :treeNode="child" />
        </div>
    </div>
</template>
<script lang="ts">
export default { name: "FileTree" };
</script>
<style scoped>
.node-name {
    padding-left: 0.5em;
    line-height: 2em;
}

.input-field {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1em;
}

.dialog-buttons {
    display: flex;
    justify-content: end;
    gap: 0.5rem;
}
</style>