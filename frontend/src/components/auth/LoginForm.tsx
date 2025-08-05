import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
  Link,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Security,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../types/auth';

// Esquema de validación con Yup
const loginSchema = yup.object({
  email: yup
    .string()
    .required('Email es requerido')
    .email('Email debe ser válido')
    .max(255, 'Email no puede exceder 255 caracteres'),
  password: yup
    .string()
    .required('Contraseña es requerida')
    .min(8, 'Contraseña debe tener al menos 8 caracteres'),
});

interface LoginFormProps {
  onSwitchToRegister?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState(0);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<LoginCredentials>({
    resolver: yupResolver(loginSchema),
    mode: 'onChange',
  });

  // Manejar bloqueo temporal por múltiples intentos fallidos
  useEffect(() => {
    if (loginAttempts >= 3) {
      setIsBlocked(true);
      setBlockTimeLeft(300); // 5 minutos

      const interval = setInterval(() => {
        setBlockTimeLeft((prev) => {
          if (prev <= 1) {
            setIsBlocked(false);
            setLoginAttempts(0);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [loginAttempts]);

  // Limpiar errores cuando el usuario comience a escribir
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const onSubmit = async (data: LoginCredentials) => {
    if (isBlocked) return;

    try {
      await login(data.email, data.password);
      setLoginAttempts(0);
      reset();
    } catch (error) {
      setLoginAttempts((prev) => prev + 1);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          maxWidth: 400,
          width: '100%',
          borderRadius: 2,
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Security sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            ITDimenzion
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Acceso Seguro al Sistema
          </Typography>
        </Box>

        {/* Alertas de seguridad */}
        {isBlocked && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Cuenta temporalmente bloqueada por múltiples intentos fallidos.
            <br />
            Tiempo restante: {formatTime(blockTimeLeft)}
          </Alert>
        )}

        {loginAttempts > 0 && loginAttempts < 3 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Intento {loginAttempts} de 3. Después del 3er intento fallido, 
            la cuenta será bloqueada temporalmente.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Controller
            name="email"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Correo Electrónico"
                type="email"
                autoComplete="email"
                disabled={isLoading || isBlocked}
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                disabled={isLoading || isBlocked}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePassword}
                        disabled={isLoading || isBlocked}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
            )}
          />

          {/* Opciones adicionales */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading || isBlocked}
                />
              }
              label="Recordar sesión"
            />
            <Link
              href="#"
              variant="body2"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implementar recuperación de contraseña
              }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </Box>

          {/* Botón de login */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading || isBlocked || !isValid}
            sx={{ mb: 2 }}
          >
            {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
          </Button>

          {/* Divider */}
          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              o
            </Typography>
          </Divider>

          {/* Link a registro */}
          {onSwitchToRegister && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                ¿No tienes cuenta?{' '}
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onSwitchToRegister();
                  }}
                  sx={{ cursor: 'pointer' }}
                >
                  Regístrate aquí
                </Link>
              </Typography>
            </Box>
          )}
        </form>

        {/* Footer de seguridad */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            🔒 Conexión segura con cifrado SSL/TLS
            <br />
            🛡️ Sistema protegido contra ataques
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginForm;