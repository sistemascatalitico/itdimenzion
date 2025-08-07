import React from 'react';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';

interface StepNavigatorProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onStepClick: (step: number) => void;
  isFirst: boolean;
  isLast: boolean;
  nextLabel?: string;
  prevLabel?: string;
  canGoNext?: boolean;
}

export const StepNavigator: React.FC<StepNavigatorProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onStepClick,
  isFirst,
  isLast,
  nextLabel = "Siguiente",
  prevLabel = "Atrás",
  canGoNext = true
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      mt: 3,
      pt: 2,
      borderTop: '1px solid rgba(0,0,0,0.1)'
    }}>
      {/* Botón Atrás */}
      <Button
        onClick={onPrev}
        disabled={isFirst}
        startIcon={<ArrowBack />}
        sx={{
          visibility: isFirst ? 'hidden' : 'visible',
          color: '#FF69B4',
          borderColor: '#FF69B4',
          '&:hover': {
            backgroundColor: 'rgba(255, 105, 180, 0.1)',
            borderColor: '#FF69B4'
          },
          '&.Mui-disabled': {
            color: 'rgba(0, 0, 0, 0.26)'
          }
        }}
        variant="outlined"
      >
        {prevLabel}
      </Button>

      {/* Indicadores de Paso */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <Box
            key={index}
            onClick={() => onStepClick(index)}
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: index === currentStep ? '#FF69B4' : 'rgba(0,0,0,0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: index === currentStep ? '#FF69B4' : '#FF69B4',
                transform: 'scale(1.3)'
              }
            }}
          />
        ))}
      </Box>

      {/* Botón Siguiente/Finalizar */}
      <Button
        onClick={onNext}
        disabled={!canGoNext}
        endIcon={!isLast ? <ArrowForward /> : undefined}
        variant={isLast ? 'contained' : 'outlined'}
        sx={{
          borderColor: '#FF69B4',
          color: isLast ? 'white' : '#FF69B4',
          backgroundColor: isLast ? '#FF69B4' : 'transparent',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: '#FF69B4',
            color: 'white',
            borderColor: '#FF69B4'
          },
          '&.Mui-disabled': {
            backgroundColor: 'rgba(0, 0, 0, 0.12)',
            color: 'rgba(0, 0, 0, 0.26)',
            borderColor: 'rgba(0, 0, 0, 0.12)'
          }
        }}
      >
        {isLast ? 'REGISTRAR' : nextLabel}
      </Button>
    </Box>
  );
};

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  
  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 1 
      }}>
        <Typography variant="caption" color="text.secondary">
          Paso {currentStep + 1} de {totalSteps}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {Math.round(progress)}% completado
        </Typography>
      </Box>
      <Box sx={{
        width: '100%',
        height: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 2,
        overflow: 'hidden'
      }}>
        <Box sx={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: '#FF69B4',
          transition: 'width 0.3s ease',
          borderRadius: 2
        }} />
      </Box>
    </Box>
  );
};