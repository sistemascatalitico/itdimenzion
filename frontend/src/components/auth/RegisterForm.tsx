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

// Country data with flags and phone codes
const countries = [
  { code: 'CO', name: 'Colombia', phone: '+57', flag: '🇨🇴' },
  { code: 'US', name: 'Estados Unidos', phone: '+1', flag: '🇺🇸' },
  { code: 'MX', name: 'México', phone: '+52', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', phone: '+54', flag: '🇦🇷' },
  { code: 'BR', name: 'Brasil', phone: '+55', flag: '🇧🇷' },
  { code: 'CL', name: 'Chile', phone: '+56', flag: '🇨🇱' },
  { code: 'PE', name: 'Perú', phone: '+51', flag: '🇵🇪' },
  { code: 'EC', name: 'Ecuador', phone: '+593', flag: '🇪🇨' },
  { code: 'VE', name: 'Venezuela', phone: '+58', flag: '🇻🇪' },
  { code: 'ES', name: 'España', phone: '+34', flag: '🇪🇸' },
];

// Document types
const documentTypes = [
  { value: 'CEDULA', label: 'Cédula de Ciudadanía' },
  { value: 'TARJETA_IDENTIDAD', label: 'Tarjeta de Identidad' },
  { value: 'CEDULA_EXTRANJERIA', label: 'Cédula de Extranjería' },
  { value: 'PASSPORT', label: 'Pasaporte' },
  { value: 'NIT', label: 'NIT' },
  { value: 'RUT', label: 'RUT' },
];

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

    // Contraseña
    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
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

  // Detect country by phone number
  const detectCountryByPhone = (phoneNumber: string) => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    for (const country of countries) {
      const countryCode = country.phone.replace('+', '');
      if (cleanPhone.startsWith(countryCode)) {
        return country.code;
      }
    }
    return 'CO'; // default
  };

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const phoneValue = event.target.value;
    setFormData(prev => ({ 
      ...prev, 
      phone: phoneValue,
      countryCode: detectCountryByPhone(phoneValue)
    }));
    
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: undefined }));
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
      const selectedCountry = countries.find(c => c.code === formData.countryCode);
      const fullPhoneNumber = formData.phone ? `${selectedCountry?.phone}${formData.phone.replace(/^\+?\d{1,3}/, '')}` : undefined;
      
      const result = await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(), 
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: fullPhoneNumber,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber.trim(),
        headquartersId: "1", // Default - should be selected in real app
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

  const selectedCountry = countries.find(c => c.code === formData.countryCode);

  return (
    <Box
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

            {/* Phone with Smart Country Detection */}
            <TextField
              fullWidth
              label="Teléfono"
              value={formData.phone}
              onChange={handlePhoneChange}
              error={!!errors.phone}
              helperText={errors.phone}
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
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mr: 1.5, 
                      gap: 1,
                      backgroundColor: 'rgba(0,0,0,0.03)',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      border: '1px solid rgba(0,0,0,0.1)'
                    }}>
                      <span style={{ 
                        fontSize: '1.4em',
                        lineHeight: 1,
                        display: 'inline-block'
                      }}>
                        {selectedCountry?.flag || '🇨🇴'}
                      </span>
                      <span style={{ 
                        fontSize: '0.875rem', 
                        color: '#666',
                        fontWeight: 600,
                        minWidth: '35px'
                      }}>
                        {selectedCountry?.phone || '+57'}
                      </span>
                    </Box>
                  </InputAdornment>
                ),
              }}
              placeholder="Ingresa tu número completo"
            />

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