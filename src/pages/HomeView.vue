<script setup lang="ts">
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import ProjectCard from '../components/ProjectCard.vue';

import { RouterLink } from 'vue-router';
import { ComputedRef, computed, ref, Ref } from 'vue';

import { invoke } from '@tauri-apps/api';
import Database from "tauri-plugin-sql-api";
import Fuse from 'fuse.js';

interface Project {
  name: string,
  path: string,
  icon?: string,
  desc: string
}

const projects: Ref<Project[]> = ref([]);
const search_value = ref("");
const projects_shown: ComputedRef<Project[]> = computed(() => {
  if (search_value.value === '') return projects.value;
  const search = fuse.search(search_value.value);
  const result = [];
  for (let i = 0; i < search.length; ++i) result.push(search[i].item);
  return result;
});

const fuse = new Fuse(projects.value, {
  keys: ['name', 'path', 'desc']
});

async function open() {
  await invoke("open_file_dialog", {
    title: "Choose a Project Folder"
  });
}

Database.load("sqlite:projects.db").then(async db => {
  await db.execute(`
CREATE TABLE IF NOT EXISTS "projects" (
	"name"	TEXT NOT NULL,
	"path"	TEXT NOT NULL UNIQUE,
	"icon"	TEXT,
	"desc"	TEXT NOT NULL,
	PRIMARY KEY("path")
);`);
  projects.value = await db.select(`SELECT * FROM projects;`);
  await db.close();
});
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
        <ProjectCard :name="project.name" :path="project.path" :desc="project.desc" :icon="project.icon" />
      </template>
    </div>
  </div>
</template>

<style scoped></style>
