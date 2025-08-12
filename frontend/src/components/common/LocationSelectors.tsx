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
        <Grid item xs={12}>
          <FormControl 
            fullWidth 
            required={required} 
            error={!!error.country}
            sx={{
              '& .country-select-container': {
                position: 'relative',
                '& .country-select-input': {
                  borderRadius: 1,
                  '&:hover': { borderColor: '#FF69B4' },
                  '&:focus': { 
                    borderColor: '#FF69B4',
                    boxShadow: '0 0 0 2px rgba(255, 105, 180, 0.2)' 
                  }
                }
              }
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 1,
                color: '#FF69B4',
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                <Public sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" color="#FF69B4">
                  País {required && '*'}
                </Typography>
              </Box>
              
              <CountrySelect
                onChange={handleCountryChange}
                placeHolder="Seleccionar país"
                inputClassName="country-select-input"
                containerClassName="country-select-container"
                showFlag={false}
              />
              
              {/* Custom flag overlay */}
              {value.country && (
                <Box sx={{ 
                  position: 'absolute', 
                  left: 12, 
                  top: '36px',
                  zIndex: 1,
                  pointerEvents: 'none'
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
                <Typography variant="caption" color="#FF69B4" sx={{ ml: 2, mt: 0.5, fontWeight: 500 }}>
                  {error.country}
                </Typography>
              )}
            </Box>
          </FormControl>
        </Grid>

        {/* State Selector */}
        <Grid item xs={12}>
          <FormControl 
            fullWidth 
            required={required} 
            error={!!error.state}
            sx={{
              '& .state-select-container': {
                position: 'relative',
                '& .state-select-input': {
                  borderRadius: 1,
                  '&:hover': { borderColor: '#FF69B4' },
                  '&:focus': { 
                    borderColor: '#FF69B4',
                    boxShadow: '0 0 0 2px rgba(255, 105, 180, 0.2)' 
                  }
                }
              }
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 1,
                color: '#FF69B4',
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" color="#FF69B4">
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
                <Typography variant="caption" color="#FF69B4" sx={{ ml: 2, mt: 0.5, fontWeight: 500 }}>
                  {error.state}
                </Typography>
              )}
            </Box>
          </FormControl>
        </Grid>

        {/* City Selector */}
        <Grid item xs={12}>
          <FormControl 
            fullWidth 
            required={required} 
            error={!!error.city}
            sx={{
              '& .city-select-container': {
                position: 'relative',
                '& .city-select-input': {
                  borderRadius: 1,
                  '&:hover': { borderColor: '#FF69B4' },
                  '&:focus': { 
                    borderColor: '#FF69B4',
                    boxShadow: '0 0 0 2px rgba(255, 105, 180, 0.2)' 
                  }
                }
              }
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 1,
                color: '#FF69B4',
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                <Place sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" color="#FF69B4">
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
                <Typography variant="caption" color="#FF69B4" sx={{ ml: 2, mt: 0.5, fontWeight: 500 }}>
                  {error.city}
                </Typography>
              )}
            </Box>
          </FormControl>
        </Grid>
      </Grid>

      {/* CSS personalizado para react-country-state-city */}
      <style>{`
        .country-select-container,
        .state-select-container,
        .city-select-container {
          width: 100% !important;
          margin-bottom: 8px;
        }
        
        .country-select-input,
        .state-select-input,
        .city-select-input {
          width: 100% !important;
          padding: 14px 16px !important;
          border: 1px solid rgba(0, 0, 0, 0.23) !important;
          border-radius: 4px !important;
          font-size: 16px !important;
          font-family: "Roboto", "Helvetica", "Arial", sans-serif !important;
          background: #fff !important;
          color: #1f1f1f !important;
          min-height: 20px !important;
          box-sizing: border-box !important;
          transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
        }
        
        .country-select-input:hover,
        .state-select-input:hover,
        .city-select-input:hover {
          border-color: #FF69B4 !important;
        }
        
        .country-select-input:focus,
        .state-select-input:focus,
        .city-select-input:focus {
          border-color: #FF69B4 !important;
          box-shadow: 0 0 0 2px rgba(255, 105, 180, 0.2) !important;
          outline: none !important;
        }
        
        /* Dropdown styles */
        .country-select-container .dropdown,
        .state-select-container .dropdown,
        .city-select-container .dropdown {
          border: 1px solid #FF69B4 !important;
          border-radius: 4px !important;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
          max-height: 200px !important;
          overflow-y: auto !important;
          z-index: 1000 !important;
        }
        
        .country-select-container .dropdown-item,
        .state-select-container .dropdown-item,
        .city-select-container .dropdown-item {
          padding: 8px 16px !important;
          cursor: pointer !important;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
        }
        
        .country-select-container .dropdown-item:hover,
        .state-select-container .dropdown-item:hover,
        .city-select-container .dropdown-item:hover {
          background-color: rgba(255, 105, 180, 0.1) !important;
        }
        
        /* Placeholder styles */
        .country-select-input::placeholder,
        .state-select-input::placeholder,
        .city-select-input::placeholder {
          color: rgba(0, 0, 0, 0.6) !important;
          font-style: italic !important;
        }
        
        /* Error states */
        .country-select-container.error .country-select-input,
        .state-select-container.error .state-select-input,
        .city-select-container.error .city-select-input {
          border-color: #FF69B4 !important;
        }
        
        /* Responsivo */
        @media (max-width: 600px) {
          .country-select-input,
          .state-select-input,
          .city-select-input {
            font-size: 14px !important;
            padding: 12px 14px !important;
          }
        }
      `}</style>
    </Box>
  );
};

export default LocationSelectors;