import React from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from './providers/ThemeProvider';
import { AppShell } from './components/layout/AppShell';

export default function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <AppShell />
    </ThemeProvider>
  );
}
