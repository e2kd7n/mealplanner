/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { logContrastResults } from './utils/contrastChecker'

// Log WCAG contrast verification in development
if (import.meta.env.DEV) {
  logContrastResults();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
