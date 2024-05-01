import { reactive } from "vue";
import { arch, platform } from "@tauri-apps/api/os";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface Toolchain {
    tools: string;
    reason: string;
};

export interface TreeNode {
    name: string;
    purpose: string;
    children?: TreeNode[];
};

export interface InstallInst {
    name: string;
    explanation: string;
    steps: string[];
    tests: string;
};

export const storage = reactive({
    gemini: {
        api_keys: API_KEYS,
        gen_ai: new GoogleGenerativeAI(API_KEYS[0].key),
        model_name: 'gemini-1.5-pro-latest'
    },
    system: {
        arch: 'unknown',
        platform: 'unknown'
    },
    project: {
        name: null as null | string,
        desc: null as null | string,
        icon: null as null | Blob,
        toolchains: null as null | Toolchain[],
        toolchain: null as null | Toolchain,
        instructions: null as null | InstallInst[],
        files: null as null | TreeNode,
        location: null as null | string
    }
});

export const readFile = async (path: string) => {
    const [err, data]: [string, Array<number>] = await invoke("read_file", {
        "path": path
    });
    if (err != '') {
        return err;
    }
    return new Uint8Array(data);
};

arch().then(value => storage.system.arch = value);
platform().then(value => storage.system.platform = value);

fs.exists('apiKey', { dir: BaseDirectory.App }).then(exists=>{
    if (!exists) return;
    readTextFile('apiKey', { dir: BaseDirectory.App }).then(value=>{
        storage.gemini.api_key = value;
    });
});
