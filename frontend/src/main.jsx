import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'

import './index.css'

import theme from './theme'
import { AuthProvider } from './contexts/AuthContext'
import { RealtimeProvider } from './contexts/RealtimeContext'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter basename="/control-acceso">
       <AuthProvider>
         <RealtimeProvider>
         <App />
          </RealtimeProvider>
         </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
)