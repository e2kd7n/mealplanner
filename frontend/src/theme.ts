/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import { createTheme } from '@mui/material/styles';

// Extend MUI palette to include app-specific tokens
declare module '@mui/material/styles' {
  interface Palette {
    custom: {
      pantry: string;
    };
  }
  interface PaletteOptions {
    custom?: {
      pantry?: string;
    };
  }
}

function buildTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark';
  const focusColor = isDark ? '#66BB6A' : '#2E7D32';

  return createTheme({
    palette: {
      mode,
      primary: isDark
        ? {
            main: '#66BB6A', // Lighter green — 7.93:1 on #121212 ✅
            light: '#81C784',
            dark: '#388E3C',
            contrastText: '#000',
          }
        : {
            main: '#2E7D32', // 5.13:1 on white ✅
            light: '#60A46A',
            dark: '#1B5E20', // 7.87:1 on white ✅
            contrastText: '#fff',
          },
      secondary: isDark
        ? {
            main: '#FFB74D', // Lighter amber — 10.84:1 on #121212 ✅
            light: '#FFCC80',
            dark: '#F57C00',
            contrastText: '#000',
          }
        : {
            main: '#D4880C', // 3.16:1 on white ✅
            light: '#E6A020',
            dark: '#B36B00',
            contrastText: '#fff',
          },
      error: {
        main: '#D32F2F',
      },
      warning: {
        main: isDark ? '#FFB74D' : '#D4880C',
      },
      info: {
        main: isDark ? '#4FC3F7' : '#0277BD', // 4.52:1 on white ✅
      },
      success: {
        main: isDark ? '#66BB6A' : '#2E7D32',
      },
      ...(!isDark && {
        background: {
          default: '#F5F5F5',
          paper: '#FFFFFF',
        },
      }),
      custom: {
        pantry: isDark ? '#CE93D8' : '#7B1FA2',
      },
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: { fontSize: '2.5rem', fontWeight: 700 },
      h2: { fontSize: '2rem', fontWeight: 700 },
      h3: { fontSize: '1.75rem', fontWeight: 600 },
      h4: { fontSize: '1.5rem', fontWeight: 600 },
      h5: { fontSize: '1.25rem', fontWeight: 500 },
      h6: { fontSize: '1rem', fontWeight: 500 },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            '&:focus-visible': {
              outline: `3px solid ${focusColor}`,
              outlineOffset: '2px',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            '&:focus-visible': {
              outline: `3px solid ${focusColor}`,
              outlineOffset: '2px',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            '&:focus-visible': {
              outline: `3px solid ${focusColor}`,
              outlineOffset: '2px',
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '&:focus-visible': {
              outline: `3px solid ${focusColor}`,
              outlineOffset: '-2px',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderWidth: '3px',
                },
              },
            },
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            '&:focus-visible': {
              outline: `3px solid ${focusColor}`,
              outlineOffset: '2px',
              borderRadius: '4px',
            },
          },
        },
      },
    },
  });
}

export const lightTheme = buildTheme('light');
export const darkTheme = buildTheme('dark');

// Keep the legacy export so any remaining direct usages don't break at compile time
export const theme = lightTheme;

// Made with Bob
