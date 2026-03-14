import React, { createContext, useContext, useReducer, useEffect, ReactNode, useRef } from 'react';
import { User } from '../types/auth';
import api, { setAccessToken, getAccessToken } from '../config/api';
import DOMPurify from 'dompurify';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  lastActivity: number;
  sessionWarning: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
  updateLastActivity: () => void;
  dismissSessionWarning: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  phone?: string;
  headquartersId: number;
  jobTitleId?: number;
  processId?: number;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User } }
  | { type: 'AUTH_FAILURE'; payload: { error: string } }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_ACTIVITY' }
  | { type: 'SESSION_WARNING'; payload: { show: boolean } };

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  lastActivity: Date.now(),
  sessionWarning: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        error: null,
        lastActivity: Date.now(),
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload.error,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: null,
        sessionWarning: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        lastActivity: Date.now(),
        sessionWarning: false,
      };
    case 'SESSION_WARNING':
      return {
        ...state,
        sessionWarning: action.payload.show,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Re-exportar el hook de Zustand para que cualquier import desde este archivo
// use el mismo estado global y no exija AuthProvider (evita el error en consola).
export { useAuth } from '../hooks/useAuth';

interface AuthProviderProps {
  children: ReactNode;
}

// Configuración de timeouts
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 horas en millisegundos
const WARNING_TIME = 10 * 60 * 1000; // Mostrar warning 10 minutos antes
const CHECK_INTERVAL = 5 * 60 * 1000; // Verificar cada 5 minutos

// Provider mínimo: la app usa Zustand (ZustandProvider). Este provider solo
// cumple la firma por si algo lo usa; no duplica estado.
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return <>{children}</>;
};

const AuthProviderLegacy: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para sanitizar strings de entrada
  const sanitizeInput = (input: string): string => {
    return DOMPurify.sanitize(input.trim());
  };

  // Función para validar email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Función para validar contraseña
  const isValidPassword = (password: string): boolean => {
    return password.length >= 8 && 
           password.length <= 128 &&
           /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password);
  };

  // Función para limpiar todos los timeouts
  const clearAllTimeouts = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  };

  // Función para actualizar actividad del usuario
  const updateLastActivity = () => {
    if (state.isAuthenticated) {
      dispatch({ type: 'UPDATE_ACTIVITY' });
      setupSessionTimeout();
    }
  };

  // Función para configurar el timeout de sesión
  const setupSessionTimeout = () => {
    clearAllTimeouts();

    if (!state.isAuthenticated) return;

    // Configurar warning
    warningRef.current = setTimeout(() => {
      if (state.isAuthenticated) {
        dispatch({ type: 'SESSION_WARNING', payload: { show: true } });
      }
    }, SESSION_TIMEOUT - WARNING_TIME);

    // Configurar logout automático
    timeoutRef.current = setTimeout(() => {
      if (state.isAuthenticated) {
        logout(true); // true indica que es logout automático
      }
    }, SESSION_TIMEOUT);
  };

  // Función para verificar inactividad
  const checkInactivity = () => {
    if (!state.isAuthenticated) return;

    const now = Date.now();
    const timeSinceLastActivity = now - state.lastActivity;

    if (timeSinceLastActivity >= SESSION_TIMEOUT) {
      logout(true);
    } else if (timeSinceLastActivity >= SESSION_TIMEOUT - WARNING_TIME) {
      if (!state.sessionWarning) {
        dispatch({ type: 'SESSION_WARNING', payload: { show: true } });
      }
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: 'AUTH_START' });

      // Validar entrada
      const sanitizedEmail = sanitizeInput(email).toLowerCase();
      
      if (!isValidEmail(sanitizedEmail)) {
        const errorMessage = 'Email no válido';
        dispatch({ 
          type: 'AUTH_FAILURE', 
          payload: { error: errorMessage } 
        });
        return { success: false, error: errorMessage };
      }

      if (!password || password.length < 6) {
        const errorMessage = 'Contraseña debe tener al menos 6 caracteres';
        dispatch({ 
          type: 'AUTH_FAILURE', 
          payload: { error: errorMessage } 
        });
        return { success: false, error: errorMessage };
      }

      const response = await api.post('/auth/login', {
        email: sanitizedEmail,
        password: password,
      });

      const { accessToken, user } = response.data;
      
      // Establecer token en memoria y localStorage para persistencia
      setAccessToken(accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('loginTime', Date.now().toString());
      
      dispatch({ 
        type: 'AUTH_SUCCESS', 
        payload: { user } 
      });

      // Configurar timeout de sesión
      setupSessionTimeout();
      
      // Iniciar verificación periódica de inactividad
      checkIntervalRef.current = setInterval(checkInactivity, CHECK_INTERVAL);

      return { success: true };

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error en el login';
      dispatch({ 
        type: 'AUTH_FAILURE', 
        payload: { error: errorMessage } 
      });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: 'AUTH_START' });

      // Sanitizar datos de entrada
      const sanitizedData = {
        ...userData,
        email: sanitizeInput(userData.email).toLowerCase(),
        firstName: sanitizeInput(userData.firstName),
        lastName: sanitizeInput(userData.lastName),
        documentNumber: sanitizeInput(userData.documentNumber),
        phone: userData.phone ? sanitizeInput(userData.phone) : undefined,
      };

      // Validaciones del cliente
      if (!isValidEmail(sanitizedData.email)) {
        const errorMessage = 'Email no válido';
        dispatch({ 
          type: 'AUTH_FAILURE', 
          payload: { error: errorMessage } 
        });
        return { success: false, error: errorMessage };
      }

      if (!isValidPassword(userData.password)) {
        const errorMessage = 'La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos';
        dispatch({ 
          type: 'AUTH_FAILURE', 
          payload: { error: errorMessage } 
        });
        return { success: false, error: errorMessage };
      }

      if (sanitizedData.firstName.length < 2 || sanitizedData.lastName.length < 2) {
        const errorMessage = 'Nombre y apellido deben tener al menos 2 caracteres';
        dispatch({ 
          type: 'AUTH_FAILURE', 
          payload: { error: errorMessage } 
        });
        return { success: false, error: errorMessage };
      }

      const response = await api.post('/auth/register', sanitizedData);

      // No hacer login automático por seguridad
      dispatch({ type: 'AUTH_LOGOUT' });
      return { success: true };

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error en el registro';
      dispatch({ 
        type: 'AUTH_FAILURE', 
        payload: { error: errorMessage } 
      });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async (isAutomatic = false) => {
    try {
      if (!isAutomatic) {
        // Solo hacer petición al servidor si es logout manual
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.warn('Error cerrando sesión en el servidor:', error);
    } finally {
      // Limpiar estado local siempre
      clearAllTimeouts();
      setAccessToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('loginTime');
      dispatch({ type: 'AUTH_LOGOUT' });
      
      if (isAutomatic) {
        // Mostrar notificación de sesión expirada
        window.dispatchEvent(new CustomEvent('session-expired'));
      }
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      dispatch({ 
        type: 'AUTH_SUCCESS', 
        payload: { user: response.data.user } 
      });
      
      // Actualizar usuario en localStorage
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error obteniendo perfil';
      dispatch({ 
        type: 'AUTH_FAILURE', 
        payload: { error: errorMessage } 
      });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const dismissSessionWarning = () => {
    dispatch({ type: 'SESSION_WARNING', payload: { show: false } });
    updateLastActivity(); // Reiniciar el timer
  };

  // Verificar autenticación al cargar la app
  useEffect(() => {
    const initAuth = async () => {
      const hasToken = getAccessToken();
      const storedUser = localStorage.getItem('user');
      const loginTime = localStorage.getItem('loginTime');
      
      if (!hasToken || !storedUser || !loginTime) {
        dispatch({ type: 'AUTH_LOGOUT' });
        return;
      }

      // Verificar si la sesión ha expirado (solo si es muy antigua)
      const now = Date.now();
      const sessionAge = now - parseInt(loginTime);
      
      if (sessionAge >= SESSION_TIMEOUT * 2) { // Solo cerrar si es el doble del timeout
        logout(true);
        return;
      }

      try {
        dispatch({ type: 'AUTH_START' });
        const user = JSON.parse(storedUser);
        
        // Intentar refrescar el perfil
        await refreshProfile();
        
        // Si llegamos aquí, la sesión es válida
        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { user } 
        });
        
        // Configurar timeouts
        setupSessionTimeout();
        checkIntervalRef.current = setInterval(checkInactivity, CHECK_INTERVAL);
        
      } catch (error) {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    initAuth();
  }, []);

  // Escuchar eventos de actividad del usuario
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleUserActivity = () => {
      updateLastActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, [state.isAuthenticated]);

  // Manejar visibilidad de la ventana (sin cerrar sesión automáticamente)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && state.isAuthenticated) {
        // Solo actualizar actividad cuando la ventana vuelve a ser visible
        updateLastActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.isAuthenticated]);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout: () => logout(false),
    register,
    clearError,
    refreshProfile,
    updateLastActivity,
    dismissSessionWarning,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};