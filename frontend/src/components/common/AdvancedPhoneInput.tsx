import React from 'react';
import { PhoneInput } from 'react-international-phone';
import { FormControl, FormLabel, Typography, Box } from '@mui/material';

interface AdvancedPhoneInputProps {
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

const AdvancedPhoneInput: React.FC<AdvancedPhoneInputProps> = ({
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
  const handlePhoneChange = (phone: string, meta: any) => {
    onChange(phone, meta?.country || 'CO');
  };

  return (
    <Box>
      <FormControl fullWidth error={error}>
        <FormLabel 
          sx={{ 
            mb: 1, 
            color: error ? '#FF69B4' : 'text.primary',
            fontWeight: 500 
          }}
        >
          {label}
        </FormLabel>
        <PhoneInput
          defaultCountry="co"
          value={value}
          onChange={handlePhoneChange}
          onBlur={onBlur}
          disabled={disabled}
          inputProps={{
            placeholder,
            style: {
              width: '100%',
              padding: '16.5px 14px',
              border: error ? '2px solid #FF69B4' : '1px solid rgba(0, 0, 0, 0.23)',
              borderRadius: '4px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.2s ease-in-out',
              backgroundColor: disabled ? 'rgba(0, 0, 0, 0.06)' : 'transparent'
            }
          }}
          countrySelectorStyleProps={{
            buttonStyle: {
              border: 'none',
              borderRadius: '4px',
              padding: '8px 12px',
              marginRight: '8px',
              backgroundColor: 'rgba(0,0,0,0.03)',
              borderRight: '1px solid rgba(0,0,0,0.1)'
            }
          }}
          dialCodePreviewStyleProps={{
            style: {
              color: '#666',
              fontSize: '14px',
              fontWeight: '500'
            }
          }}
        />
        {helperText && (
          <Typography 
            variant="caption" 
            sx={{ 
              mt: 0.5, 
              ml: 2, 
              color: error ? '#FF69B4' : 'text.secondary',
              fontWeight: error ? 500 : 400
            }}
          >
            {helperText}
          </Typography>
        )}
      </FormControl>
    </Box>
  );
};

export default AdvancedPhoneInput;