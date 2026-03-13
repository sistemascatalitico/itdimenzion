/**
 * UnifiedLocationSelectors.tsx
 * 
 * Componente centralizado para selección de ubicación (país, estado, ciudad)
 * y teléfono con código de país y bandera.
 * 
 * Usa librerías ya instaladas:
 * - react-country-state-city: Para países, estados y ciudades
 * - react-international-phone: Para teléfonos con código de país
 * - react-country-flag: Para mostrar banderas
 * 
 * Reemplaza implementaciones manuales en:
 * - SupplierForm
 * - CompanyForm
 * - UserForm (opcional)
 * - Cualquier otro formulario que necesite ubicación
 */

import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Grid,
  SelectChangeEvent,
  OutlinedInput,
} from '@mui/material';
import { LocationOn, Public, Place, Phone } from '@mui/icons-material';
import { GetCountries, GetState, GetCity } from 'react-country-state-city';
import ReactCountryFlag from 'react-country-flag';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

// ============================================
// INTERFACES
// ============================================

export interface LocationData {
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

export interface UnifiedLocationSelectorsProps {
  // Ubicación
  locationValue: LocationData;
  onLocationChange: (location: LocationData) => void;
  
  // Teléfono (opcional)
  phoneValue?: string;
  onPhoneChange?: (phone: string, countryCode: string) => void;
  
  // Configuración
  required?: boolean;
  disabled?: boolean;
  showPhone?: boolean;
  defaultCountry?: string; // ISO2 code (ej: 'CO', 'US')
  
  // Errores
  errors?: {
    country?: string;
    state?: string;
    city?: string;
    phone?: string;
  };
  
  // Labels personalizados
  labels?: {
    country?: string;
    state?: string;
    city?: string;
    phone?: string;
  };
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const UnifiedLocationSelectors: React.FC<UnifiedLocationSelectorsProps> = ({
  locationValue,
  onLocationChange,
  phoneValue = '',
  onPhoneChange,
  required = false,
  disabled = false,
  showPhone = false,
  defaultCountry = 'CO',
  errors = {},
  labels = {},
}) => {
  const [countryId, setCountryId] = useState<number>(locationValue.country?.id || 0);
  const [stateId, setStateId] = useState<number>(locationValue.state?.id || 0);
  const [cityId, setCityId] = useState<number>(locationValue.city?.id || 0);
  const [phoneCountry, setPhoneCountry] = useState<string>(defaultCountry);
  
  // Estados para las listas de opciones
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Cargar países al montar
  useEffect(() => {
    const loadCountries = async () => {
      try {
        setLoadingCountries(true);
        const countriesList = GetCountries();
        setCountries(countriesList || []);
        
        // Si hay un país por defecto, establecerlo
        if (!locationValue.country && defaultCountry) {
          const defaultCountryData = countriesList?.find((c: any) => c.iso2 === defaultCountry.toUpperCase());
          if (defaultCountryData) {
            setCountryId(defaultCountryData.id);
            onLocationChange({
              country: {
                id: defaultCountryData.id,
                name: defaultCountryData.name,
                iso2: defaultCountryData.iso2,
              },
              state: null,
              city: null,
            });
          }
        }
      } catch (error) {
        console.error('Error loading countries:', error);
      } finally {
        setLoadingCountries(false);
      }
    };
    loadCountries();
  }, []);

  // Cargar estados cuando cambia el país
  useEffect(() => {
    if (countryId > 0) {
      const loadStates = async () => {
        try {
          setLoadingStates(true);
          const country = countries.find((c: any) => c.id === countryId);
          if (country) {
            const statesList = GetState(country.iso2);
            setStates(statesList || []);
          }
        } catch (error) {
          console.error('Error loading states:', error);
        } finally {
          setLoadingStates(false);
        }
      };
      loadStates();
    } else {
      setStates([]);
      setCities([]);
    }
  }, [countryId, countries]);

  // Cargar ciudades cuando cambia el estado
  useEffect(() => {
    if (stateId > 0 && countryId > 0) {
      const loadCities = async () => {
        try {
          setLoadingCities(true);
          const country = countries.find((c: any) => c.id === countryId);
          const state = states.find((s: any) => s.id === stateId);
          if (country && state) {
            const citiesList = GetCity(country.iso2, state.state_code);
            setCities(citiesList || []);
          }
        } catch (error) {
          console.error('Error loading cities:', error);
        } finally {
          setLoadingCities(false);
        }
      };
      loadCities();
    } else {
      setCities([]);
    }
  }, [stateId, countryId, countries, states]);

  // Sincronizar phoneCountry con locationValue.country
  useEffect(() => {
    if (locationValue.country?.iso2) {
      setPhoneCountry(locationValue.country.iso2.toLowerCase());
    }
  }, [locationValue.country]);

  const handleCountryChange = (event: SelectChangeEvent<number>) => {
    const selectedId = Number(event.target.value);
    const selectedCountry = countries.find((c: any) => c.id === selectedId);
    
    if (selectedCountry) {
      setCountryId(selectedId);
      setStateId(0);
      setCityId(0);
      
      const newLocation: LocationData = {
        country: {
          id: selectedCountry.id,
          name: selectedCountry.name,
          iso2: selectedCountry.iso2,
        },
        state: null,
        city: null,
      };
      
      onLocationChange(newLocation);
      
      // Actualizar teléfono si está habilitado
      if (onPhoneChange && selectedCountry.iso2) {
        setPhoneCountry(selectedCountry.iso2.toLowerCase());
      }
    }
  };

  const handleStateChange = (event: SelectChangeEvent<number>) => {
    const selectedId = Number(event.target.value);
    const selectedState = states.find((s: any) => s.id === selectedId);
    
    if (selectedState) {
      setStateId(selectedId);
      setCityId(0);
      
      onLocationChange({
        ...locationValue,
        state: {
          id: selectedState.id,
          name: selectedState.name,
          state_code: selectedState.state_code,
        },
        city: null,
      });
    }
  };

  const handleCityChange = (event: SelectChangeEvent<number>) => {
    const selectedId = Number(event.target.value);
    const selectedCity = cities.find((c: any) => c.id === selectedId);
    
    if (selectedCity) {
      setCityId(selectedId);
      
      onLocationChange({
        ...locationValue,
        city: {
          id: selectedCity.id,
          name: selectedCity.name,
        },
      });
    }
  };

  const handlePhoneChange = (phone: string, meta?: any) => {
    if (onPhoneChange) {
      const countryCode = meta?.country?.iso2 || meta?.countryIso2 || meta?.countryCode || phoneCountry.toUpperCase();
      onPhoneChange(phone, countryCode);
    }
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {/* País */}
        <Grid item xs={12} md={showPhone ? 6 : 12}>
          <FormControl 
            fullWidth 
            required={required} 
            error={!!errors.country}
            disabled={disabled || loadingCountries}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 1,
              color: errors.country ? 'error.main' : 'text.secondary',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              <Public sx={{ fontSize: 16, mr: 0.5 }} />
              <Typography variant="body2">
                {labels.country || 'País'} {required && '*'}
              </Typography>
            </Box>
            
            <Box sx={{ position: 'relative' }}>
              <Select
                value={countryId || ''}
                onChange={handleCountryChange}
                displayEmpty
                input={<OutlinedInput sx={{ 
                  pl: locationValue.country ? '40px' : '14px',
                  pr: '40px',
                }} />}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: errors.country ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: errors.country ? '#d32f2f' : 'PRIMARY.main',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: errors.country ? '#d32f2f' : 'PRIMARY.main',
                    borderWidth: '1px',
                  },
                  '& .MuiSelect-icon': {
                    right: 12,
                    color: 'rgba(0, 0, 0, 0.54)',
                  },
                }}
                renderValue={(selected) => {
                  if (!selected) {
                    return <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Seleccionar país</span>;
                  }
                  const country = countries.find((c: any) => c.id === selected);
                  return country ? country.name : '';
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 300,
                      '& .MuiMenuItem-root': {
                        '&:hover': {
                          backgroundColor: 'rgba(255, 105, 180, 0.1)',
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  Seleccionar país
                </MenuItem>
                {countries.map((country: any) => (
                  <MenuItem key={country.id} value={country.id}>
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
                      <Typography>{country.name}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              
              {/* Bandera en el campo (cuando hay selección) */}
              {locationValue.country && (
                <Box sx={{ 
                  position: 'absolute', 
                  left: 14, 
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                  pointerEvents: 'none'
                }}>
                  <ReactCountryFlag
                    countryCode={locationValue.country.iso2}
                    svg
                    style={{
                      width: '20px',
                      height: '15px',
                      borderRadius: '2px'
                    }}
                  />
                </Box>
              )}
            </Box>
            
            {errors.country && (
              <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                {errors.country}
              </Typography>
            )}
          </FormControl>
        </Grid>

        {/* Teléfono (opcional) */}
        {showPhone && (
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.phone} disabled={disabled}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 1,
                color: errors.phone ? 'error.main' : 'text.secondary',
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                <Phone sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2">
                  {labels.phone || 'Teléfono'} {required && '*'}
                </Typography>
              </Box>
              
              <PhoneInput
                defaultCountry={phoneCountry as any}
                value={phoneValue}
                onChange={handlePhoneChange}
                disabled={disabled}
                className="unified-location-phone-input"
                style={{
                  width: '100%',
                }}
                inputStyle={{
                  width: '100%',
                  padding: '16.5px 14px',
                  borderRadius: '4px',
                  border: errors.phone ? '1px solid #d32f2f' : '1px solid rgba(0, 0, 0, 0.23)',
                  fontSize: '16px',
                }}
              />
              
              {errors.phone && (
                <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                  {errors.phone}
                </Typography>
              )}
            </FormControl>
          </Grid>
        )}

        {/* Estado/Departamento */}
        <Grid item xs={12} md={showPhone ? 6 : 12}>
          <FormControl 
            fullWidth 
            required={required} 
            error={!!errors.state}
            disabled={disabled || !locationValue.country || loadingStates}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 1,
              color: errors.state ? 'error.main' : 'text.secondary',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
              <Typography variant="body2">
                {labels.state || 'Estado/Departamento'} {required && '*'}
              </Typography>
            </Box>
            
            <Select
              value={stateId || ''}
              onChange={handleStateChange}
              displayEmpty
              input={<OutlinedInput />}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: errors.state ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: errors.state ? '#d32f2f' : 'PRIMARY.main',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: errors.state ? '#d32f2f' : 'PRIMARY.main',
                  borderWidth: '1px',
                },
                '& .MuiSelect-icon': {
                  right: 12,
                  color: 'rgba(0, 0, 0, 0.54)',
                },
              }}
              renderValue={(selected) => {
                if (!selected) {
                  return <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Seleccionar estado/departamento</span>;
                }
                const state = states.find((s: any) => s.id === selected);
                return state ? state.name : '';
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 300,
                    '& .MuiMenuItem-root': {
                      '&:hover': {
                        backgroundColor: 'rgba(255, 105, 180, 0.1)',
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="" disabled>
                Seleccionar estado/departamento
              </MenuItem>
              {states.map((state: any) => (
                <MenuItem key={state.id} value={state.id}>
                  {state.name}
                </MenuItem>
              ))}
            </Select>
            
            {errors.state && (
              <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                {errors.state}
              </Typography>
            )}
          </FormControl>
        </Grid>

        {/* Ciudad */}
        <Grid item xs={12} md={showPhone ? 6 : 12}>
          <FormControl 
            fullWidth 
            required={required} 
            error={!!errors.city}
            disabled={disabled || !locationValue.state || loadingCities}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 1,
              color: errors.city ? 'error.main' : 'text.secondary',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              <Place sx={{ fontSize: 16, mr: 0.5 }} />
              <Typography variant="body2">
                {labels.city || 'Ciudad'} {required && '*'}
              </Typography>
            </Box>
            
            <Select
              value={cityId || ''}
              onChange={handleCityChange}
              displayEmpty
              input={<OutlinedInput />}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: errors.city ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: errors.city ? '#d32f2f' : 'PRIMARY.main',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: errors.city ? '#d32f2f' : 'PRIMARY.main',
                  borderWidth: '1px',
                },
                '& .MuiSelect-icon': {
                  right: 12,
                  color: 'rgba(0, 0, 0, 0.54)',
                },
              }}
              renderValue={(selected) => {
                if (!selected) {
                  return <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Seleccionar ciudad</span>;
                }
                const city = cities.find((c: any) => c.id === selected);
                return city ? city.name : '';
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 300,
                    '& .MuiMenuItem-root': {
                      '&:hover': {
                        backgroundColor: 'rgba(255, 105, 180, 0.1)',
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="" disabled>
                Seleccionar ciudad
              </MenuItem>
              {cities.map((city: any) => (
                <MenuItem key={city.id} value={city.id}>
                  {city.name}
                </MenuItem>
              ))}
            </Select>
            
            {errors.city && (
              <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                {errors.city}
              </Typography>
            )}
          </FormControl>
        </Grid>
      </Grid>

      {/* Estilos CSS personalizados para PhoneInput */}
      <style>{`
        .unified-location-phone-input .react-international-phone-input-container {
          width: 100%;
        }
        .unified-location-phone-input .react-international-phone-input {
          width: 100%;
          padding: 16.5px 14px;
          border: 1px solid rgba(0, 0, 0, 0.23);
          border-radius: 4px;
          transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          background: #fff;
          color: #1f1f1f;
        }
        .unified-location-phone-input .react-international-phone-input:focus-within {
          border-color: PRIMARY.main;
          box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.2);
          outline: none;
        }
      `}</style>
    </Box>
  );
};

export default UnifiedLocationSelectors;

