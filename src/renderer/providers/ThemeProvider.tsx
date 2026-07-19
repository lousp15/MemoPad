import React, { useEffect } from 'react';
import {
  Experimental_CssVarsProvider as CssVarsProvider,
  extendTheme,
  useColorScheme,
} from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/zh-cn';
import { useConfigStore } from '../stores/configStore';

const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#1976d2' },
        background: { default: '#f5f5f5', paper: '#ffffff' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#90caf9' },
        background: { default: '#121212', paper: '#1e1e1e' },
      },
    },
  },
});

/** 内部组件：监听 config.theme 变化并调用 setMode */
function ThemeSync() {
  const themeMode = useConfigStore((s) => s.config.theme);
  const { setMode } = useColorScheme();

  useEffect(() => {
    setMode(themeMode);
  }, [themeMode, setMode]);

  return null;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <CssVarsProvider theme={theme} defaultMode="light">
      <ThemeSync />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="zh-cn">
        {children}
      </LocalizationProvider>
    </CssVarsProvider>
  );
}
