import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import { applyTheme, getInitialTheme } from './shared/lib/theme'
import './styles/tokens.css'
import './styles/base.css'

// Mavzuni render'dan oldin o'rnatamiz — "flash" bo'lmasligi uchun.
applyTheme(getInitialTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
