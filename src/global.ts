import { reactive } from "vue";
import API_KEYS from "./assets/api_keys.json"
import { arch, platform } from "@tauri-apps/api/os";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface Toolchain {
    tools: string,
    reason: string
};

export interface TreeNode {
    name: string,
    purpose: string,
    children?: TreeNode[]
};

export interface InstallInst {
    name: string,
    explanation: string,
    steps: string[],
    tests: string
};

export const storage = reactive({
    gemini: {
        api_keys: API_KEYS,
        gen_ai: new GoogleGenerativeAI(API_KEYS[0].key),
        model_name: 'gemini-1.5-pro-latest'
    },
    system: {
        arch: '',
        platform: ''
    },
    project: {
        desc: null as null | string,
        toolchains: [] as Toolchain[],
        toolchain: null as null | Toolchain,
        instructions: null as null | InstallInst[]
    }
});

arch().then(value => storage.system.arch = value);
platform().then(value => storage.system.platform = value);
