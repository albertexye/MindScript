import { reactive } from "vue";
import { arch, platform } from "@tauri-apps/api/os";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fs, invoke } from "@tauri-apps/api";
import { BaseDirectory, readTextFile } from "@tauri-apps/api/fs";
import { ToastServiceMethods } from "primevue/toastservice";

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

export interface GeminiOptions {
    format: string;
    sysIns: string;
    userIns: string;
}

export const storage = reactive({
    gemini: {
        api_key: '',
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

export const createFile = async (path: string, data: Array<number>) => {
    const err: string = await invoke("create_file", {
        "path": path,
        "data": data
    });
    if (err != '') {
        return err;
    }
    return '';
};

export const askGemini = async (options: GeminiOptions, toast: ToastServiceMethods) => {
    const genAI = new GoogleGenerativeAI(storage.gemini.api_key);
    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-pro-latest',
        systemInstruction: {
            role: 'System',
            parts: [
                { text: "Output JSON only. Strictly follow the format: \n" + options.format.replace(/^ +/gm, '').replace(/(\r\n|\n|\r)/gm, "") },
                { text: options.sysIns.replace(/^ +/gm, '').replace(/(\r\n|\n|\r)/gm, "") }
            ]
        }
    });

    let result;
    try {
        result = await model.generateContent(options.userIns);
    } catch (e) {
        toast.add({
            severity: "error",
            summary: "Failed to Generate Answers",
            detail: e
        });
        return;
    }
    const text = result.response.text();

    const re = new RegExp("^```json\n.*?\n```", "mgsv");
    const match_result = text.match(re);
    if (match_result === null) {
        toast.add({
            severity: "error",
            summary: "Unexpected Answer from Gemini",
            detail: text
        });
        return;
    }

    const json = match_result[0].substring(8, match_result[0].length - 4);

    try {
        return JSON.parse(json);
    } catch {
        toast.add({
            severity: "error",
            summary: "Unexpected Answer from Gemini",
            detail: text
        });
        return;
    }
};

arch().then(value => storage.system.arch = value);
platform().then(value => storage.system.platform = value);

fs.exists('apiKey', { dir: BaseDirectory.App }).then(exists=>{
    if (!exists) return;
    readTextFile('apiKey', { dir: BaseDirectory.App }).then(value=>{
        storage.gemini.api_key = value;
    });
});
