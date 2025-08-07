import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Alert,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Badge,
  AccountCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PhoneInput from '../common/PhoneInput';
import LocationSelectors from '../common/LocationSelectors';

// Document types for registration
const documentTypes = [
  { value: 'CEDULA', label: 'Cédula de Ciudadanía' },
  { value: 'TARJETA_IDENTIDAD', label: 'Tarjeta de Identidad' },
  { value: 'CEDULA_EXTRANJERIA', label: 'Cédula de Extranjería' },
  { value: 'PASSPORT', label: 'Pasaporte' },
  { value: 'NIT', label: 'NIT' },
  { value: 'RUT', label: 'RUT' },
];

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

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  documentType: string;
  documentNumber: string;
  username: string;
  password: string;
  confirmPassword: string;
  location: LocationData;
}

interface RegisterErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  documentType?: string;
  documentNumber?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  location?: {
    country?: string;
    state?: string;
    city?: string;
  };
  general?: string;
}

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState<RegisterData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: 'CO',
    documentType: '',
    documentNumber: '',
    username: '',
    password: '',
    confirmPassword: '',
    location: {
      country: null,
      state: null,
      city: null
    }
  });

  const [errors, setErrors] = useState<RegisterErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: RegisterErrors = {};

    // Nombre
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es obligatorio';
    }

    // Apellido
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es obligatorio';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Ingrese un email válido';
      }
    }

    // Documento
    if (!formData.documentType) {
      newErrors.documentType = 'Seleccione un tipo de documento';
    }
    if (!formData.documentNumber.trim()) {
      newErrors.documentNumber = 'El número de documento es obligatorio';
    }

    // Contraseña - validación robusta según backend
    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (formData.password.length > 128) {
      newErrors.password = 'La contraseña no puede exceder 128 caracteres';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(formData.password)) {
      newErrors.password = 'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial';
    }

    // Confirmar contraseña
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirme su contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof RegisterData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as keyof RegisterErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  // Handle phone input changes
  const handlePhoneChange = (phone: string, country: string) => {
    setFormData(prev => ({ 
      ...prev, 
      phone: phone,
      countryCode: country.toUpperCase()
    }));
    
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: undefined }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  // Handle location changes
  const handleLocationChange = (location: LocationData) => {
    setFormData(prev => ({ ...prev, location }));
    
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: undefined }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // El PhoneInput ya proporciona el número completo con código de país
      const fullPhoneNumber = formData.phone || undefined;
      
      
      const result = await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(), 
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: fullPhoneNumber,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber.trim(),
        headquartersId: 1, // Default headquarters ID as integer
      });
      
      if (result.success) {
        // Success - redirect to login
        navigate('/login');
      } else {
        setErrors({ general: result.error || 'Error en el registro' });
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Verifique su conexión a internet.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };


  return (
    <Box
      className="gradient-bg"
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        p: 2,
      }}
    >
      <Card
        sx={{
          width: { xs: '90%', sm: '420px' },
          maxWidth: '420px',
          borderRadius: 1,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Header */}
          <Box textAlign="center" mb={3}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 1,
                fontSize: { xs: '1.8rem', sm: '2rem' },
              }}
            >
              <span style={{ color: '#FF69B4' }}>IT</span>
              <span style={{ color: '#FFA726' }}>DIMENZION</span>
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                fontSize: { xs: '1rem', sm: '1.1rem' },
                mb: 0.5 
              }}
            >
              Crear Cuenta
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completa tus datos para registrarte
            </Typography>
          </Box>

          {/* Error Message */}
          {errors.general && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.general}
            </Alert>
          )}

          {/* Registration Form */}
          <Box component="form" onSubmit={handleSubmit}>
            {/* Nombre y Apellido - Responsive */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2, 
              mb: 2 
            }}>
              <TextField
                fullWidth
                label="Nombre *"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  },
                  '& .MuiFormHelperText-root.Mui-error': {
                    color: '#FF69B4',
                    fontWeight: 500,
                  }
                }}
              />
              <TextField
                fullWidth
                label="Apellido *"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  },
                  '& .MuiFormHelperText-root.Mui-error': {
                    color: '#FF69B4',
                    fontWeight: 500,
                  }
                }}
              />
            </Box>

            {/* Email */}
            <TextField
              fullWidth
              label="Email *"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              error={!!errors.email}
              helperText={errors.email}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                },
                '& .MuiFormHelperText-root.Mui-error': {
                  color: '#FF69B4',
                  fontWeight: 500,
                }
              }}
            />

            {/* Modern Phone Input with Flags */}
            <Box sx={{ mt: 2 }}>
              <PhoneInput
                value={formData.phone}
                onChange={handlePhoneChange}
                error={!!errors.phone}
                helperText={errors.phone}
                label="Teléfono"
                placeholder="300 123 4567"
                required={false}
              />
            </Box>

            {/* Tipo de Documento y Número - Responsive */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2, 
              mt: 2 
            }}>
              <FormControl 
                fullWidth 
                error={!!errors.documentType}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  },
                  '& .MuiSelect-select': {
                    borderRadius: 1,
                  }
                }}
              >
                <InputLabel>Tipo de Documento *</InputLabel>
                <Select
                  value={formData.documentType}
                  onChange={handleInputChange('documentType')}
                  input={<OutlinedInput label="Tipo de Documento *" />}
                >
                  {documentTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.documentType && (
                  <Typography variant="caption" sx={{ mt: 0.5, ml: 2, color: '#FF69B4', fontWeight: 500 }}>
                    {errors.documentType}
                  </Typography>
                )}
              </FormControl>
              <TextField
                fullWidth
                label="Número de Documento *"
                value={formData.documentNumber}
                onChange={handleInputChange('documentNumber')}
                error={!!errors.documentNumber}
                helperText={errors.documentNumber}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  },
                  '& .MuiFormHelperText-root.Mui-error': {
                    color: '#FF69B4',
                    fontWeight: 500,
                  }
                }}
              />
            </Box>

            {/* Username (opcional) */}
            <TextField
              fullWidth
              label="Nombre de Usuario (opcional)"
              value={formData.username}
              onChange={handleInputChange('username')}
              error={!!errors.username}
              helperText={errors.username}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                },
                '& .MuiFormHelperText-root.Mui-error': {
                  color: '#FF69B4',
                  fontWeight: 500,
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircle color="action" />
                  </InputAdornment>
                ),
              }}
            />

            {/* Location Selectors */}
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mb: 2, 
                  color: 'text.primary',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                📍 Ubicación
              </Typography>
              <LocationSelectors
                value={formData.location}
                onChange={handleLocationChange}
                error={errors.location}
                required={false}
              />
            </Box>

            {/* Contraseña */}
            <TextField
              fullWidth
              label="Contraseña *"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              error={!!errors.password}
              helperText={errors.password}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                },
                '& .MuiFormHelperText-root.Mui-error': {
                  color: '#FF69B4',
                  fontWeight: 500,
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Confirmar Contraseña */}
            <TextField
              fullWidth
              label="Confirmar Contraseña *"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                },
                '& .MuiFormHelperText-root.Mui-error': {
                  color: '#FF69B4',
                  fontWeight: 500,
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Register Button - Same style as LoginForm */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.8,
                fontSize: '1rem',
                fontWeight: 600,
                mb: 3,
                mt: 3,
                borderRadius: 6,
                textTransform: 'uppercase',
              }}
            >
              {loading ? 'Registrando...' : 'REGISTRARSE'}
            </Button>

            {/* Login Link - Same style as LoginForm */}
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" mb={2}>
                ¿Ya tienes una cuenta?{' '}
                <Button
                  variant="text"
                  onClick={handleLogin}
                  sx={{
                    textDecoration: 'underline',
                    fontSize: '0.875rem',
                    color: '#FF69B4',
                    p: 0,
                    minWidth: 'auto',
                    fontWeight: 500,
                  }}
                >
                  Inicia Sesión
                </Button>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterForm;