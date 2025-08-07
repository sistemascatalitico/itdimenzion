import React, { useState } from 'react';
import { TextField, InputAdornment, Box, Typography, Select, MenuItem, FormControl } from '@mui/material';

// Países más importantes con sus códigos y banderas
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
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', dial: '+58' },
  { code: 'PA', name: 'Panamá', flag: '🇵🇦', dial: '+507' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', dial: '+506' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹', dial: '+502' },
  { code: 'CA', name: 'Canadá', flag: '🇨🇦', dial: '+1' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧', dial: '+44' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷', dial: '+33' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪', dial: '+49' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹', dial: '+39' },
  { code: 'JP', name: 'Japón', flag: '🇯🇵', dial: '+81' },
  { code: 'CN', name: 'China', flag: '🇨🇳', dial: '+86' }
];

interface SimplePhoneInputProps {
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

const SimplePhoneInput: React.FC<SimplePhoneInputProps> = ({
  value,
  onChange,
  onBlur,
  error = false,
  helperText,
  label = "Teléfono *",
  required = true,
  disabled = false,
  placeholder = "300 123 4567"
}) => {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Colombia por defecto

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const phoneValue = event.target.value;
    onChange(phoneValue, selectedCountry.code);
  };

  const handleCountryChange = (event: any) => {
    const countryCode = event.target.value;
    const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];
    setSelectedCountry(country);
    onChange(value, country.code);
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {/* Country Selector */}
      <FormControl sx={{ minWidth: 140 }}>
        <Select
          value={selectedCountry.code}
          onChange={handleCountryChange}
          disabled={disabled}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 1,
              '&:hover fieldset': {
                borderColor: '#FF69B4',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#FF69B4',
                boxShadow: '0 0 0 2px rgba(255, 105, 180, 0.2)',
              },
            }
          }}
        >
          {COUNTRIES.map((country) => (
            <MenuItem key={country.code} value={country.code}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span style={{ fontSize: '1.2em' }}>{country.flag}</span>
                <Typography variant="body2" sx={{ minWidth: 30 }}>
                  {country.dial}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Phone Number Input */}
      <TextField
        fullWidth
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={handlePhoneChange}
        onBlur={onBlur}
        error={error}
        helperText={helperText}
        required={required}
        disabled={disabled}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 1,
            '&:hover fieldset': {
              borderColor: '#FF69B4',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#FF69B4',
              boxShadow: '0 0 0 2px rgba(255, 105, 180, 0.2)',
            },
          },
          '& .MuiFormHelperText-root.Mui-error': {
            color: '#FF69B4',
            fontWeight: 500,
          }
        }}
      />
    </Box>
  );
};

export default SimplePhoneInput;