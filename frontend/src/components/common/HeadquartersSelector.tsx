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
import { headquartersService, Headquarters } from '../../services/headquartersService';

interface HeadquartersSelectorProps {
  value?: Headquarters | null;
  onChange: (headquarters: Headquarters | null) => void;
  companyId?: number | null;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: boolean;
  helperText?: string;
  variant?: 'select' | 'autocomplete';
  size?: 'small' | 'medium';
}

const HeadquartersSelector: React.FC<HeadquartersSelectorProps> = ({
  value,
  onChange,
  companyId,
  disabled = false,
  required = false,
  label = 'Sede',
  error = false,
  helperText,
  variant = 'select',
  size = 'medium',
}) => {
  const [headquarters, setHeadquarters] = useState<Headquarters[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar sedes cuando cambie la empresa
  useEffect(() => {
    if (companyId) {
      loadHeadquartersByCompany(companyId);
    } else {
      setHeadquarters([]);
      onChange(null);
    }
  }, [companyId]);

  const loadHeadquartersByCompany = async (companyId: number) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await headquartersService.getByCompany(companyId);
      setHeadquarters(data);
    } catch (error) {
      console.error('Error loading headquarters:', error);
      setErrorMessage('Error al cargar las sedes');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (newValue: Headquarters | null) => {
    onChange(newValue);
  };

  if (variant === 'autocomplete') {
    return (
      <Autocomplete
        value={value}
        onChange={(_, newValue) => handleChange(newValue)}
        options={headquarters}
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
              <Typography variant="caption" color="text.secondary">
                {option.city}, {option.state} • {option.country}
                {option.phone && ` • ${option.phone}`}
              </Typography>
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
              : 'No hay sedes disponibles'
        }
        loadingText="Cargando sedes..."
      />
    );
  }

  return (
    <FormControl fullWidth required={required} disabled={disabled || !companyId} error={error} size={size}>
      <InputLabel id="headquarters-select-label">{label}</InputLabel>
      <Select
        labelId="headquarters-select-label"
        id="headquarters-select"
        value={value?.id || ''}
        label={label}
        onChange={(e) => {
          const selectedId = e.target.value;
          if (selectedId === '') {
            handleChange(null);
          } else {
            const selectedHeadquarters = headquarters.find(h => h.id === selectedId);
            handleChange(selectedHeadquarters || null);
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
              <Typography>Cargando sedes...</Typography>
            </Box>
          </MenuItem>
        ) : headquarters.length === 0 ? (
          <MenuItem disabled>
            <Typography color="text.secondary">
              {errorMessage || 'No hay sedes disponibles'}
            </Typography>
          </MenuItem>
        ) : (
          headquarters.map((headquartersItem) => (
            <MenuItem key={headquartersItem.id} value={headquartersItem.id}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {headquartersItem.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {headquartersItem.city}, {headquartersItem.state} • {headquartersItem.country}
                  {headquartersItem.phone && ` • ${headquartersItem.phone}`}
                </Typography>
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

export default HeadquartersSelector;
