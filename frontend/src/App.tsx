import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import secureTheme from './theme/theme';
import LoginForm from './components/auth/LoginForm';
import Dashboard from './components/layout/Dashboard';

// Componente principal de la aplicación
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar indicador de carga durante la inicialización
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Mostrar dashboard si está autenticado, login si no
  return isAuthenticated ? <Dashboard /> : <LoginForm />;
};

// Componente raíz con todos los providers
const App: React.FC = () => {
  return (
    <ThemeProvider theme={secureTheme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;