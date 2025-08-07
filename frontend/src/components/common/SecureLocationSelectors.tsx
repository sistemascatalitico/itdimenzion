import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography, Grid, CircularProgress } from '@mui/material';
import { LocationOn, Public, Place } from '@mui/icons-material';
import { COLOMBIA_COMPLETE_DATA, getCitiesByState, getColombiaDataStats } from '../../data/colombiaCities';

// Datos críticos hardcoded para máxima seguridad y performance
const PRIORITY_COUNTRIES = [
  { 
    id: 'CO', 
    name: 'Colombia', 
    flag: '🇨🇴',
    priority: true,
    states: [
      { id: 'ATL', name: 'Atlántico', priority: true },
      { id: 'ANT', name: 'Antioquia', priority: true },
      { id: 'CUN', name: 'Cundinamarca', priority: true },
      { id: 'VAL', name: 'Valle del Cauca', priority: true },
      { id: 'BOL', name: 'Bolívar', priority: true },
      { id: 'SAN', name: 'Santander', priority: true },
      { id: 'CAL', name: 'Caldas' },
      { id: 'CAQ', name: 'Caquetá' },
      { id: 'CAS', name: 'Casanare' },
      { id: 'CAU', name: 'Cauca' },
      { id: 'CES', name: 'Cesar' },
      { id: 'CHO', name: 'Chocó' },
      { id: 'COR', name: 'Córdoba' },
      { id: 'GUA', name: 'Guaviare' },
      { id: 'HUI', name: 'Huila' },
      { id: 'LAG', name: 'La Guajira' },
      { id: 'MAG', name: 'Magdalena' },
      { id: 'MET', name: 'Meta' },
      { id: 'NAR', name: 'Nariño' },
      { id: 'NSA', name: 'Norte de Santander' },
      { id: 'PUT', name: 'Putumayo' },
      { id: 'QUI', name: 'Quindío' },
      { id: 'RIS', name: 'Risaralda' },
      { id: 'SUC', name: 'Sucre' },
      { id: 'TOL', name: 'Tolima' },
      { id: 'VAU', name: 'Vaupés' },
      { id: 'VIC', name: 'Vichada' },
      { id: 'AMA', name: 'Amazonas' },
      { id: 'ARA', name: 'Arauca' },
      { id: 'BOY', name: 'Boyacá' },
      { id: 'GUA2', name: 'Guainía' },
      { id: 'SAN2', name: 'San Andrés y Providencia' }
    ]
  },
  { 
    id: 'US', 
    name: 'Estados Unidos', 
    flag: '🇺🇸', 
    priority: true,
    states: [
      { id: 'AL', name: 'Alabama', priority: false },
      { id: 'AK', name: 'Alaska', priority: false },
      { id: 'AZ', name: 'Arizona', priority: false },
      { id: 'AR', name: 'Arkansas', priority: false },
      { id: 'CA', name: 'California', priority: true },
      { id: 'CO', name: 'Colorado', priority: false },
      { id: 'CT', name: 'Connecticut', priority: false },
      { id: 'DE', name: 'Delaware', priority: false },
      { id: 'FL', name: 'Florida', priority: true },
      { id: 'GA', name: 'Georgia', priority: false },
      { id: 'HI', name: 'Hawaii', priority: false },
      { id: 'ID', name: 'Idaho', priority: false },
      { id: 'IL', name: 'Illinois', priority: true },
      { id: 'IN', name: 'Indiana', priority: false },
      { id: 'IA', name: 'Iowa', priority: false },
      { id: 'KS', name: 'Kansas', priority: false },
      { id: 'KY', name: 'Kentucky', priority: false },
      { id: 'LA', name: 'Louisiana', priority: false },
      { id: 'ME', name: 'Maine', priority: false },
      { id: 'MD', name: 'Maryland', priority: false },
      { id: 'MA', name: 'Massachusetts', priority: false },
      { id: 'MI', name: 'Michigan', priority: false },
      { id: 'MN', name: 'Minnesota', priority: false },
      { id: 'MS', name: 'Mississippi', priority: false },
      { id: 'MO', name: 'Missouri', priority: false },
      { id: 'MT', name: 'Montana', priority: false },
      { id: 'NE', name: 'Nebraska', priority: false },
      { id: 'NV', name: 'Nevada', priority: false },
      { id: 'NH', name: 'New Hampshire', priority: false },
      { id: 'NJ', name: 'New Jersey', priority: false },
      { id: 'NM', name: 'New Mexico', priority: false },
      { id: 'NY', name: 'New York', priority: true },
      { id: 'NC', name: 'North Carolina', priority: false },
      { id: 'ND', name: 'North Dakota', priority: false },
      { id: 'OH', name: 'Ohio', priority: false },
      { id: 'OK', name: 'Oklahoma', priority: false },
      { id: 'OR', name: 'Oregon', priority: false },
      { id: 'PA', name: 'Pennsylvania', priority: false },
      { id: 'RI', name: 'Rhode Island', priority: false },
      { id: 'SC', name: 'South Carolina', priority: false },
      { id: 'SD', name: 'South Dakota', priority: false },
      { id: 'TN', name: 'Tennessee', priority: false },
      { id: 'TX', name: 'Texas', priority: true },
      { id: 'UT', name: 'Utah', priority: false },
      { id: 'VT', name: 'Vermont', priority: false },
      { id: 'VA', name: 'Virginia', priority: false },
      { id: 'WA', name: 'Washington', priority: false },
      { id: 'WV', name: 'West Virginia', priority: false },
      { id: 'WI', name: 'Wisconsin', priority: false },
      { id: 'WY', name: 'Wyoming', priority: false },
      { id: 'DC', name: 'Washington D.C.', priority: true }
    ]
  },
  { id: 'MX', name: 'México', flag: '🇲🇽', priority: true },
  { id: 'ES', name: 'España', flag: '🇪🇸' },
  { id: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { id: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { id: 'CL', name: 'Chile', flag: '🇨🇱' },
  { id: 'PE', name: 'Perú', flag: '🇵🇪' },
  { id: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { id: 'VE', name: 'Venezuela', flag: '🇻🇪' }
];

// Se usa la data completa desde colombiaCities.ts

interface LocationData {
  country: string;
  countryName?: string;
  state: string;
  stateName?: string;
  city: string;
}

interface SecureLocationSelectorsProps {
  value: LocationData;
  onChange: (location: LocationData) => void;
  error?: {
    country?: string;
    state?: string;
    city?: string;
  };
  required?: boolean;
  disabled?: boolean;
  enableDynamicLoading?: boolean; // Opción para cargar datos externos
}

const SecureLocationSelectors: React.FC<SecureLocationSelectorsProps> = ({
  value,
  onChange,
  error = {},
  required = false,
  disabled = false,
  enableDynamicLoading = false
}) => {
  const [loading, setLoading] = useState(false);
  const [externalCountries, setExternalCountries] = useState<any[]>([]);
  const [externalStates, setExternalStates] = useState<any[]>([]);
  const [externalCities, setExternalCities] = useState<any[]>([]);

  // Cargar datos externos solo si está habilitado y es necesario
  useEffect(() => {
    if (enableDynamicLoading && !value.country) {
      loadExternalCountries();
    }
  }, [enableDynamicLoading]);

  useEffect(() => {
    if (enableDynamicLoading && value.country && !isPriorityCountry(value.country)) {
      loadExternalStates(value.country);
    }
  }, [value.country, enableDynamicLoading]);

  useEffect(() => {
    if (enableDynamicLoading && value.state && !isPriorityCountry(value.country)) {
      loadExternalCities(value.country, value.state);
    }
  }, [value.state, enableDynamicLoading]);

  const isPriorityCountry = (countryId: string) => {
    return PRIORITY_COUNTRIES.some(c => c.id === countryId);
  };

  const loadExternalCountries = async () => {
    try {
      setLoading(true);
      // Aquí puedes integrar con react-country-state-city de forma controlada
      // const { GetCountries } = await import('react-country-state-city');
      // const countries = GetCountries();
      // setExternalCountries(countries);
    } catch (error) {
      console.warn('Failed to load external countries, using fallback data');
    } finally {
      setLoading(false);
    }
  };

  const loadExternalStates = async (countryId: string) => {
    try {
      setLoading(true);
      // const { GetState } = await import('react-country-state-city');
      // const states = GetState(countryId);
      // setExternalStates(states);
    } catch (error) {
      console.warn('Failed to load external states, using fallback data');
    } finally {
      setLoading(false);
    }
  };

  const loadExternalCities = async (countryId: string, stateId: string) => {
    try {
      setLoading(true);
      // const { GetCity } = await import('react-country-state-city');
      // const cities = GetCity(countryId, stateId);
      // setExternalCities(cities);
    } catch (error) {
      console.warn('Failed to load external cities, using fallback data');
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (event: any) => {
    const countryId = event.target.value;
    const country = PRIORITY_COUNTRIES.find(c => c.id === countryId) || 
                   externalCountries.find(c => c.id === countryId);
    
    onChange({
      country: countryId,
      countryName: country?.name || '',
      state: '',
      stateName: '',
      city: ''
    });
  };

  const handleStateChange = (event: any) => {
    const stateId = event.target.value;
    const country = PRIORITY_COUNTRIES.find(c => c.id === value.country);
    const state = country?.states?.find(s => s.id === stateId) ||
                 externalStates.find(s => s.id === stateId);
    
    onChange({
      ...value,
      state: stateId,
      stateName: state?.name || '',
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

  const getAvailableCountries = () => {
    const priority = PRIORITY_COUNTRIES.filter(c => c.priority);
    const others = PRIORITY_COUNTRIES.filter(c => !c.priority);
    return [...priority, ...others, ...externalCountries];
  };

  const getAvailableStates = () => {
    if (value.country === 'CO') {
      return COLOMBIA_COMPLETE_DATA;
    }
    
    const country = PRIORITY_COUNTRIES.find(c => c.id === value.country);
    if (country?.states) {
      return country.states;
    }
    return externalStates;
  };

  const getAvailableCities = () => {
    if (value.country === 'CO') {
      const cities = getCitiesByState(value.state);
      return cities.map(city => city.name);
    }
    
    return externalCities.map(c => c.name);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container direction="column" spacing={2}>
        {/* Country Selector */}
        <Grid item xs={12}>
          <FormControl 
            fullWidth 
            required={required} 
            error={!!error.country}
            sx={{
              width: '100%',
              minWidth: '280px',
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                minHeight: '56px',
                '&:hover fieldset': {
                  borderColor: '#FF69B4',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#FF69B4',
                  boxShadow: '0 0 0 2px rgba(255, 105, 180, 0.2)',
                },
              },
              '& .MuiInputLabel-root': {
                '&.Mui-focused': {
                  color: '#FF69B4',
                },
              },
            }}
          >
            <InputLabel>País {required && '*'}</InputLabel>
            <Select
              value={value.country}
              onChange={handleCountryChange}
              label={`País ${required ? '*' : ''}`}
              disabled={disabled || loading}
            >
              {getAvailableCountries().map((country) => (
                <MenuItem key={country.id} value={country.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{country.flag}</span>
                    <Typography>{country.name}</Typography>
                    {country.priority && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'primary.main', 
                          fontWeight: 'bold',
                          ml: 1 
                        }}
                      >
                        ⭐
                      </Typography>
                    )}
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
        <Grid item xs={12}>
          <FormControl 
            fullWidth 
            required={required} 
            error={!!error.state}
            sx={{
              width: '100%',
              minWidth: '280px',
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                minHeight: '56px',
                '&:hover fieldset': {
                  borderColor: '#FF69B4',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#FF69B4',
                  boxShadow: '0 0 0 2px rgba(255, 105, 180, 0.2)',
                },
              },
              '& .MuiInputLabel-root': {
                '&.Mui-focused': {
                  color: '#FF69B4',
                },
              },
            }}
          >
            <InputLabel>Departamento/Estado {required && '*'}</InputLabel>
            <Select
              value={value.state}
              onChange={handleStateChange}
              label={`Departamento/Estado ${required ? '*' : ''}`}
              disabled={disabled || !value.country || loading}
              startAdornment={loading ? <CircularProgress size={16} /> : null}
            >
              {getAvailableStates().map((state) => (
                <MenuItem key={state.id} value={state.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>{state.name}</Typography>
                    {state.priority && (
                      <Typography 
                        variant="caption" 
                        sx={{ color: 'primary.main', fontWeight: 'bold' }}
                      >
                        ⭐
                      </Typography>
                    )}
                  </Box>
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

        {/* City Selector - Full width below */}
        <Grid item xs={12}>
          <FormControl 
            fullWidth 
            required={required} 
            error={!!error.city}
            sx={{
              width: '100%',
              minWidth: '280px',
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                minHeight: '56px',
                '&:hover fieldset': {
                  borderColor: '#FF69B4',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#FF69B4',
                  boxShadow: '0 0 0 2px rgba(255, 105, 180, 0.2)',
                },
              },
              '& .MuiInputLabel-root': {
                '&.Mui-focused': {
                  color: '#FF69B4',
                },
              },
            }}
          >
            <InputLabel>Ciudad {required && '*'}</InputLabel>
            <Select
              value={value.city}
              onChange={handleCityChange}
              label={`Ciudad ${required ? '*' : ''}`}
              disabled={disabled || !value.state || loading}
              startAdornment={loading ? <CircularProgress size={16} /> : null}
            >
              {getAvailableCities().map((city) => (
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

      {/* Security Notice */}
      <Box sx={{ mt: 2 }}>
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          🛡️ Datos prioritarios verificados | 
          {value.country === 'CO' ? `✅ Colombia: ${getCitiesByState(value.state).length} ciudades disponibles` : 'Datos seguros'}
        </Typography>
      </Box>
      
      {/* CSS adicional para garantizar layout vertical */}
      <style jsx global>{`
        /* Forzar layout vertical en todos los breakpoints */
        .MuiGrid-container .MuiGrid-item {
          max-width: 100% !important;
          flex-basis: 100% !important;
          width: 100% !important;
        }
        
        /* Asegurar que FormControl ocupe todo el ancho */
        .MuiGrid-item .MuiFormControl-root {
          width: 100% !important;
          min-width: 280px !important;
        }
        
        /* Mejorar la altura mínima de los selects */
        .MuiFormControl-root .MuiOutlinedInput-root {
          min-height: 56px !important;
        }
        
        /* Asegurar que el Select interno también sea full width */
        .MuiSelect-select {
          width: 100% !important;
          box-sizing: border-box !important;
        }
        
        /* Responsive: Mantener vertical en móviles */
        @media (max-width: 600px) {
          .MuiGrid-item .MuiFormControl-root {
            min-width: 250px !important;
          }
          
          .MuiFormControl-root .MuiOutlinedInput-root {
            min-height: 48px !important;
          }
        }
      `}</style>
    </Box>
  );
};

export default SecureLocationSelectors;