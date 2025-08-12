import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Save as SaveIcon, Person as PersonIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/api';
import CompactPhoneInput from '../common/CompactPhoneInput';
import SecureLocationSelectors from '../common/SecureLocationSelectors';

interface ProfileData {
  firstName: string;
  lastName: string;
  phone: string;
  contactEmail: string;
  addressLine1: string;
  addressLine2: string;
  residenceCountry: string;
  state: string;
  city: string;
}

interface LocationData {
  country: string;
  state: string;
  city: string;
  countryName?: string;
  stateName?: string;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    phone: '',
    contactEmail: '',
    addressLine1: '',
    addressLine2: '',
    residenceCountry: '',
    state: '',
    city: '',
  });

  const [locationData, setLocationData] = useState<LocationData>({
    country: '',
    state: '',
    city: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        contactEmail: user.contactEmail || user.email || '',
        addressLine1: user.addressLine1 || '',
        addressLine2: user.addressLine2 || '',
        residenceCountry: user.residenceCountry || '',
        state: user.state || '',
        city: user.city || '',
      });

      setLocationData({
        country: user.residenceCountry || '',
        state: user.state || '',
        city: user.city || '',
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhoneChange = (phone: string) => {
    setFormData(prev => ({
      ...prev,
      phone
    }));
  };

  const handleLocationChange = (location: LocationData) => {
    setLocationData(location);
    setFormData(prev => ({
      ...prev,
      residenceCountry: location.country,
      state: location.state,
      city: location.city,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const updateData = {
        ...formData,
        residenceCountry: locationData.country,
        state: locationData.state,
        city: locationData.city,
      };

      const response = await api.put(`/users/profile`, updateData);
      
      if (response.status === 200) {
        setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al actualizar el perfil' 
      });
    } finally {
      setSaving(false);
    }
  };

  const fieldStyles = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#fff',
      borderRadius: 2,
      '& fieldset': {
        borderColor: 'rgba(0, 0, 0, 0.23)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(0, 0, 0, 0.4)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#FF69B4',
        boxShadow: '0 0 0 2px rgba(255, 105, 180, 0.2)',
      },
      '& input': {
        color: '#1f1f1f',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(0, 0, 0, 0.6)',
      '&.Mui-focused': {
        color: '#FF69B4',
      },
    },
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        maxWidth: 800,
        mx: 'auto',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
      }}
    >
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)',
            p: 3,
            textAlign: 'center',
            color: 'white',
          }}
        >
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              fontSize: '2rem',
            }}
          >
            {user?.firstName?.charAt(0) || 'U'}
          </Avatar>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Mi Perfil
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Gestiona tu información personal
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {message && (
            <Alert 
              severity={message.type} 
              sx={{ mb: 3 }}
              onClose={() => setMessage(null)}
            >
              {message.text}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Información Personal */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
                  Información Personal
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                  sx={fieldStyles}
                  id="firstName"
                  name="firstName"
                  autoComplete="given-name"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Apellido"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                  sx={fieldStyles}
                  id="lastName"
                  name="lastName"
                  autoComplete="family-name"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <CompactPhoneInput
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  label="Teléfono"
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Correo de Contacto"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  required
                  sx={fieldStyles}
                  id="contactEmail"
                  name="contactEmail"
                  autoComplete="email"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
                  Dirección
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dirección Línea 1"
                  value={formData.addressLine1}
                  onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                  sx={fieldStyles}
                  id="addressLine1"
                  name="addressLine1"
                  autoComplete="address-line1"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dirección Línea 2"
                  value={formData.addressLine2}
                  onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                  sx={fieldStyles}
                  id="addressLine2"
                  name="addressLine2"
                  autoComplete="address-line2"
                />
              </Grid>

              <Grid item xs={12}>
                <SecureLocationSelectors
                  value={locationData}
                  onChange={handleLocationChange}
                  label="Ubicación"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
                  Información del Sistema (No Editable)
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ID (Cédula)"
                  value={user?.documentNumber || ''}
                  disabled
                  sx={{
                    ...fieldStyles,
                    '& .MuiOutlinedInput-root': {
                      ...fieldStyles['& .MuiOutlinedInput-root'],
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Correo de Acceso"
                  value={user?.email || ''}
                  disabled
                  sx={{
                    ...fieldStyles,
                    '& .MuiOutlinedInput-root': {
                      ...fieldStyles['& .MuiOutlinedInput-root'],
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Usuario"
                  value={user?.username || ''}
                  disabled
                  sx={{
                    ...fieldStyles,
                    '& .MuiOutlinedInput-root': {
                      ...fieldStyles['& .MuiOutlinedInput-root'],
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Empresa"
                  value={user?.company?.name || ''}
                  disabled
                  sx={{
                    ...fieldStyles,
                    '& .MuiOutlinedInput-root': {
                      ...fieldStyles['& .MuiOutlinedInput-root'],
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Sede"
                  value={user?.headquarters?.name || ''}
                  disabled
                  sx={{
                    ...fieldStyles,
                    '& .MuiOutlinedInput-root': {
                      ...fieldStyles['& .MuiOutlinedInput-root'],
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Proceso"
                  value={user?.process?.name || ''}
                  disabled
                  sx={{
                    ...fieldStyles,
                    '& .MuiOutlinedInput-root': {
                      ...fieldStyles['& .MuiOutlinedInput-root'],
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cargo"
                  value={user?.jobTitle?.name || ''}
                  disabled
                  sx={{
                    ...fieldStyles,
                    '& .MuiOutlinedInput-root': {
                      ...fieldStyles['& .MuiOutlinedInput-root'],
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={saving}
                    sx={{
                      background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)',
                      color: 'white',
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #FF5A5A 0%, #FF7D5A 100%)',
                      },
                      '&:disabled': {
                        background: '#ccc',
                      },
                    }}
                  >
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProfilePage;
