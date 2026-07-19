import React from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from './providers/ThemeProvider';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <CssBaseline />
        <AppShell />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
