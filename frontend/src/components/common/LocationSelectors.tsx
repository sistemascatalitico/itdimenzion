import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography, Grid } from '@mui/material';
import { CountrySelect, StateSelect, CitySelect } from 'react-country-state-city';
import ReactCountryFlag from 'react-country-flag';
// import 'react-country-state-city/dist/react-country-state-city.css'; // Comentado temporalmente
import { LocationOn, Public, Place } from '@mui/icons-material';

interface LocationData {
  country: {
    id: number;
    name: string;
    iso2: string;
  } | null;
  state: {
    id: number;
    name: string;
    state_code: string;
  } | null;
  city: {
    id: number;
    name: string;
  } | null;
}

interface LocationSelectorsProps {
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

const LocationSelectors: React.FC<LocationSelectorsProps> = ({
  value,
  onChange,
  error = {},
  required = true,
  disabled = false
}) => {
  const [countryId, setCountryId] = useState<number>(value.country?.id || 0);
  const [stateId, setStateId] = useState<number>(value.state?.id || 0);
  const [cityId, setCityId] = useState<number>(value.city?.id || 0);

  // Colombia por defecto
  useEffect(() => {
    if (!value.country && !countryId) {
      // Establecer Colombia como país por defecto
      const colombiaData = {
        id: 48, // ID de Colombia en react-country-state-city
        name: 'Colombia',
        iso2: 'CO'
      };
      setCountryId(colombiaData.id);
      onChange({
        ...value,
        country: colombiaData,
        state: null,
        city: null
      });
    }
  }, []);

  const handleCountryChange = (countryData: any) => {
    setCountryId(countryData.id);
    setStateId(0);
    setCityId(0);
    
    onChange({
      country: {
        id: countryData.id,
        name: countryData.name,
        iso2: countryData.iso2
      },
      state: null,
      city: null
    });
  };

  const handleStateChange = (stateData: any) => {
    setStateId(stateData.id);
    setCityId(0);
    
    onChange({
      ...value,
      state: {
        id: stateData.id,
        name: stateData.name,
        state_code: stateData.state_code
      },
      city: null
    });
  };

  const handleCityChange = (cityData: any) => {
    setCityId(cityData.id);
    
    onChange({
      ...value,
      city: {
        id: cityData.id,
        name: cityData.name
      }
    });
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {/* Country Selector */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth required={required} error={!!error.country}>
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 1,
                color: 'text.secondary',
                fontSize: '0.75rem'
              }}>
                <Public sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption">
                  País {required && '*'}
                </Typography>
              </Box>
              
              <CountrySelect
                onChange={handleCountryChange}
                placeHolder="Seleccionar país"
                inputClassName="country-select-input"
                containerClassName="country-select-container"
                showFlag={false} // Usaremos nuestras propias banderas
              />
              
              {/* Custom flag overlay */}
              {value.country && (
                <Box sx={{ 
                  position: 'absolute', 
                  left: 12, 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                  pointerEvents: 'none',
                  mt: 1
                }}>
                  <ReactCountryFlag
                    countryCode={value.country.iso2}
                    svg
                    style={{
                      width: '20px',
                      height: '15px',
                      borderRadius: '2px'
                    }}
                  />
                </Box>
              )}
              
              {error.country && (
                <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                  {error.country}
                </Typography>
              )}
            </Box>
          </FormControl>
        </Grid>

        {/* State Selector */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth required={required} error={!!error.state}>
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 1,
                color: 'text.secondary',
                fontSize: '0.75rem'
              }}>
                <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption">
                  Departamento/Estado {required && '*'}
                </Typography>
              </Box>
              
              <StateSelect
                countryid={countryId}
                onChange={handleStateChange}
                placeHolder="Seleccionar departamento"
                inputClassName="state-select-input"
                containerClassName="state-select-container"
              />
              
              {error.state && (
                <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                  {error.state}
                </Typography>
              )}
            </Box>
          </FormControl>
        </Grid>

        {/* City Selector */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth required={required} error={!!error.city}>
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 1,
                color: 'text.secondary',
                fontSize: '0.75rem'
              }}>
                <Place sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption">
                  Ciudad {required && '*'}
                </Typography>
              </Box>
              
              <CitySelect
                countryid={countryId}
                stateid={stateId}
                onChange={handleCityChange}
                placeHolder="Seleccionar ciudad"
                inputClassName="city-select-input"
                containerClassName="city-select-container"
              />
              
              {error.city && (
                <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                  {error.city}
                </Typography>
              )}
            </Box>
          </FormControl>
        </Grid>
      </Grid>

{/* Styles moved to sx prop to avoid jsx conflicts */}
    </Box>
  );
};

export default LocationSelectors;