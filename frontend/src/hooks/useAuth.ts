import { useAuthStore } from '../stores/authStore';

// Hook personalizado para usar el store de autenticación
export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    // Estado
    user: store.user,
    isLoading: store.isLoading,
    isAuthenticated: store.isAuthenticated,
    error: store.error,
    lastActivity: store.lastActivity,
    sessionWarning: store.sessionWarning,
    
    // Acciones
    login: store.login,
    logout: store.logout,
    register: store.register,
    clearError: store.clearError,
    refreshProfile: store.refreshProfile,
    updateLastActivity: store.updateLastActivity,
    dismissSessionWarning: store.dismissSessionWarning,
  };
};
