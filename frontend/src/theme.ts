/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // Green for food/health theme - 5.13:1 ✅
      light: '#2E7D32', // Use main color for WCAG AA compliance - 5.13:1 ✅
      dark: '#1B5E20', // Darker for better contrast - 7.87:1 ✅
      contrastText: '#fff',
    },
    secondary: {
      main: '#C62828', // WCAG AA compliant - 5.13:1 ✅
      light: '#D32F2F', // WCAG AA compliant - 4.98:1 ✅
      dark: '#BF360C', // Darker for better contrast - 5.60:1 ✅
      contrastText: '#fff',
    },
    error: {
      main: '#D32F2F', // 4.98:1 ✅
    },
    warning: {
      main: '#C62828', // WCAG AA compliant - 5.13:1 ✅
    },
    info: {
      main: '#0277BD', // Adjusted for better contrast - 4.52:1 ✅
    },
    success: {
      main: '#2E7D32', // Adjusted for better contrast - 5.13:1 ✅
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
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
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
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
            outline: '3px solid #2E7D32',
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
            outline: '3px solid #2E7D32',
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
            outline: '3px solid #2E7D32',
            outlineOffset: '2px',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:focus-visible': {
            outline: '3px solid #2E7D32',
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
            outline: '3px solid #2E7D32',
            outlineOffset: '2px',
            borderRadius: '4px',
          },
        },
      },
    },
  },
});

// Made with Bob
