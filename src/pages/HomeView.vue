<script setup lang="ts">
import { ComputedRef, computed, ref } from 'vue';
import Fuse from 'fuse.js';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { RouterLink } from 'vue-router';

import ProjectCard from '../components/ProjectCard.vue';

import projects from "../assets/projects.json";
import { invoke } from '@tauri-apps/api';

interface Project {
  name: string,
  path: string,
  image: string,
  desc: string
}

const search_value = ref("");

const fuse = new Fuse(projects, {
  keys: ['name', 'path', 'desc']
});

const projects_shown: ComputedRef<Project[]> = computed(() => {
  if (search_value.value === '') return projects;
  const search = fuse.search(search_value.value);
  const result = [];
  for (let i = 0; i < search.length; ++i) result.push(search[i].item);
  return result;
});

async function open() {
  const folder = await invoke("open_file_dialog", {
    title: "Choose a Project Folder"
  });
}
</script>

<template>
  <div class="container">
    <h1>Welcome to MindScript</h1>
    <div style="margin-top: 2em;">
      <FloatLabel style="display: inline-block;">
        <InputText id="project-name" style="width: 25vw;" v-model="search_value" />
        <label for="project-name">Search Project</label>
      </FloatLabel>
      <Button icon="pi pi-folder" style="margin-left: 0.5em;" aria-label="Open Project" @click="open" />
      <RouterLink to="/describe">
        <Button icon="pi pi-plus" style="margin-left: 0.5em;" aria-label="New Project" />
      </RouterLink>
    </div>
    <div style="margin: auto; width: 82vw; margin-top: 2em;">
      <template v-for="project in projects_shown">
        <ProjectCard :name="project.name" :path="project.path" :desc="project.desc" :image="project.image">
        </ProjectCard>
      </template>
    </div>
  </div>
</template>

<style scoped></style>
