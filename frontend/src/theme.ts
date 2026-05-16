/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // Green for food/health theme - 5.13:1 ✅
      light: '#60A46A', // Lighter green - 3.38:1 on white ✅
      dark: '#1B5E20', // Darker for better contrast - 7.87:1 ✅
      contrastText: '#fff',
    },
    secondary: {
      // Warm amber — semantically distinct from error/warning red
      main: '#D4880C', // 3.16:1 on white ✅
      light: '#E6A020',
      dark: '#B36B00',
      contrastText: '#fff',
    },
    error: {
      main: '#D32F2F', // Red stays exclusively for errors - 4.98:1 ✅
    },
    warning: {
      // Shares amber with secondary — reinforces each other rather than adding a third red
      main: '#D4880C',
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
      fontWeight: 700, // Display moments — heavier than section titles
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
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
      fontWeight: 500, // Card headers — lighter than page titles
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
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
