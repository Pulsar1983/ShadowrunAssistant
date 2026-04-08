import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadAppConfig } from './config'

const root = createRoot(document.getElementById('root')!)

const renderApp = () => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void loadAppConfig()
  .catch((error) => {
    console.error('Failed to load app config.', error)
  })
  .finally(() => {
    renderApp()
  })
