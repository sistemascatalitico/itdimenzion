import React from 'react';
import { PhoneInput } from 'react-international-phone';
// Aseguramos estilos base del plugin
import 'react-international-phone/style.css';
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
    const isoCandidate =
      typeof meta?.country === 'string'
        ? meta.country
        : meta?.country?.iso2 || meta?.countryIso2 || meta?.countryCode;
    const iso = (isoCandidate || 'CO').toString().toUpperCase();
    onChange(phone, iso);
  };

  return (
    <Box>
      <FormControl fullWidth error={error}>
        <FormLabel 
          sx={{ 
            mb: 1, 
            color: error ? '#FF69B4' : 'rgba(0, 0, 0, 0.6)',
            fontWeight: 500,
            fontSize: '1rem',
            fontFamily: 'inherit'
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
          inputProps={{ placeholder }}
          style={{
            width: '100%',
            borderRadius: 4,
            fontSize: '1rem',
            fontFamily: 'inherit'
          }}
          className="itd-phone-input"
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
      <style>{`
        .itd-phone-input .react-international-phone-input-container {
          width: 100%;
        }
        .itd-phone-input .react-international-phone-input {
          width: 100%;
          padding: 16.5px 14px;
          border: ${error ? '2px solid #FF69B4' : '1px solid rgba(0,0,0,0.23)'};
          border-radius: 4px;
          transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          background: ${disabled ? 'rgba(0,0,0,0.06)' : '#fff'};
          color: #1f1f1f;
        }
        .itd-phone-input .react-international-phone-country-selector-button {
          background: rgba(0,0,0,0.03);
          border-right: 1px solid rgba(0,0,0,0.1);
          border-radius: 4px 0 0 4px;
        }
        .itd-phone-input .react-international-phone-input:focus-within {
          border-color: #FF69B4;
          box-shadow: 0 0 0 2px rgba(255, 105, 180, 0.2);
          outline: none;
        }
      `}</style>
    </Box>
  );
};

export default AdvancedPhoneInput;