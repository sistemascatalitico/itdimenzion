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
import SimplePhoneInput from '../common/SimplePhoneInput';
import SecureLocationSelectors from '../common/SecureLocationSelectors';
import { useMultiStep } from '../../hooks/useMultiStep';
import { StepNavigator, ProgressBar } from '../common/MultiStepForm';

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
  country: string;
  state: string;
  city: string;
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
  
  // Multi-step navigation
  const TOTAL_STEPS = 3;
  const { currentStep, next, prev, goTo, isFirst, isLast } = useMultiStep({ 
    steps: TOTAL_STEPS 
  });
  
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
      country: '',
      state: '',
      city: ''
    }
  });

  const [errors, setErrors] = useState<RegisterErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estilos uniformes para todos los campos
  const fieldStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1,
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
    '& .MuiFormHelperText-root.Mui-error': {
      color: '#FF69B4',
      fontWeight: 500,
    }
  };

  // Validación por pasos
  const validateStep = (step: number): boolean => {
    const newErrors: RegisterErrors = {};
    
    switch (step) {
      case 0: // Datos Personales
        if (!formData.firstName.trim()) {
          newErrors.firstName = 'El nombre es obligatorio';
        }
        if (!formData.lastName.trim()) {
          newErrors.lastName = 'El apellido es obligatorio';
        }
        if (!formData.documentType) {
          newErrors.documentType = 'Seleccione un tipo de documento';
        }
        if (!formData.documentNumber.trim()) {
          newErrors.documentNumber = 'El número de documento es obligatorio';
        }
        if (!formData.email.trim()) {
          newErrors.email = 'El email es obligatorio';
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Ingrese un email válido';
          }
        }
        break;
        
      case 1: // Ubicación (opcional)
        // Validaciones opcionales de ubicación si se requieren
        break;
        
      case 2: // Contraseñas
        if (!formData.password) {
          newErrors.password = 'La contraseña es obligatoria';
        } else if (formData.password.length < 8) {
          newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
        } else if (formData.password.length > 128) {
          newErrors.password = 'La contraseña no puede exceder 128 caracteres';
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(formData.password)) {
          newErrors.password = 'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial';
        }
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Confirme su contraseña';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAllSteps = (): boolean => {
    return validateStep(0) && validateStep(1) && validateStep(2);
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

  // Manejo de navegación
  const handleNext = () => {
    if (validateStep(currentStep)) {
      next();
    }
  };

  const handlePrev = () => {
    // Limpiar errores del paso anterior
    setErrors({});
    prev();
  };

  const handleStepClick = (step: number) => {
    // Validar pasos anteriores antes de saltar
    let canNavigate = true;
    for (let i = 0; i < step; i++) {
      if (!validateStep(i)) {
        canNavigate = false;
        break;
      }
    }
    if (canNavigate) {
      goTo(step);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateAllSteps()) {
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

  // Funciones de renderizado por pasos
  const renderPersonalDataStep = () => (
    <Box>
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 3, 
          textAlign: 'center', 
          color: '#FF69B4',
          fontWeight: 600 
        }}
      >
        📋 Datos Personales
      </Typography>
      
      {/* Nombre - Campo completo */}
      <TextField
        fullWidth
        label="Nombre *"
        value={formData.firstName}
        onChange={handleInputChange('firstName')}
        error={!!errors.firstName}
        helperText={errors.firstName}
        margin="normal"
        sx={fieldStyles}
      />

      {/* Apellido - Campo completo */}
      <TextField
        fullWidth
        label="Apellido *"
        value={formData.lastName}
        onChange={handleInputChange('lastName')}
        error={!!errors.lastName}
        helperText={errors.lastName}
        margin="normal"
        sx={fieldStyles}
      />

      {/* Tipo de Documento - Campo completo */}
      <FormControl 
        fullWidth 
        error={!!errors.documentType}
        margin="normal"
        sx={fieldStyles}
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

      {/* Número de Documento - Campo completo */}
      <TextField
        fullWidth
        label="Número de Documento *"
        value={formData.documentNumber}
        onChange={handleInputChange('documentNumber')}
        error={!!errors.documentNumber}
        helperText={errors.documentNumber}
        margin="normal"
        sx={fieldStyles}
      />

      {/* Email - Campo completo */}
      <TextField
        fullWidth
        label="Email *"
        type="email"
        value={formData.email}
        onChange={handleInputChange('email')}
        error={!!errors.email}
        helperText={errors.email}
        margin="normal"
        sx={fieldStyles}
      />

      {/* Phone Input */}
      <Box sx={{ mt: 2 }}>
        <SimplePhoneInput
          value={formData.phone}
          onChange={handlePhoneChange}
          error={!!errors.phone}
          helperText={errors.phone}
          label="Teléfono"
          placeholder="300 123 4567"
          required={false}
        />
      </Box>
    </Box>
  );

  const renderLocationStep = () => (
    <Box>
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 3, 
          textAlign: 'center', 
          color: '#FF69B4',
          fontWeight: 600 
        }}
      >
        📍 Ubicación
      </Typography>
      
      <SecureLocationSelectors
        value={formData.location}
        onChange={handleLocationChange}
        error={errors.location}
        required={false}
        enableDynamicLoading={false}
      />

      <Typography 
        variant="body2" 
        color="text.secondary"
        sx={{ mt: 2, textAlign: 'center', fontStyle: 'italic' }}
      >
        La información de ubicación es opcional pero nos ayuda a brindarte un mejor servicio
      </Typography>
    </Box>
  );

  const renderPasswordStep = () => (
    <Box>
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 3, 
          textAlign: 'center', 
          color: '#FF69B4',
          fontWeight: 600 
        }}
      >
        🔐 Seguridad
      </Typography>

      {/* Contraseña - Campo completo */}
      <TextField
        fullWidth
        label="Contraseña *"
        type={showPassword ? 'text' : 'password'}
        value={formData.password}
        onChange={handleInputChange('password')}
        error={!!errors.password}
        helperText={errors.password}
        margin="normal"
        sx={fieldStyles}
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

      {/* Confirmar Contraseña - Campo completo */}
      <TextField
        fullWidth
        label="Confirmar Contraseña *"
        type={showConfirmPassword ? 'text' : 'password'}
        value={formData.confirmPassword}
        onChange={handleInputChange('confirmPassword')}
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword}
        margin="normal"
        sx={fieldStyles}
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
    </Box>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderPersonalDataStep();
      case 1:
        return renderLocationStep();
      case 2:
        return renderPasswordStep();
      default:
        return renderPersonalDataStep();
    }
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
        position: 'minHeight: 100vh',
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

          {/* Progress Bar */}
          <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

          {/* Multi-Step Form */}
          <Box component="form" onSubmit={isLast ? handleSubmit : undefined}>
            {/* Render Current Step */}
            {renderStep()}

            {/* Step Navigator */}
            <StepNavigator
              currentStep={currentStep}
              totalSteps={TOTAL_STEPS}
              onNext={isLast ? handleSubmit : handleNext}
              onPrev={handlePrev}
              onStepClick={handleStepClick}
              isFirst={isFirst}
              isLast={isLast}
              canGoNext={true}
              nextLabel={isLast ? undefined : "Siguiente"}
            />

            {/* Login Link */}
            <Box textAlign="center" sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
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
                    '&:hover': {
                      backgroundColor: 'transparent',
                      textDecoration: 'underline'
                    }
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