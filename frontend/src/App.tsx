import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, Typography } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import secureTheme from './theme/theme';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './components/layout/Dashboard';
import ProtectedRoute from './components/common/ProtectedRoute';

/**
 * Root redirect component - redirects to appropriate route based on auth status
 */
const RootRedirect: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <Typography>Verificando autenticación...</Typography>
    </Box>;
  }
  
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
};

/**
 * Main app content with routing configuration
 */
const AppContent: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />
        
        {/* Public routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        
        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Catch all route - redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

/**
 * Root application component with all providers
 */
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