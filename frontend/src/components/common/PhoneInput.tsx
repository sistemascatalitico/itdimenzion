import React from 'react';
import { TextField, InputAdornment, Select, MenuItem, Box, Typography } from '@mui/material';
import { usePhoneInput, CountrySelector } from 'react-international-phone';
import ReactCountryFlag from 'react-country-flag';
// import 'react-international-phone/style.css'; // Comentado temporalmente

interface PhoneInputProps {
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

const PhoneInput: React.FC<PhoneInputProps> = ({
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
  const phoneInput = usePhoneInput({
    defaultCountry: 'co', // Colombia por defecto
    value,
    onChange: (data) => {
      onChange(data.phone, data.country);
    }
  });

  // Nota: Algunas versiones de react-international-phone no exponen usePhoneValidation.
  // Usamos la prop error externa o validación mínima si es necesario.

  return (
    <Box>
      <TextField
        fullWidth
        label={label}
        placeholder={placeholder}
        value={phoneInput.phone}
        onChange={phoneInput.handlePhoneValueChange}
        onBlur={onBlur}
        error={error}
        helperText={helperText}
        required={required}
        disabled={disabled}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CountrySelector
                selectedCountry={phoneInput.country}
                onSelect={(country) => phoneInput.setCountry(country)}
                renderButtonWrapper={({ children, rootProps }) => (
                  <Box 
                    {...rootProps}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      cursor: 'pointer',
                      mr: 1,
                      minWidth: 70,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        borderRadius: 1
                      }
                    }}
                  >
                    {children}
                  </Box>
                )}
                renderButton={({ country, open }) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReactCountryFlag
                      countryCode={country.iso2}
                      svg
                      style={{
                        width: '20px',
                        height: '15px',
                        borderRadius: '2px'
                      }}
                    />
                    <Typography variant="body2" color="text.primary">
                      +{country.dialCode}
                    </Typography>
                  </Box>
                )}
                dropdownOptions={{
                  showDialCodeInList: true,
                  showFlagInList: true,
                }}
                renderOption={(option, { selected }) => (
                  <MenuItem
                    key={option.iso2}
                    selected={selected}
                    value={option.iso2}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.light'
                      }
                    }}
                  >
                    <ReactCountryFlag
                      countryCode={option.iso2}
                      svg
                      style={{
                        width: '20px',
                        height: '15px',
                        borderRadius: '2px'
                      }}
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <Typography variant="body2">
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        +{option.dialCode}
                      </Typography>
                    </Box>
                  </MenuItem>
                )}
              />
            </InputAdornment>
          ),
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
    </Box>
  );
};

export default PhoneInput;