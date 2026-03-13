import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '../types/auth';
import api, { setAccessToken, getAccessToken } from '../config/api';
import DOMPurify from 'dompurify';

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

interface AuthState {
  // Estado
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  lastActivity: number;
  sessionWarning: boolean;
  
  // Acciones
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
  updateLastActivity: () => void;
  dismissSessionWarning: () => void;
  
  // Acciones internas
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLastActivity: (time: number) => void;
  setSessionWarning: (warning: boolean) => void;
}

// Configuración de timeouts
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 horas en millisegundos
const WARNING_TIME = 10 * 60 * 1000; // Mostrar warning 10 minutos antes
const CHECK_INTERVAL = 5 * 60 * 1000; // Verificar cada 5 minutos

// Referencias para timeouts
let timeoutRef: NodeJS.Timeout | null = null;
let warningRef: NodeJS.Timeout | null = null;
let checkIntervalRef: NodeJS.Timeout | null = null;

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
  if (timeoutRef) {
    clearTimeout(timeoutRef);
    timeoutRef = null;
  }
  if (warningRef) {
    clearTimeout(warningRef);
    warningRef = null;
  }
  if (checkIntervalRef) {
    clearInterval(checkIntervalRef);
    checkIntervalRef = null;
  }
};

// Función para configurar el timeout de sesión
const setupSessionTimeout = (get: () => AuthState) => {
  clearAllTimeouts();
  
  const state = get();
  if (!state.isAuthenticated) return;
  
  // Configurar warning
  warningRef = setTimeout(() => {
    const currentState = get();
    if (currentState.isAuthenticated) {
      get().setSessionWarning(true);
    }
  }, SESSION_TIMEOUT - WARNING_TIME);
  
  // Configurar logout automático
  timeoutRef = setTimeout(() => {
    const currentState = get();
    if (currentState.isAuthenticated) {
      get().logout();
    }
  }, SESSION_TIMEOUT);
};

// Función para verificar inactividad
const checkInactivity = (get: () => AuthState) => {
  const state = get();
  if (!state.isAuthenticated) return;
  
  const now = Date.now();
  const timeSinceLastActivity = now - state.lastActivity;
  
  if (timeSinceLastActivity >= SESSION_TIMEOUT) {
    get().logout();
  } else if (timeSinceLastActivity >= SESSION_TIMEOUT - WARNING_TIME) {
    if (!state.sessionWarning) {
      get().setSessionWarning(true);
    }
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      lastActivity: Date.now(),
      sessionWarning: false,
      
      // Acciones de estado
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      setUser: (user: User | null) => set({ user }),
      setAuthenticated: (authenticated: boolean) => set({ isAuthenticated: authenticated }),
      setLastActivity: (time: number) => set({ lastActivity: time }),
      setSessionWarning: (warning: boolean) => set({ sessionWarning: warning }),
      
      // Acciones principales
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          // Validar entrada
          const sanitizedEmail = sanitizeInput(email).toLowerCase();
          
          if (!isValidEmail(sanitizedEmail)) {
            const errorMessage = 'Email no válido';
            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
          }
          
          if (!password || password.length < 6) {
            const errorMessage = 'Contraseña debe tener al menos 6 caracteres';
            set({ isLoading: false, error: errorMessage });
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
          
          set({
            isLoading: false,
            isAuthenticated: true,
            user,
            error: null,
            lastActivity: Date.now(),
          });
          
          // Configurar timeout de sesión
          setupSessionTimeout(get);
          
          // Iniciar verificación periódica de inactividad
          checkIntervalRef = setInterval(() => checkInactivity(get), CHECK_INTERVAL);
          
          return { success: true };
          
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Error en el login';
          set({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            error: errorMessage,
          });
          return { success: false, error: errorMessage };
        }
      },
      
      register: async (userData: RegisterData) => {
        try {
          set({ isLoading: true, error: null });
          
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
            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
          }
          
          if (!isValidPassword(userData.password)) {
            const errorMessage = 'La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos';
            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
          }
          
          if (sanitizedData.firstName.length < 2 || sanitizedData.lastName.length < 2) {
            const errorMessage = 'Nombre y apellido deben tener al menos 2 caracteres';
            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
          }
          
          const response = await api.post('/auth/register', sanitizedData);
          
          // No hacer login automático por seguridad
          set({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            error: null,
          });
          
          return { success: true };
          
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Error en el registro';
          set({
            isLoading: false,
            error: errorMessage,
          });
          return { success: false, error: errorMessage };
        }
      },
      
      logout: async () => {
        try {
          // Solo hacer petición al servidor si es logout manual
          await api.post('/auth/logout');
        } catch (error) {
          console.warn('Error cerrando sesión en el servidor:', error);
        } finally {
          // Limpiar estado local siempre
          clearAllTimeouts();
          setAccessToken(null);
          localStorage.removeItem('user');
          localStorage.removeItem('loginTime');
          
          set({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            error: null,
            sessionWarning: false,
          });
          
          // Mostrar notificación de sesión expirada
          window.dispatchEvent(new CustomEvent('session-expired'));
        }
      },
      
      refreshProfile: async () => {
        try {
          const response = await api.get('/auth/profile');
          const user = response.data.user;
          
          set({ user });
          
          // Actualizar usuario en localStorage
          localStorage.setItem('user', JSON.stringify(user));
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Error obteniendo perfil';
          set({ error: errorMessage });
        }
      },
      
      clearError: () => set({ error: null }),
      
      updateLastActivity: () => {
        const state = get();
        if (state.isAuthenticated) {
          set({ lastActivity: Date.now(), sessionWarning: false });
          setupSessionTimeout(get);
        }
      },
      
      dismissSessionWarning: () => {
        set({ sessionWarning: false });
        get().updateLastActivity(); // Reiniciar el timer
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity,
      }),
    }
  )
);

// Función para inicializar la autenticación
export const initializeAuth = () => {
  const hasToken = getAccessToken();
  const storedUser = localStorage.getItem('user');
  const loginTime = localStorage.getItem('loginTime');
  
  if (!hasToken || !storedUser || !loginTime) {
    useAuthStore.getState().setAuthenticated(false);
    useAuthStore.getState().setUser(null);
    return;
  }
  
  // Verificar si la sesión ha expirado (solo si es muy antigua)
  const now = Date.now();
  const sessionAge = now - parseInt(loginTime);
  
  if (sessionAge >= SESSION_TIMEOUT * 2) { // Solo cerrar si es el doble del timeout
    useAuthStore.getState().logout();
    return;
  }
  
  try {
    const user = JSON.parse(storedUser);
    
    useAuthStore.getState().setUser(user);
    useAuthStore.getState().setAuthenticated(true);
    
    // Intentar refrescar el perfil
    useAuthStore.getState().refreshProfile();
    
    // Configurar timeouts
    setupSessionTimeout(useAuthStore.getState);
    checkIntervalRef = setInterval(() => checkInactivity(useAuthStore.getState), CHECK_INTERVAL);
    
  } catch (error) {
    useAuthStore.getState().setAuthenticated(false);
    useAuthStore.getState().setUser(null);
  }
};

// Función para configurar listeners de actividad del usuario
export const setupActivityListeners = () => {
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  const handleUserActivity = () => {
    useAuthStore.getState().updateLastActivity();
  };
  
  events.forEach(event => {
    document.addEventListener(event, handleUserActivity, true);
  });
  
  return () => {
    events.forEach(event => {
      document.removeEventListener(event, handleUserActivity, true);
    });
  };
};

// Función para configurar listener de visibilidad
export const setupVisibilityListener = () => {
  const handleVisibilityChange = () => {
    const state = useAuthStore.getState();
    if (!document.hidden && state.isAuthenticated) {
      // Solo actualizar actividad cuando la ventana vuelve a ser visible
      state.updateLastActivity();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};
