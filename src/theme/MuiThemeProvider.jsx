import { useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { createMuiTheme } from './muiTheme';

/**
 * MUI ThemeProvider wrapper that integrates with custom ThemeContext
 * Provides MUI theme based on dark/light mode from custom ThemeContext
 */
export const MuiThemeProviderWrapper = ({ children }) => {
  const { isDark } = useTheme();
  
  // Create MUI theme based on current mode
  const muiTheme = useMemo(() => createMuiTheme(isDark), [isDark]);
  
  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};
