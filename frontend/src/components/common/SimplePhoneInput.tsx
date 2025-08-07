import React from 'react';
import { TextField, InputAdornment, Box, Typography } from '@mui/material';

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
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const phoneValue = event.target.value;
    onChange(phoneValue, 'CO'); // Default to Colombia
  };

  return (
    <TextField
      fullWidth
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      onBlur={onBlur}
      error={error}
      helperText={helperText}
      required={required}
      disabled={disabled}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mr: 1,
              minWidth: 70,
              gap: 1,
              backgroundColor: 'rgba(0,0,0,0.03)',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              border: '1px solid rgba(0,0,0,0.1)'
            }}>
              <span style={{ fontSize: '1.4em' }}>🇨🇴</span>
              <Typography variant="body2" color="text.primary">
                +57
              </Typography>
            </Box>
          </InputAdornment>
        ),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 1,
        }
      }}
    />
  );
};

export default SimplePhoneInput;