import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Typography,
  Box,
  Chip,
} from '@mui/material';

interface DynamicFieldProps {
  field: any;
  value: any;
  error?: string;
  onChange: (value: any) => void;
  disabled?: boolean;
}

const DynamicField: React.FC<DynamicFieldProps> = ({
  field,
  value,
  error,
  onChange,
  disabled = false,
}) => {
  const fieldType = field.type || field.fieldType;

  switch (fieldType) {
    case 'TEXT':
      return (
        <TextField
          label={field.label}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.isRequired}
          disabled={disabled}
          error={!!error}
          helperText={error || field.helpText || field.description}
          fullWidth
          placeholder={field.placeholder}
        />
      );

    case 'TEXTAREA':
      return (
        <TextField
          label={field.label}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.isRequired}
          disabled={disabled}
          error={!!error}
          helperText={error || field.helpText || field.description}
          fullWidth
          multiline
          rows={4}
          placeholder={field.placeholder}
        />
      );

    case 'NUMBER':
    case 'DECIMAL':
    case 'CAPACITY': {
      const cfg = field.config || {};
      const unit = cfg.unit || field.unit_of_measure || '';
      return (
        <TextField
          label={`${field.label}${unit ? ` (${unit})` : ''}`}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          required={field.isRequired}
          disabled={disabled}
          error={!!error}
          helperText={error || field.helpText || field.description}
          fullWidth
          inputProps={{
            min: cfg.min ?? field.min_value,
            max: cfg.max ?? field.max_value,
            step: fieldType === 'DECIMAL' ? 0.1 : 1,
          }}
        />
      );
    }

    case 'DATE':
      return (
        <TextField
          label={field.label}
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          required={field.isRequired}
          disabled={disabled}
          error={!!error}
          helperText={error || field.helpText || field.description}
          fullWidth
          InputLabelProps={{
            shrink: true,
          }}
        />
      );

    case 'DATETIME':
      return (
        <TextField
          label={field.label}
          type="datetime-local"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          required={field.isRequired}
          disabled={disabled}
          error={!!error}
          helperText={error || field.helpText || field.description}
          fullWidth
          InputLabelProps={{
            shrink: true,
          }}
        />
      );

    case 'BOOLEAN':
    case 'CHECKBOX':
      return (
        <FormControlLabel
          control={
            <Switch
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
            />
          }
          label={field.label}
        />
      );

    case 'SELECT':
      return (
        <FormControl
          fullWidth
          required={field.isRequired}
          disabled={disabled}
          error={!!error}
        >
          <InputLabel>{field.label}</InputLabel>
          <Select
            value={value || ''}
            label={field.label}
            onChange={(e) => onChange(e.target.value)}
          >
            {field.options?.map((opt: any) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
          {(error || field.helpText || field.description) && (
            <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ mt: 0.5, ml: 1.5 }}>
              {error || field.helpText || field.description}
            </Typography>
          )}
        </FormControl>
      );

    case 'MULTISELECT':
      // Por ahora, usar un Select múltiple básico
      return (
        <FormControl fullWidth required={field.isRequired} disabled={disabled} error={!!error}>
          <InputLabel>{field.label}</InputLabel>
          <Select
            multiple
            value={Array.isArray(value) ? value : []}
            label={field.label}
            onChange={(e) => onChange(e.target.value)}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((val: any) => {
                  const option = field.options?.find((opt: any) => opt.value === val);
                  return (
                    <Chip key={val} label={option?.label || val} size="small" />
                  );
                })}
              </Box>
            )}
          >
            {field.options?.map((opt: any) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
          {(error || field.helpText || field.description) && (
            <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ mt: 0.5, ml: 1.5 }}>
              {error || field.helpText || field.description}
            </Typography>
          )}
        </FormControl>
      );

    default:
      return (
        <TextField
          label={field.label}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.isRequired}
          disabled={disabled}
          error={!!error}
          helperText={error || field.helpText || field.description}
          fullWidth
        />
      );
  }
};

export default DynamicField;

