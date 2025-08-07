import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography, Grid } from '@mui/material';
import { LocationOn, Public, Place } from '@mui/icons-material';

interface LocationData {
  country: string;
  state: string;
  city: string;
}

interface SimpleLocationSelectorsProps {
  value: LocationData;
  onChange: (location: LocationData) => void;
  error?: {
    country?: string;
    state?: string;
    city?: string;
  };
  required?: boolean;
  disabled?: boolean;
}

const SimpleLocationSelectors: React.FC<SimpleLocationSelectorsProps> = ({
  value,
  onChange,
  error = {},
  required = false,
  disabled = false
}) => {
  const countries = [
    { value: 'CO', label: 'Colombia', flag: '🇨🇴' },
    { value: 'US', label: 'Estados Unidos', flag: '🇺🇸' },
    { value: 'MX', label: 'México', flag: '🇲🇽' },
  ];

  const states = {
    CO: [
      { value: 'ANT', label: 'Antioquia' },
      { value: 'CUN', label: 'Cundinamarca' },
      { value: 'VAL', label: 'Valle del Cauca' },
    ],
    US: [
      { value: 'NY', label: 'New York' },
      { value: 'CA', label: 'California' },
      { value: 'FL', label: 'Florida' },
    ],
    MX: [
      { value: 'CDMX', label: 'Ciudad de México' },
      { value: 'JAL', label: 'Jalisco' },
    ]
  };

  const cities = {
    ANT: ['Medellín', 'Envigado', 'Sabaneta'],
    CUN: ['Bogotá', 'Soacha', 'Zipaquirá'],
    VAL: ['Cali', 'Palmira', 'Buenaventura'],
    NY: ['New York City', 'Buffalo', 'Rochester'],
    CA: ['Los Angeles', 'San Francisco', 'San Diego'],
    FL: ['Miami', 'Orlando', 'Tampa'],
    CDMX: ['Ciudad de México'],
    JAL: ['Guadalajara', 'Puerto Vallarta'],
  };

  const handleCountryChange = (event: any) => {
    const country = event.target.value;
    onChange({
      country,
      state: '',
      city: ''
    });
  };

  const handleStateChange = (event: any) => {
    const state = event.target.value;
    onChange({
      ...value,
      state,
      city: ''
    });
  };

  const handleCityChange = (event: any) => {
    const city = event.target.value;
    onChange({
      ...value,
      city
    });
  };

  const availableStates = value.country ? states[value.country as keyof typeof states] || [] : [];
  const availableCities = value.state ? cities[value.state as keyof typeof cities] || [] : [];

  return (
    <Box>
      <Grid container spacing={2}>
        {/* Country Selector */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth required={required} error={!!error.country}>
            <InputLabel>País {required && '*'}</InputLabel>
            <Select
              value={value.country}
              onChange={handleCountryChange}
              label={`País ${required ? '*' : ''}`}
              disabled={disabled}
            >
              {countries.map((country) => (
                <MenuItem key={country.value} value={country.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{country.flag}</span>
                    <Typography>{country.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {error.country && (
              <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                {error.country}
              </Typography>
            )}
          </FormControl>
        </Grid>

        {/* State Selector */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth required={required} error={!!error.state}>
            <InputLabel>Departamento/Estado {required && '*'}</InputLabel>
            <Select
              value={value.state}
              onChange={handleStateChange}
              label={`Departamento/Estado ${required ? '*' : ''}`}
              disabled={disabled || !value.country}
            >
              {availableStates.map((state) => (
                <MenuItem key={state.value} value={state.value}>
                  {state.label}
                </MenuItem>
              ))}
            </Select>
            {error.state && (
              <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                {error.state}
              </Typography>
            )}
          </FormControl>
        </Grid>

        {/* City Selector */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth required={required} error={!!error.city}>
            <InputLabel>Ciudad {required && '*'}</InputLabel>
            <Select
              value={value.city}
              onChange={handleCityChange}
              label={`Ciudad ${required ? '*' : ''}`}
              disabled={disabled || !value.state}
            >
              {availableCities.map((city) => (
                <MenuItem key={city} value={city}>
                  {city}
                </MenuItem>
              ))}
            </Select>
            {error.city && (
              <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                {error.city}
              </Typography>
            )}
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SimpleLocationSelectors;