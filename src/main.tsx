import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'

registerSW({
  onNeedRefresh() {
    if (window.confirm('An update is ready. Reload Local PDF now?')) window.location.reload()
  }
})

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
