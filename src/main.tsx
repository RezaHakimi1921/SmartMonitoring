import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { GlobalStyles } from '@mui/material'
import { CssBaseline, ThemeProvider } from '@smartx/design-system'
import App from './App'
import './styles/app.css'

/** DS custom typography variants render as span by default — force block stacking. */
const typographyBlockStyles = {
  '[class*="MuiTypography-title"], [class*="MuiTypography-body"], [class*="MuiTypography-headline"], [class*="MuiTypography-label"], [class*="MuiTypography-display"]':
    {
      display: 'block',
    },
}

function Root() {
  useEffect(() => {
    document.documentElement.dir = 'rtl'
    document.body.dir = 'rtl'
    document.documentElement.style.direction = 'rtl'
    document.body.style.direction = 'rtl'
    document.documentElement.lang = 'fa'
  }, [])

  return (
    <ThemeProvider defaultMode="light" defaultDirection="rtl">
      <CssBaseline />
      <GlobalStyles styles={typographyBlockStyles} />
      <App />
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
