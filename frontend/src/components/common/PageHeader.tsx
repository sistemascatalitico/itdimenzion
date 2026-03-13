import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { PRIMARY } from '../../theme/themeTokens';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** Icono opcional en la esquina (ej: engranaje de configuración) */
  endIcon?: React.ReactNode;
}

/**
 * Encabezado de página unificado - Opción B: fondo neutro + línea de acento coral.
 * Minimalista, moderno, limpio.
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, endIcon }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        background: isDark ? theme.palette.background.paper : theme.palette.background.default,
        color: 'text.primary',
        p: 3,
        borderRadius: 2,
        mb: 3,
        borderBottom: `4px solid ${PRIMARY.main}`,
        boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: subtitle ? 1 : 0, color: 'inherit' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {action}
          {endIcon}
        </Box>
      </Box>
    </Box>
  );
};

export default PageHeader;
