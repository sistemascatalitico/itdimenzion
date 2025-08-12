import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../common/LoadingScreen';
import SuccessMessage from '../common/SuccessMessage';

interface LoginData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState<LoginErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showInitialLoading, setShowInitialLoading] = useState(true);

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Ingrese un email válido';
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoginData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'rememberMe' ? event.target.checked : event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as keyof LoginErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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
      const result = await login(formData.email.trim().toLowerCase(), formData.password);
      
      if (result.success) {
        // Mostrar pantalla de carga
        setShowLoadingScreen(true);
      } else {
        setErrors({ general: result.error || 'Error en el inicio de sesión' });
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión. Verifique su conexión a internet.' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleLoadingComplete = () => {
    setShowLoadingScreen(false);
    setShowSuccessMessage(true);
  };

  const handleSuccessComplete = () => {
    setShowSuccessMessage(false);
    // Redirect based on user role or intended destination
    const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
    navigate(redirectTo);
  };

  const handleInitialLoadingComplete = () => {
    setShowInitialLoading(false);
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
        opacity: showInitialLoading ? 0 : 1,
        transition: 'opacity 0.5s ease-in-out',
        pointerEvents: showInitialLoading ? 'none' : 'auto',
      }}
    >
      <Card
        sx={{
          width: { xs: '90%', sm: '400px' },
          maxWidth: '400px',
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
              ¡Hola!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Para continuar, inicia sesión
            </Typography>
          </Box>

          {/* Error Message */}
          {errors.general && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.general}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit}>
            {/* Email Field */}
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              error={!!errors.email}
              helperText={errors.email}
              margin="normal"
              
            />

            {/* Password Field */}
            <TextField
              fullWidth
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              error={!!errors.password}
              helperText={errors.password}
              margin="normal"
              
              InputProps={{
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

            {/* Remember Me & Forgot Password */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 2,
                mb: 3,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.rememberMe}
                    onChange={handleInputChange('rememberMe')}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    Recordarme
                  </Typography>
                }
              />
              <Button
                variant="text"
                onClick={handleForgotPassword}
                sx={{
                  textDecoration: 'underline',
                  fontSize: '0.875rem',
                  color: 'primary.main',
                }}
              >
                ¿Olvidó su contraseña?
              </Button>
            </Box>

            {/* Login Button */}
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
                mt: 2,
                borderRadius: 6,
                textTransform: 'uppercase',
              }}
            >
              {loading ? 'Iniciando...' : 'INGRESAR'}
            </Button>

            {/* Register Link */}
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" mb={2}>
                ¿No tienes una cuenta?{' '}
                <Button
                  variant="text"
                  onClick={handleRegister}
                  sx={{
                    textDecoration: 'underline',
                    fontSize: '0.875rem',
                    color: '#FF69B4',
                    p: 0,
                    minWidth: 'auto',
                    fontWeight: 500,
                  }}
                >
                  Regístrate
                </Button>
              </Typography>
            </Box>
          </Box>

          {/* Footer */}
          <Box
            textAlign="center"
            mt={4}
            pt={3}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              © 2025 ITDimenzion. Todos los derechos reservados.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Pantalla de Carga Inicial */}
      <LoadingScreen 
        isVisible={showInitialLoading} 
        onComplete={handleInitialLoadingComplete}
        duration={1500}
      />

      {/* Pantalla de Carga */}
      <LoadingScreen 
        isVisible={showLoadingScreen} 
        onComplete={handleLoadingComplete}
        duration={1000}
      />

      {/* Mensaje de Éxito */}
      <SuccessMessage 
        isVisible={showSuccessMessage} 
        onComplete={handleSuccessComplete}
        message="¡Inicio de sesión exitoso!"
      />
    </Box>
  );
};

export default LoginForm;