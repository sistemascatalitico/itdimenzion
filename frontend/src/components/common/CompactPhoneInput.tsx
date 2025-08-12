import React, { useState } from 'react';
import { TextField, InputAdornment, Select, MenuItem, Box, Typography } from '@mui/material';

const COUNTRIES = [
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', dial: '+57' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', dial: '+1' },
  { code: 'MX', name: 'México', flag: '🇲🇽', dial: '+52' },
  { code: 'ES', name: 'España', flag: '🇪🇸', dial: '+34' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', dial: '+54' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', dial: '+55' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', dial: '+56' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪', dial: '+51' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', dial: '+593' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', dial: '+58' }
];

interface CompactPhoneInputProps {
  value: string;
  onChange: (phone: string, country: string) => void;
  onBlur?: () => void;
  error?: boolean;
  helperText?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const CompactPhoneInput: React.FC<CompactPhoneInputProps> = ({
  value,
  onChange,
  onBlur,
  error = false,
  helperText,
  label = 'Teléfono *',
  required = true,
  disabled = false,
  placeholder = '300 123 4567'
}) => {
  const [country, setCountry] = useState(COUNTRIES[0]);

  const handleCountryChange = (event: any) => {
    const next = COUNTRIES.find(c => c.code === event.target.value) || COUNTRIES[0];
    setCountry(next);
    onChange(value, next.code);
  };

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value, country.code);
  };

  return (
    <TextField
      fullWidth
      label={label}
      value={value}
      onChange={handleValueChange}
      onBlur={onBlur}
      error={error}
      helperText={helperText}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start" sx={{ mr: 1 }}>
            <Select
              value={country.code}
              onChange={handleCountryChange}
              variant="standard"
              disableUnderline
              sx={{
                minWidth: 72,
                '& .MuiSelect-select': { display: 'flex', alignItems: 'center', gap: 0.75 },
              }}
            >
              {COUNTRIES.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ fontSize: '1.2em' }}>{c.flag}</span>
                    <Typography variant="body2">{c.dial}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </InputAdornment>
        )
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 1,
          '&:hover fieldset': { borderColor: '#FF69B4' },
          '&.Mui-focused fieldset': {
            borderColor: '#FF69B4',
            boxShadow: '0 0 0 2px rgba(255, 105, 180, 0.2)'
          }
        }
      }}
    />
  );
};

export default CompactPhoneInput;


