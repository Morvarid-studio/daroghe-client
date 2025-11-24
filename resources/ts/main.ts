import { createApp } from 'vue'

import App from '@/App.vue'
import { registerPlugins } from '@core/utils/plugins'
import '@fortawesome/fontawesome-free/css/all.css'

const link = document.createElement('link')
link.href = 'https://cdn.jsdelivr.net/gh/rastikerdar/b-nazanin-font@v1.0.4/dist/font-face.css'
link.rel = 'stylesheet'
document.head.appendChild(link)


// Styles
import '@core-scss/template/index.scss'
import '@styles/styles.scss'

// Create vue app
const app = createApp(App)

// Register plugins
registerPlugins(app)

// Mount vue app
app.mount('#app')
