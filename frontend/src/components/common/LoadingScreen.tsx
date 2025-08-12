import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

interface LoadingScreenProps {
  isVisible: boolean;
  onComplete?: () => void;
  duration?: number; // Duración en milisegundos
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isVisible, onComplete, duration = 700 }) => {
  const [opacity, setOpacity] = useState(isVisible ? 1 : 0);
  const [scale, setScale] = useState(isVisible ? 1 : 0.8);

  useEffect(() => {
    if (isVisible) {
      // Animación de entrada
      setOpacity(1);
      setScale(1);
      
      // Simular carga y llamar onComplete después del tiempo especificado
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Animación de salida
      setOpacity(0);
      setScale(0.8);
    }
  }, [isVisible, onComplete, duration]);

  // Mostrar si está visible o si la animación de salida aún está en progreso
  if (!isVisible && opacity === 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #FF6347 0%, #FFA07A 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: opacity,
        transition: 'opacity 0.4s ease-in-out',
      }}
    >
      <Typography
        variant="h1"
        sx={{
          fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
          fontWeight: 700,
          color: '#ffffff',
          textAlign: 'center',
          letterSpacing: '0.2em',
          transform: `scale(${scale})`,
          transition: 'transform 0.4s ease-in-out',
          textShadow: '0 4px 8px rgba(0,0,0,0.3)',
          animation: isVisible ? 'pulse 1.2s ease-in-out infinite' : 'none',
          '@keyframes pulse': {
            '0%, 100%': {
              opacity: 1,
            },
            '50%': {
              opacity: 0.7,
            },
          },
        }}
      >
        ITDIMENZION
      </Typography>
    </Box>
  );
};

export default LoadingScreen;
