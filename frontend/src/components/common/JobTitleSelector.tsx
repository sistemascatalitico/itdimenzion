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
import { jobTitleService, JobTitle } from '../../services/jobTitleService';

interface JobTitleSelectorProps {
  value?: JobTitle | null;
  onChange: (jobTitle: JobTitle | null) => void;
  processId?: number | null;
  companyId?: number | null;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: boolean;
  helperText?: string;
  variant?: 'select' | 'autocomplete';
  size?: 'small' | 'medium';
}

const JobTitleSelector: React.FC<JobTitleSelectorProps> = ({
  value,
  onChange,
  processId,
  companyId,
  disabled = false,
  required = false,
  label = 'Cargo',
  error = false,
  helperText,
  variant = 'select',
  size = 'medium',
}) => {
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar cargos cuando cambie el proceso
  useEffect(() => {
    if (processId) {
      loadJobTitlesByProcess(processId);
    } else if (companyId) {
      loadJobTitlesByCompany(companyId);
    } else {
      setJobTitles([]);
      onChange(null);
    }
  }, [processId, companyId]);

  const loadJobTitlesByProcess = async (processId: number) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await jobTitleService.getByProcess(processId);
      setJobTitles(data);
    } catch (error) {
      console.error('Error loading job titles by process:', error);
      setErrorMessage('Error al cargar los cargos');
    } finally {
      setLoading(false);
    }
  };

  const loadJobTitlesByCompany = async (companyId: number) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await jobTitleService.getByCompany(companyId);
      setJobTitles(data);
    } catch (error) {
      console.error('Error loading job titles by company:', error);
      setErrorMessage('Error al cargar los cargos');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (newValue: JobTitle | null) => {
    onChange(newValue);
  };

  if (variant === 'autocomplete') {
    return (
      <Autocomplete
        value={value}
        onChange={(_, newValue) => handleChange(newValue)}
        options={jobTitles}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value?.id}
        disabled={disabled || (!processId && !companyId)}
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
                {option.process?.name && `Proceso: ${option.process.name}`}
                {option.commentary && ` • ${option.commentary}`}
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
          (!processId && !companyId)
            ? 'Selecciona un proceso o empresa primero'
            : loading
              ? 'Cargando...'
              : 'No hay cargos disponibles'
        }
        loadingText="Cargando cargos..."
      />
    );
  }

  return (
    <FormControl fullWidth required={required} disabled={disabled || (!processId && !companyId)} error={error} size={size}>
      <InputLabel id="jobtitle-select-label">{label}</InputLabel>
      <Select
        labelId="jobtitle-select-label"
        id="jobtitle-select"
        value={value?.id || ''}
        label={label}
        onChange={(e) => {
          const selectedId = e.target.value;
          if (selectedId === '') {
            handleChange(null);
          } else {
            const selectedJobTitle = jobTitles.find(jt => jt.id === selectedId);
            handleChange(selectedJobTitle || null);
          }
        }}
        disabled={disabled || loading || (!processId && !companyId)}
      >
        {(!processId && !companyId) ? (
          <MenuItem disabled>
            <Typography color="text.secondary">
              Selecciona un proceso o empresa primero
            </Typography>
          </MenuItem>
        ) : loading ? (
          <MenuItem disabled>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography>Cargando cargos...</Typography>
            </Box>
          </MenuItem>
        ) : jobTitles.length === 0 ? (
          <MenuItem disabled>
            <Typography color="text.secondary">
              {errorMessage || 'No hay cargos disponibles'}
            </Typography>
          </MenuItem>
        ) : (
          jobTitles.map((jobTitle) => (
            <MenuItem key={jobTitle.id} value={jobTitle.id}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {jobTitle.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {jobTitle.process?.name && `Proceso: ${jobTitle.process.name}`}
                  {jobTitle.commentary && ` • ${jobTitle.commentary}`}
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

export default JobTitleSelector;
