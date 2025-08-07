import { createTheme } from '@mui/material/styles';

// ITDimenzion Theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#FF6B6B', // Coral Red - Primary brand color
      light: '#FF8E6B', // Lighter coral
      dark: '#E55A5A', // Darker coral
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FFA726', // Orange accent
      light: '#FFB74D',
      dark: '#FF9800',
      contrastText: '#ffffff',
    },
    error: {
      main: '#F44336',
      light: '#EF5350', 
      dark: '#C62828',
    },
    warning: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    info: {
      main: '#29B6F6',
      light: '#4FC3F7',
      dark: '#0288D1',
    },
    success: {
      main: '#66BB6A',
      light: '#81C784',
      dark: '#4CAF50',
    },
    background: {
      default: '#FF6B6B', // Will be overridden by CSS gradient
      paper: 'rgba(255, 255, 255, 0.95)', // Semi-transparent white for cards
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      fontWeight: 400,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.875rem',
    },
  },
  shape: {
    borderRadius: 16, // More rounded corners for modern look
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#ffffff',
          minHeight: '100vh',
        },
        // Clase para fondos degradados especiales (login, register)
        '.gradient-bg': {
          background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 50%, #FFA726 100%)',
          minHeight: '100vh',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `
              radial-gradient(circle at 20% 80%, rgba(255, 107, 107, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 142, 107, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(255, 167, 38, 0.2) 0%, transparent 50%)
            `,
            animation: 'float 20s ease-in-out infinite',
            zIndex: -1,
          },
          '@keyframes float': {
            '0%, 100%': {
              transform: 'translateY(0px) rotate(0deg)',
            },
            '33%': {
              transform: 'translateY(-20px) rotate(1deg)',
            },
            '66%': {
              transform: 'translateY(-10px) rotate(-1deg)',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 24px',
          fontSize: '0.875rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        contained: {
          background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)',
          boxShadow: '0 4px 16px rgba(255, 107, 107, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #E55A5A 0%, #E57A5A 100%)',
            boxShadow: '0 8px 24px rgba(255, 107, 107, 0.4)',
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderColor: '#FF6B6B',
          color: '#FF6B6B',
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
            background: 'rgba(255, 107, 107, 0.1)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
              boxShadow: '0 0 0 3px rgba(255, 107, 107, 0.3)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#FF6B6B',
                borderWidth: '1px',
              },
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)',
          boxShadow: '0 4px 20px rgba(255, 107, 107, 0.3)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(180deg, #FF6B6B 0%, #FF8E6B 100%)',
          color: 'white',
          borderRight: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '4px 8px',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 500,
        },
        colorPrimary: {
          background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)',
          color: 'white',
        },
      },
    },
  },
});

export default theme;