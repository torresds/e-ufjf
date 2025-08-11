import { createApp } from 'vue'
import App from './App.vue'
import Toast, { type PluginOptions } from "vue-toastification";

import "vue-toastification/dist/index.css";
import './assets/main.css'

const app = createApp(App)

const options: PluginOptions = {
    transition: "Vue-Toastification__bounce",
    maxToasts: 5,
    newestOnTop: true,
    position: "top-right",
    timeout: 4000,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: false,
    hideProgressBar: false,
    closeButton: "button",
    icon: true,
    rtl: false
};

app.use(Toast, options);

app.mount('#app')
