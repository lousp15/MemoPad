import React from 'react';
import {
  Experimental_CssVarsProvider as CssVarsProvider,
  extendTheme,
} from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/zh-cn';

const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#1976d2' },
        background: { default: '#f5f5f5', paper: '#ffffff' },
      },
    },
  },
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <CssVarsProvider theme={theme} defaultMode="light">
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="zh-cn">
        {children}
      </LocalizationProvider>
    </CssVarsProvider>
  );
}
