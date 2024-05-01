<script setup lang="ts">
import Textarea from 'primevue/textarea';
import Accordion from 'primevue/accordion';
import AccordionTab from 'primevue/accordiontab';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Transition from 'vue';
import ProgressBtn from '../components/ProgressBtn.vue';

import { useToast } from "primevue/usetoast";
import { useRouter } from 'vue-router';
import { ref } from 'vue';

import { storage, Toolchain, askGemini } from "../global";

const toast = useToast();
const router = useRouter();

interface ToolchainResp {
    state: "ok" | "info required";
    toolchains?: Toolchain[];
    reason?: string;
}

const described = ref(storage.project.toolchains !== null);
const loading = ref(false);
const invalid = ref(false);

async function get_toolchain() {
    storage.project.toolchain = null;
    loading.value = true;
    const resp: ToolchainResp = await askGemini({
        format: `
        interface Toolchain {
            tools: string;
            reason: string;
        }
        interface Toolchains {
            state: "ok" | "info required";
            toolchains?: Toolchain[];
            reason?: string;
        }`, 
        sysIns: `
        You are a computer science expert who is giving solutions to build a project. 
        Host platform: ${storage.system.platform}; CPU architecture: ${storage.system.arch}. 
        Tell what toolchains to use and why. 
        Give multiple options if possible. 
        Don't include the editor/IDE unless it's necessary. 
        The field "state" is "ok" unless more information is needed to decide what tools to use. 
        In this case, the field "state" is "info required" and a reason should be given. 
        `, 
        userIns: "Project Description: \n" + storage.project.desc!
    }, toast);
    if (resp.state === 'ok' && resp.toolchains) {
        described.value = true;
        storage.project.toolchains = resp.toolchains;
    } else if (resp.state === 'info required') {
        if (resp.reason === null) {
            toast.add({
                severity: "error",
                summary: "Unexpected Answer from Gemini",
                detail: "Missing reasons for info request"
            });
        } else {
            toast.add({
                severity: "warn",
                summary: "More Information is Required",
                detail: resp.reason
            });
            described.value = false;
        }
    } else {
        toast.add({
            severity: "error",
            summary: "Unexpected Answer from Gemini",
            detail: "Invalid response state"
        });
    }
    loading.value = false;
}

const back = () => {
    storage.project.toolchains = null;
    storage.project.toolchain = null;
    if (!described.value) {
        storage.project.desc = '';
        router.push('/');
    }
    else {
        described.value = false;
    }
}
const next = () => {
    if (!described.value) {
        if (storage.project.desc === '') {
            toast.add({
                severity: "warn",
                summary: "Please Provide a Description",
                life: 3000
            });
            invalid.value = true;
            setTimeout(() => invalid.value = false, 1000);
            return;
        }
        get_toolchain();
    } else {
        if (storage.project.toolchain === null) {
            toast.add({
                severity: "warn",
                summary: "Please Choose a Solution",
                life: 3000
            });
            return;
        }
        router.push('/install');
    }
}
</script>
<template>
    <div class="container">
        <h1>Describe Your Project</h1>
        <Textarea v-model="storage.project.desc" rows="10" cols="35" :disabled="described" :invalid="invalid" />
        <br>
        <Transition name="fade">
            <Card v-show="described" style="display: inline-block; margin-top: 2em;">
                <template #title>Solutions</template>
                <template #content>
                    <Accordion :multiple="true" style="width: 25em;">
                        <template v-for="solution in storage.project.toolchains">
                            <AccordionTab :header="solution.tools">
                                <p class="m-0">{{ solution.reason }}</p>
                                <Button style="margin-top: 1em;" severity="success"
                                    :label="storage.project.toolchain?.tools === solution.tools ? 'Chosen' : 'Go with it!'"
                                    @click="storage.project.toolchain = solution" 
                                    :disabled="storage.project.toolchain?.tools === solution.tools" />
                                <hr>
                            </AccordionTab>
                        </template>
                    </Accordion>
                </template>
                <template #footer>
                    <Button label="Other Solutions!" @click="get_toolchain" :loading="loading"></Button>
                </template>
            </Card>
        </Transition>
        <ProgressBtn :back="back" :next="next" :loading="loading" />
    </div>
</template>
<style scoped>
.m-0 {
    margin: 0;
}
</style>