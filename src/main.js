import './assets/css/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import ui from '@nuxt/ui/vue-plugin'
import AppRoot from './AppRoot.vue'
import App from './App.vue'
import SurveyView from './views/SurveyView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: App },
    { path: '/survey/:token', component: SurveyView },
  ],
})

const app = createApp(AppRoot)
app.use(createPinia())
app.use(router)
app.use(ui)
app.mount('#app')
