// style
import "./styles.css";
import 'primeicons/primeicons.css'
import { appWindow } from "@tauri-apps/api/window";
appWindow.theme().then(theme => {
    if (theme === null || theme === 'light') import("primevue/resources/themes/aura-light-blue/theme.css");
    else import("primevue/resources/themes/aura-dark-blue/theme.css");
});

// routing
import { createMemoryHistory, createRouter } from 'vue-router'
import routes from "./routes";
const router = createRouter({
    history: createMemoryHistory(),
    routes
});

// app
import { createApp } from "vue";
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import App from "./App.vue";
import "./global"
createApp(App).use(router).use(PrimeVue).use(ToastService).mount("#app");
