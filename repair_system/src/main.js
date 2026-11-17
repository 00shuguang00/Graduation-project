import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import axios from 'axios'

axios.interceptors.response.use(
  (res) => {
    if (res.data.status !== 200) {
      return Promise.reject(new Error(res.data.error || '请求失败'))
    }
    return res
  },
  (err) => Promise.reject(err)
)

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
