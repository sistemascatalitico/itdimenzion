import { createTheme } from '@mui/material/styles';

// Paleta de colores segura y profesional
const secureTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Azul corporativo
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e', // Rojo para alertas de seguridad
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2e7d32', // Verde para confirmaciones
      light: '#4caf50',
      dark: '#1b5e20',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ed6c02', // Naranja para advertencias
      light: '#ff9800',
      dark: '#e65100',
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f', // Rojo para errores
      light: '#ef5350',
      dark: '#c62828',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
      fontSize: '2rem',
    },
    h2: {
      fontWeight: 500,
      fontSize: '1.75rem',
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.5rem',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.1rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    button: {
      textTransform: 'none', // Evitar texto en mayúsculas automático
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    // Configuración de seguridad para componentes
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
        autoComplete: 'off', // Deshabilitar autocompletado por defecto
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: '#1976d2',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1976d2',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 20px',
          fontWeight: 500,
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          },
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12,
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
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
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '& .MuiAlert-icon': {
            fontSize: '1.2rem',
          },
        },
        standardError: {
          backgroundColor: '#ffebee',
          color: '#c62828',
          '& .MuiAlert-icon': {
            color: '#c62828',
          },
        },
        standardWarning: {
          backgroundColor: '#fff3e0',
          color: '#e65100',
          '& .MuiAlert-icon': {
            color: '#e65100',
          },
        },
        standardSuccess: {
          backgroundColor: '#e8f5e8',
          color: '#1b5e20',
          '& .MuiAlert-icon': {
            color: '#1b5e20',
          },
        },
        standardInfo: {
          backgroundColor: '#e3f2fd',
          color: '#1565c0',
          '& .MuiAlert-icon': {
            color: '#1565c0',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          padding: '8px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

export default secureTheme;