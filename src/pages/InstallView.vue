<script setup lang="ts">
import ProgressSpinner from 'primevue/progressspinner';
import Accordion from 'primevue/accordion';
import AccordionTab from 'primevue/accordiontab';
import Stepper from 'primevue/stepper';
import StepperPanel from 'primevue/stepperpanel';
import Button from 'primevue/button';
import ProgressBtn from '../components/ProgressBtn.vue';

import { marked } from 'marked';
import DOMPurify from "isomorphic-dompurify";

import { Ref, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import { storage } from '../global';
import { invoke } from '@tauri-apps/api';

const loading = ref(true);
const testing: Ref<number[]> = ref([]);
const failing: Ref<number[]> = ref([]);

const toast = useToast();
const router = useRouter();
const model = storage.gemini.gen_ai.getGenerativeModel({
    model: storage.gemini.model_name,
    systemInstruction: {
        role: 'System',
        parts: [
            {
                text: `
You are a computer science expert who is giving instructions to install and setup a tool. 
Host platform: ${storage.system.platform}; CPU architecture: ${storage.system.arch}. 
Given the toolchains, using JSON format only, tell what each tool is and how to install it step by step, and write a shell script (the language depends on the default shell of the host) to test if the tool is ready to use. 
Strictly follow the format: 
[{"name":"tool 1", "explanation":"what the tool is ...", "steps":["first, ...", "second, ..."], "tests":"ls -a"}]. 
If no tests are needed, set "tests" field to an empty string. 
Use MarkDown for strings in "steps" field. 
`.replace('\n', '')
            }
        ]
    }
})!;

async function ask(toolchains: string) {
    let result;
    const re = new RegExp("^```json\n.*?\n```", "mgsv");
    try {
        result = await model.generateContent("Toolchains: \n" + toolchains);
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
    storage.project.instructions = JSON.parse(json);
    loading.value = false;
}

async function test(script: string, index: number) {
    testing.value.push(index);
    try {
        const [code, message] = (await invoke('exec_cmd', { cmd: script })) as [number, string];
        if (code !== 0) {
            testing.value.splice(testing.value.indexOf(index), 1);
            failing.value.push(index);
            setTimeout(() => failing.value.splice(failing.value.indexOf(index), 1), 3000);
            toast.add({
                severity: 'error',
                summary: `Test Failed (${code})`,
                detail: message
            });
            return;
        }
        testing.value.splice(testing.value.indexOf(index), 1);
        toast.add({
            severity: 'success',
            summary: 'Test Passed'
        });
    } catch (e) {
        toast.add({
            severity: 'error',
            summary: `Test Failed`,
            detail: e
        });
    }
}

function back() {
    storage.project.instructions = null;
    router.push('/describe');
}

function next() {
    router.push('/structure');
}

if (!storage.project.instructions) ask(storage.project.toolchain!.tools);
</script>
<template>
    <div class="container">
        <h1>{{ storage.project.toolchain!.tools }}</h1>
        <ProgressSpinner v-if="loading" />
        <Accordion v-if="!loading" style="width: 50vw; margin: auto;">
            <template v-for="(instruction, i_index) in storage.project.instructions">
                <AccordionTab :header="instruction.name">
                    <p style="margin: 0;">{{ instruction.explanation }}</p>
                    <Stepper>
                        <template v-if="instruction.steps.length !== 1" v-for="(step, s_index) in instruction.steps">
                            <StepperPanel>
                                <template #content="{ prevCallback, nextCallback }">
                                    <div><span v-html="DOMPurify.sanitize(marked.parse(step).toString())"></span></div>
                                    <div v-if="s_index === 0" class="button-start">
                                        <Button label="Next" icon="pi pi-arrow-right" icon-pos="right"
                                            @click="nextCallback" />
                                    </div>
                                    <div v-else-if="s_index === instruction.steps.length - 1" class="button-between">
                                        <Button severity="secondary" label="Back" icon="pi pi-arrow-left"
                                            icon-pos="left" @click="prevCallback" />
                                        <Button label="Test" icon="pi pi-check-circle" icon-pos="right"
                                            :loading="i_index in testing" @click="test(instruction.tests, i_index)" />
                                    </div>
                                    <div v-else class="button-between">
                                        <Button severity="secondary" label="Back" icon="pi pi-arrow-left"
                                            icon-pos="left" @click="prevCallback" />
                                        <Button label="Next" icon="pi pi-arrow-right" icon-pos="right"
                                            @click="nextCallback" />
                                    </div>
                                </template>
                            </StepperPanel>
                        </template>
                        <StepperPanel v-else>
                            <div><span v-html="marked.parse(instruction.steps[0])"></span></div>
                            <dib class="button-start">
                                <Button label="Test" icon="pi pi-check-circle" icon-pos="right"
                                            :loading="i_index in testing" @click="test(instruction.tests, i_index)" />
                            </dib>
                        </StepperPanel>
                    </Stepper>
                </AccordionTab>
            </template>
        </Accordion>
        <ProgressBtn :back="back" :next="next" />
    </div>
</template>
<style scoped>
.button-between {
    display: flex;
    justify-content: space-between;
}

.button-start {
    display: flex;
    justify-content: end;
}

.button-end {
    display: flex;
    justify-content: start;
}
</style>