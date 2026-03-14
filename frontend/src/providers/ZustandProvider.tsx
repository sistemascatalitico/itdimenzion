import React, { useEffect, ReactNode } from 'react';
import { initializeAuth, setupActivityListeners, setupVisibilityListener } from '../stores/authStore';

interface ZustandProviderProps {
  children: ReactNode;
}

export const ZustandProvider: React.FC<ZustandProviderProps> = ({ children }) => {
  useEffect(() => {
    // Inicializar autenticación
    initializeAuth();
    
    // Configurar listeners de actividad
    const cleanupActivity = setupActivityListeners();
    const cleanupVisibility = setupVisibilityListener();
    
    // Cleanup al desmontar
    return () => {
      cleanupActivity();
      cleanupVisibility();
    };
  }, []);
  
  return <>{children}</>;
};
