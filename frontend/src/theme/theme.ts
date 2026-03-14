import { createTheme, ThemeOptions } from '@mui/material/styles';
import {
  PRIMARY,
  PRIMARY_GRADIENT,
  PRIMARY_GRADIENT_HOVER,
  SECONDARY,
  DARK_GRADIENT,
  DARK_GRADIENT_HOVER,
  SIDEBAR_DARK,
  DARK_SURFACES,
  STATUS,
} from './themeTokens';

const D = DARK_SURFACES;

const sharedTypography: ThemeOptions['typography'] = {
  fontFamily: [
    'Inter', 'Roboto', '-apple-system', 'BlinkMacSystemFont',
    '"Segoe UI"', '"Helvetica Neue"', 'Arial', 'sans-serif',
  ].join(','),
  h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' },
  h2: { fontSize: '2rem', fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.01em' },
  h3: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.4 },
  h4: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.5 },
  h5: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.5 },
  h6: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.5 },
  body1: { fontSize: '1rem', lineHeight: 1.6, fontWeight: 400 },
  body2: { fontSize: '0.875rem', lineHeight: 1.5, fontWeight: 400 },
  button: { textTransform: 'none' as const, fontWeight: 600, fontSize: '0.875rem' },
};

const sharedShape: ThemeOptions['shape'] = { borderRadius: 16 };

// ─────────── LIGHT THEME ───────────

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: PRIMARY.main, light: PRIMARY.light, dark: PRIMARY.dark, contrastText: '#ffffff' },
    secondary: { main: SECONDARY.main, light: SECONDARY.light, dark: SECONDARY.dark, contrastText: '#ffffff' },
    error: { main: '#F44336', light: '#EF5350', dark: '#C62828' },
    warning: { main: '#FF9800', light: '#FFB74D', dark: '#F57C00' },
    info: { main: '#29B6F6', light: '#4FC3F7', dark: '#0288D1' },
    success: { main: '#66BB6A', light: '#81C784', dark: '#4CAF50' },
    background: { default: '#ffffff', paper: 'rgba(255, 255, 255, 0.95)' },
    text: { primary: 'rgba(0, 0, 0, 0.87)', secondary: 'rgba(0, 0, 0, 0.6)' },
  },
  typography: sharedTypography,
  shape: sharedShape,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#ffffff', minHeight: '100vh' },
        '.gradient-bg': {
          background: `linear-gradient(135deg, ${PRIMARY.main} 0%, ${PRIMARY.light} 50%, ${SECONDARY.main} 100%)`,
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12, textTransform: 'none', fontWeight: 600,
          padding: '12px 24px', fontSize: '0.875rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        contained: {
          background: PRIMARY_GRADIENT,
          boxShadow: `0 4px 16px ${PRIMARY.glow}`,
          '&:hover': {
            background: PRIMARY_GRADIENT_HOVER,
            boxShadow: `0 8px 24px ${PRIMARY.glowStrong}`,
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderColor: PRIMARY.main, color: PRIMARY.main, borderWidth: '2px',
          '&:hover': { borderWidth: '2px', background: PRIMARY.subtle },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20, background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 1, backgroundColor: 'rgba(255, 255, 255, 0.9)',
            '&.Mui-focused': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
              boxShadow: `0 0 0 3px ${PRIMARY.glow}`,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: PRIMARY.main, borderWidth: '1px' },
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: PRIMARY_GRADIENT,
          color: 'white', borderRight: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12, margin: '4px 8px',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 20, fontWeight: 500 },
        colorPrimary: { background: PRIMARY_GRADIENT, color: 'white' },
      },
    },
  },
});

// ─────────── DARK THEME ───────────

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: PRIMARY.main, light: PRIMARY.light, dark: PRIMARY.dark, contrastText: '#ffffff' },
    secondary: { main: SECONDARY.main, light: SECONDARY.light, dark: SECONDARY.dark, contrastText: '#ffffff' },
    error: { main: '#EF5350', light: '#E57373', dark: '#C62828' },
    warning: { main: '#FFA726', light: '#FFB74D', dark: '#F57C00' },
    info: { main: '#42A5F5', light: '#64B5F6', dark: '#1E88E5' },
    success: { main: '#66BB6A', light: '#81C784', dark: '#43A047' },
    background: { default: D.bg, paper: D.card },
    text: { primary: D.text, secondary: D.textSecondary },
    divider: D.border,
  },
  typography: sharedTypography,
  shape: sharedShape,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: D.bg,
          minHeight: '100vh',
          colorScheme: 'dark',
        },
        '.gradient-bg': {
          background: `linear-gradient(135deg, ${D.bg} 0%, #1A1020 50%, ${D.bg} 100%)`,
          minHeight: '100vh',
        },
        '::-webkit-scrollbar': { width: 8, height: 8 },
        '::-webkit-scrollbar-track': { background: D.surface },
        '::-webkit-scrollbar-thumb': {
          background: D.border,
          borderRadius: 4,
          '&:hover': { background: D.textMuted },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12, textTransform: 'none', fontWeight: 600,
          padding: '12px 24px', fontSize: '0.875rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        contained: {
          background: DARK_GRADIENT,
          boxShadow: `0 4px 20px ${PRIMARY.subtle}`,
          '&:hover': {
            background: DARK_GRADIENT_HOVER,
            boxShadow: `0 8px 30px ${PRIMARY.glow}`,
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderColor: SECONDARY.main, color: SECONDARY.main, borderWidth: 2,
          '&:hover': { borderWidth: 2, background: SECONDARY.subtle },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          background: D.card,
          border: `1px solid ${D.border}`,
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            borderColor: SECONDARY.border,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px ${SECONDARY.glow}`,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 1,
            backgroundColor: D.surface,
            color: D.text,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: D.border },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: D.textMuted },
            '&.Mui-focused': {
              backgroundColor: D.card,
              boxShadow: `0 0 0 3px ${SECONDARY.glow}`,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: SECONDARY.main, borderWidth: '1px' },
            },
          },
          '& .MuiInputLabel-root': { color: D.textSecondary },
          '& .MuiInputLabel-root.Mui-focused': { color: SECONDARY.main },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': { borderColor: D.border },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: D.textMuted },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: SECONDARY.main },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: D.bg,
          color: D.text,
          borderRight: `1px solid ${SECONDARY.border}`,
          boxShadow: SIDEBAR_DARK.shadow,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12, margin: '4px 8px',
          '&:hover': { backgroundColor: SECONDARY.subtle },
          '&.Mui-selected': {
            backgroundColor: SECONDARY.subtle,
            '&:hover': { backgroundColor: SECONDARY.subtleHover },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 20, fontWeight: 500 },
        colorPrimary: { background: DARK_GRADIENT, color: 'white' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: D.card,
          backgroundImage: 'none',
          border: `1px solid ${D.border}`,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          background: D.card,
          backgroundImage: 'none',
          border: `1px solid ${D.border}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottomColor: D.border },
        head: { backgroundColor: D.surface, color: D.textSecondary, fontWeight: 600 },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&:hover': { backgroundColor: `${SECONDARY.glow} !important` } },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: D.border },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12 },
        standardWarning: { backgroundColor: SECONDARY.subtle, color: SECONDARY.main },
          standardError: { backgroundColor: 'rgba(239, 83, 80, 0.12)', color: STATUS.error },
        standardInfo: { backgroundColor: 'rgba(66, 165, 245, 0.12)', color: '#42A5F5' },
        standardSuccess: { backgroundColor: 'rgba(102, 187, 106, 0.12)', color: STATUS.success },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: D.card, color: D.text, border: `1px solid ${D.border}` },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: SECONDARY.main },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: D.textSecondary,
          '&.Mui-selected': { color: SECONDARY.main },
        },
      },
    },
  },
});

export default lightTheme;
