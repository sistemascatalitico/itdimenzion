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
import { companyService, Company } from '../../services/companyService';

interface CompanySelectorProps {
  value?: Company | null;
  onChange: (company: Company | null) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: boolean;
  helperText?: string;
  variant?: 'select' | 'autocomplete';
  size?: 'small' | 'medium';
}

const CompanySelector: React.FC<CompanySelectorProps> = ({
  value,
  onChange,
  disabled = false,
  required = false,
  label = 'Empresa',
  error = false,
  helperText,
  variant = 'select',
  size = 'medium',
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar empresas al montar el componente
  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      console.log('🔄 CompanySelector: Cargando empresas...');
      const data = await companyService.getAll();
      console.log('✅ CompanySelector: Empresas cargadas:', data);
      setCompanies(data);
    } catch (error) {
      console.error('❌ CompanySelector: Error loading companies:', error);
      setErrorMessage('Error al cargar las empresas');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (newValue: Company | null) => {
    onChange(newValue);
  };

  if (variant === 'autocomplete') {
    return (
      <Autocomplete
        value={value}
        onChange={(_, newValue) => handleChange(newValue)}
        options={companies}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value?.id}
        disabled={disabled}
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
                {option.taxDocumentType}: {option.taxDocumentNumber} • {option.city}, {option.state}
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
        noOptionsText={loading ? 'Cargando...' : 'No hay empresas disponibles'}
        loadingText="Cargando empresas..."
      />
    );
  }

  return (
    <FormControl fullWidth required={required} disabled={disabled} error={error} size={size}>
      <InputLabel id="company-select-label">{label}</InputLabel>
      <Select
        labelId="company-select-label"
        id="company-select"
        value={value?.id || ''}
        label={label}
        onChange={(e) => {
          const selectedId = e.target.value;
          if (selectedId === '') {
            handleChange(null);
          } else {
            const selectedCompany = companies.find(c => c.id === selectedId);
            handleChange(selectedCompany || null);
          }
        }}
        disabled={disabled || loading}
      >
        {loading ? (
          <MenuItem disabled>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography>Cargando empresas...</Typography>
            </Box>
          </MenuItem>
        ) : companies.length === 0 ? (
          <MenuItem disabled>
            <Typography color="text.secondary">
              {errorMessage || 'No hay empresas disponibles'}
            </Typography>
          </MenuItem>
        ) : (
          companies.map((company) => (
            <MenuItem key={company.id} value={company.id}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {company.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {company.taxDocumentType}: {company.taxDocumentNumber} • {company.city}, {company.state}
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

export default CompanySelector;
