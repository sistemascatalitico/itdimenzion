import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User } from '../types/auth';
import api, { setAccessToken, getAccessToken } from '../config/api';
import DOMPurify from 'dompurify';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
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
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
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
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Función para sanitizar strings de entrada
  const sanitizeInput = (input: string): string => {
    return DOMPurify.sanitize(input.trim());
  };

  // Función para validar email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Función para validar contraseña - debe coincidir con backend
  const isValidPassword = (password: string): boolean => {
    return password.length >= 8 && 
           password.length <= 128 &&
           /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password);
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
      
      // Establecer token en memoria
      setAccessToken(accessToken);
      
      dispatch({ 
        type: 'AUTH_SUCCESS', 
        payload: { user } 
      });

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

  const logout = async () => {
    try {
      // Intentar cerrar sesión en el servidor
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Error cerrando sesión en el servidor:', error);
    } finally {
      // Limpiar estado local siempre
      setAccessToken(null);
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      dispatch({ 
        type: 'AUTH_SUCCESS', 
        payload: { user: response.data.user } 
      });
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

  // Verificar autenticación al cargar la app
  useEffect(() => {
    const initAuth = async () => {
      // Solo intentar refresh si hay posibilidad de token existente
      const hasToken = getAccessToken();
      
      if (!hasToken) {
        // No hay token, directamente logout sin intentar refresh
        dispatch({ type: 'AUTH_LOGOUT' });
        return;
      }

      try {
        dispatch({ type: 'AUTH_START' });
        
        // Intentar obtener el perfil (esto también refrescará el token si es necesario)
        await refreshProfile();
      } catch (error) {
        // Si falla, el usuario no está autenticado - no hacer log de error
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    initAuth();
  }, []);

  // Escuchar eventos de logout automático
  useEffect(() => {
    const handleAutoLogout = () => {
      dispatch({ type: 'AUTH_LOGOUT' });
    };

    window.addEventListener('auth:logout', handleAutoLogout);
    
    return () => {
      window.removeEventListener('auth:logout', handleAutoLogout);
    };
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    register,
    clearError,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};