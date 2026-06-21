import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Toaster } from 'sonner';
import './index.css';
import App from './App.tsx';
import { appTheme } from './theme.ts';
import { AuthProvider } from './auth/AuthContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { GlobalErrorHandler } from './components/GlobalErrorHandler.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={appTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <ErrorBoundary>
          <BrowserRouter>
            <AuthProvider>
              <GlobalErrorHandler />
              <App />
              <Toaster
                position="top-right"
                richColors
                closeButton={false}
                toastOptions={{ duration: 0 }}
              />
            </AuthProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </LocalizationProvider>
    </ThemeProvider>
  </StrictMode>,
);
