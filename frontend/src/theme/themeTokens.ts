/**
 * Tokens de diseño centralizados para IT DIMENZION.
 * Usar estos valores en lugar de hex hardcodeados para mantener consistencia.
 */

// ─────────── PRIMARY (Coral - acento principal) ───────────
export const PRIMARY = {
  main: '#FF6B6B',
  light: '#FF8E6B',
  dark: '#E55A5A',
  subtle: 'rgba(255, 107, 107, 0.12)',
  subtleHover: 'rgba(255, 107, 107, 0.18)',
  border: 'rgba(255, 107, 107, 0.15)',
  glow: 'rgba(255, 107, 107, 0.3)',
  glowStrong: 'rgba(255, 107, 107, 0.4)',
} as const;

// Gradiente unificado para botones, banners, encabezados
export const PRIMARY_GRADIENT = 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)';
export const PRIMARY_GRADIENT_HOVER = 'linear-gradient(135deg, #E55A5A 0%, #E57A5A 100%)';

// ─────────── SECONDARY (Naranja - acento en modo oscuro) ───────────
export const SECONDARY = {
  main: '#FFA726',
  light: '#FFB74D',
  dark: '#FF9800',
  subtle: 'rgba(255, 167, 38, 0.12)',
  subtleHover: 'rgba(255, 167, 38, 0.18)',
  glow: 'rgba(255, 167, 38, 0.15)',
  border: 'rgba(255, 167, 38, 0.25)',
} as const;

// Gradiente dark mode (coral → naranja)
export const DARK_GRADIENT = 'linear-gradient(135deg, #FF6B6B 0%, #FFA726 100%)';
export const DARK_GRADIENT_HOVER = 'linear-gradient(135deg, #E55A5A 0%, #E59020 100%)';

// ─────────── SIDEBAR ───────────
export const SIDEBAR_LIGHT = {
  gradient: 'linear-gradient(180deg, #FFE8E4 0%, #FFD6D0 50%, #FFE8E4 100%)',
  border: 'rgba(255, 107, 107, 0.15)',
  shadow: '2px 0 20px rgba(255, 107, 107, 0.06)',
} as const;

export const SIDEBAR_DARK = {
  gradient: 'linear-gradient(180deg, #0A0A0E 0%, #0D0D12 50%, #0A0A0E 100%)',
  border: 'rgba(255, 167, 38, 0.12)',
  shadow: '4px 0 30px rgba(0, 0, 0, 0.6), 1px 0 15px rgba(255, 167, 38, 0.04)',
} as const;

// ─────────── DARK THEME SURFACES ───────────
export const DARK_SURFACES = {
  bg: '#0B0B0F',
  surface: '#131318',
  card: '#1A1A22',
  cardHover: '#22222C',
  border: '#2A2A35',
  borderSubtle: '#1E1E28',
  text: '#F0F0F5',
  textSecondary: '#9E9EB0',
  textMuted: '#6B6B80',
} as const;

// ─────────── ESTADOS (success, error, warning, info) ───────────
export const STATUS = {
  success: '#66BB6A',
  error: '#EF5350',
  warning: '#FF9800',
  info: '#2196F3',
} as const;
