import "@css/main.css";
import "@css/material/dark.css";
import "@css/material/light.css";

// Material Web Components
import "@material/web/icon/icon";
import "@material/web/button/filled-button";
import "@material/web/button/outlined-button";
import "@material/web/button/text-button";
import "@material/web/button/filled-tonal-button";
import "@material/web/slider/slider";
import "@material/web/chips/chip-set";
import "@material/web/chips/input-chip";
import "@material/web/chips/assist-chip";
import "@material/web/chips/filter-chip";
import "@material/web/textfield/filled-text-field";
import "@material/web/textfield/outlined-text-field";
import "@material/web/menu/menu";
import "@material/web/menu/menu-item";
import "@material/web/radio/radio";
import "@material/web/progress/linear-progress";

import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@/App.vue";
import router from "@ts/router";

import jQuery from "jquery";
Object.assign(window, { $: jQuery, jQuery });

// Internacionalización
import { createI18n } from "vue-i18n";
// Archivos de idioma
import es from "@/locales/es.json5";
import en from "@/locales/en.json5";

const messages = {
  "es-ES": es,
  es: es,
  "gl-ES": es,
  "en-US": en,
  en: en
};

const i18n = createI18n({
  locale: navigator.language,
  fallbackLocale: "en-US",
  messages: messages,
  legacy: false,
  globalInjection: true
});

const app = createApp(App);
app.use(router);
app.use(i18n);

// Set CORS header to allow worker to load OpenCV.js
const meta = document.createElement("meta");
meta.httpEquiv = "Content-Security-Policy";

const pinia = createPinia();
app.use(pinia);

app.mount("#app");
