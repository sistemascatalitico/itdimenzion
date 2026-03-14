import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  Info as InfoIcon,
  Add as AddIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

interface EntitySelectorWithActionsProps {
  label: string;
  value: any;
  onChange: (value: any) => void;
  options: Array<{ id: any; name: string; label?: string }>;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  loading?: boolean;
  onInfoClick?: () => void;
  onCreateClick?: () => void;
  infoTooltip?: string;
  createTooltip?: string;
  canCreate?: boolean;
}

const EntitySelectorWithActions: React.FC<EntitySelectorWithActionsProps> = ({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  error = false,
  helperText,
  loading = false,
  onInfoClick,
  onCreateClick,
  infoTooltip,
  createTooltip,
  canCreate = true,
}) => {
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
      <Box sx={{ position: 'relative', flex: 1 }}>
        <FormControl 
          fullWidth 
          required={required}
          disabled={disabled || loading}
          error={error}
        >
          <InputLabel>{label}</InputLabel>
          <Select
            value={value || ''}
            label={label}
            onChange={(e) => onChange(e.target.value || null)}
            sx={{
              '& .MuiSelect-select': {
                paddingRight: value && !disabled ? '60px !important' : undefined,
              },
            }}
          >
            {options.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.label || opt.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {value && !disabled && (
          <IconButton
            size="small"
            onClick={handleClear}
            sx={{
              position: 'absolute',
              right: 36,
              // Desktop: funciona bien con 35%
              top: { xs: '50%', sm: '45%', md: '35%' },
              transform: 'translateY(-50%)',
              zIndex: 1,
              height: 24,
              width: 24,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              // Ajuste fino para diferentes tamaños de pantalla
              '@media (max-width: 600px)': {
                top: '30%', // Mobile: centrado perfecto
                right: 32, // Un poco más cerca en mobile
              },
              '@media (min-width: 600px) and (max-width: 960px)': {
                top: '45%', // Tablet: ajuste medio
              },
            }}
          >
            <ClearIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
        {helperText && (
          <Box sx={{ mt: 0.5, ml: 1.5 }}>
            <Typography variant="caption" color={error ? 'error' : 'text.secondary'}>
              {helperText}
            </Typography>
          </Box>
        )}
      </Box>
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 1, 
          flexShrink: 0,
          alignItems: 'center',
          mt: 1.5, // Alinear verticalmente con el centro del Select (considerando el label)
        }}
      >
        {onInfoClick && (
          <Tooltip title={infoTooltip || `Ver todos los ${label.toLowerCase()}s`}>
            <span>
              <IconButton
                size="small"
                onClick={onInfoClick}
                color="default"
                disabled={disabled}
                sx={{
                  height: 36,
                  width: 36,
                }}
              >
                <InfoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {onCreateClick && canCreate && (
          <Tooltip title={createTooltip || `Crear nuevo ${label.toLowerCase()}`}>
            <span>
              <IconButton
                size="small"
                onClick={onCreateClick}
                color="primary"
                disabled={disabled || loading}
                sx={{
                  height: 36,
                  width: 36,
                }}
              >
                {loading ? (
                  <CircularProgress size={16} />
                ) : (
                  <AddIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default EntitySelectorWithActions;

