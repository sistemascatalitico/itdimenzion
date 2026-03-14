import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { PRIMARY_GRADIENT } from '../../theme/themeTokens';

interface SuccessMessageProps {
  isVisible: boolean;
  onComplete?: () => void;
  message?: string;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ 
  isVisible, 
  onComplete, 
  message = "¡Ha sido registrado con éxito!" 
}) => {
  const [opacity, setOpacity] = useState(0);
  const [scale, setScale] = useState(0.8);

  useEffect(() => {
    if (isVisible) {
      // Animación de entrada
      setOpacity(1);
      setScale(1);
      
      // Auto-ocultar después de 3 segundos
      const timer = setTimeout(() => {
        setOpacity(0);
        setScale(0.8);
        
        // Llamar onComplete después de la animación de salida
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 500);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      // Animación de salida
      setOpacity(0);
      setScale(0.8);
    }
  }, [isVisible, onComplete]);

  if (!isVisible && opacity === 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: PRIMARY_GRADIENT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: opacity,
        transition: 'opacity 0.5s ease-in-out',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${scale})`,
          transition: 'transform 0.5s ease-in-out',
          textAlign: 'center',
          maxWidth: '400px',
          px: 3,
        }}
      >
        <CheckCircle
          sx={{
            fontSize: '4rem',
            color: '#4CAF50',
            mb: 2,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
          }}
        />
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            color: '#ffffff',
            mb: 1,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          ¡Éxito!
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 400,
            color: '#ffffff',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            lineHeight: 1.4,
          }}
        >
          {message}
        </Typography>
      </Box>
    </Box>
  );
};

export default SuccessMessage;
