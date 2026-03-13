import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  Typography,
  Chip,
  Autocomplete,
  TextField,
} from '@mui/material';
import { processService, Process } from '../../services/processService';

interface ProcessSelectorProps {
  value?: Process | null;
  onChange: (process: Process | null) => void;
  companyId?: number | null;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: boolean;
  helperText?: string;
  variant?: 'select' | 'autocomplete';
  size?: 'small' | 'medium';
}

const ProcessSelector: React.FC<ProcessSelectorProps> = ({
  value,
  onChange,
  companyId,
  disabled = false,
  required = false,
  label = 'Proceso',
  error = false,
  helperText,
  variant = 'select',
  size = 'medium',
}) => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar procesos cuando cambie la empresa
  useEffect(() => {
    if (companyId) {
      loadProcessesByCompany(companyId);
    } else {
      setProcesses([]);
      onChange(null);
    }
  }, [companyId]);

  const loadProcessesByCompany = async (companyId: number) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await processService.getByCompany(companyId);
      setProcesses(data);
    } catch (error) {
      console.error('Error loading processes:', error);
      setErrorMessage('Error al cargar los procesos');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (newValue: Process | null) => {
    onChange(newValue);
  };

  if (variant === 'autocomplete') {
    return (
      <Autocomplete
        value={value}
        onChange={(_, newValue) => handleChange(newValue)}
        options={processes}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value?.id}
        disabled={disabled || !companyId}
        loading={loading}
        size={size}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            required={required}
            error={error}
            helperText={helperText || errorMessage}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {option.name}
              </Typography>
              {option.commentary && (
                <Typography variant="caption" color="text.secondary">
                  {option.commentary}
                </Typography>
              )}
            </Box>
          </Box>
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option.id}
              label={option.name}
              size="small"
            />
          ))
        }
        noOptionsText={
          !companyId 
            ? 'Selecciona una empresa primero' 
            : loading 
              ? 'Cargando...' 
              : 'No hay procesos disponibles'
        }
        loadingText="Cargando procesos..."
      />
    );
  }

  return (
    <FormControl fullWidth required={required} disabled={disabled || !companyId} error={error} size={size}>
      <InputLabel id="process-select-label">{label}</InputLabel>
      <Select
        labelId="process-select-label"
        id="process-select"
        value={value?.id || ''}
        label={label}
        onChange={(e) => {
          const selectedId = e.target.value;
          if (selectedId === '') {
            handleChange(null);
          } else {
            const selectedProcess = processes.find(p => p.id === selectedId);
            handleChange(selectedProcess || null);
          }
        }}
        disabled={disabled || loading || !companyId}
      >
        {!companyId ? (
          <MenuItem disabled>
            <Typography color="text.secondary">
              Selecciona una empresa primero
            </Typography>
          </MenuItem>
        ) : loading ? (
          <MenuItem disabled>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography>Cargando procesos...</Typography>
            </Box>
          </MenuItem>
        ) : processes.length === 0 ? (
          <MenuItem disabled>
            <Typography color="text.secondary">
              {errorMessage || 'No hay procesos disponibles'}
            </Typography>
          </MenuItem>
        ) : (
          processes.map((process) => (
            <MenuItem key={process.id} value={process.id}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {process.name}
                </Typography>
                {process.commentary && (
                  <Typography variant="caption" color="text.secondary">
                    {process.commentary}
                  </Typography>
                )}
              </Box>
            </MenuItem>
          ))
        )}
      </Select>
      {helperText && (
        <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ mt: 0.5 }}>
          {helperText}
        </Typography>
      )}
      {errorMessage && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
          {errorMessage}
        </Typography>
      )}
    </FormControl>
  );
};

export default ProcessSelector;
