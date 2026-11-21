import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ResourceBoundary } from './components/ResourceBoundary'
import './styles.css'
import './readability.css'
import './search.css'
import './hero-title.css'
import './navigation-theme.css'
import './audio.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ResourceBoundary><App /></ResourceBoundary>
  </StrictMode>,
)
