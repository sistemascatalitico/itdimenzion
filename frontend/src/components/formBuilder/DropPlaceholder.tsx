import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

interface DropPlaceholderProps {
  isVisible: boolean;
  height?: number;
}

const DropPlaceholder: React.FC<DropPlaceholderProps> = ({ 
  isVisible, 
  height = 80 
}) => {
  const theme = useTheme();

  if (!isVisible) return null;

  return (
    <Box
      sx={{
        height: height,
        my: 1,
        border: `2px dashed ${theme.palette.primary.main}`,
        borderRadius: 2,
        bgcolor: `${theme.palette.primary.main}15`, // 15 = ~8% opacity
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease-in-out',
        animation: 'pulse 1.5s infinite ease-in-out',
        '@keyframes pulse': {
          '0%': { opacity: 0.6 },
          '50%': { opacity: 1 },
          '100%': { opacity: 0.6 },
        },
      }}
    >
      <Typography 
        variant="body2" 
        color="primary" 
        fontWeight="bold"
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1 
        }}
      >
        ⬇️ Soltar campo aquí
      </Typography>
    </Box>
  );
};

export default DropPlaceholder;
