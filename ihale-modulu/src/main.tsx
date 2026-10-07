import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { Splash } from './components/Splash'
import { initPalette } from './components/ChartPalette'

initPalette()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Splash />
  </StrictMode>,
)
