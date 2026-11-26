
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import Framework7 from 'framework7/lite-bundle'
import Framework7Vue, {
  registerComponents
} from 'framework7-vue/bundle'

import 'framework7/css/bundle'
import 'framework7-icons/css/framework7-icons.css'
import './css/app.css'

import App from './App.vue'

import {
  initializePersistence
} from './services/persistence'

// Підключаємо Framework7
Framework7.use(Framework7Vue)

// Створюємо застосунок Vue
const app = createApp(App)

// Створюємо та підключаємо Pinia
const pinia = createPinia()
app.use(pinia)

// Реєструємо компоненти Framework7
registerComponents(app)

// Спочатку відновлюємо дані з IndexedDB,
// а потім запускаємо інтерфейс TaskFlow
async function bootstrap() {
  await initializePersistence(pinia)

  app.mount('#app')
}

// Запускаємо застосунок
bootstrap().catch((error) => {
  console.error(
    'TaskFlow: помилка запуску:',
    error
  )

  app.mount('#app')
})