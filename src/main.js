
import { createApp } from 'vue';
import { createPinia } from 'pinia';

import Framework7 from 'framework7/lite-bundle';
import Framework7Vue, {
  registerComponents,
} from 'framework7-vue/bundle';

import 'framework7/css/bundle';
import 'framework7-icons/css/framework7-icons.css';
import './css/app.css';

import App from './App.vue';

Framework7.use(Framework7Vue);

const app = createApp(App);

// Підключаємо централізоване сховище Pinia
const pinia = createPinia();
app.use(pinia);

// Реєструємо компоненти Framework7
registerComponents(app);

app.mount('#app');