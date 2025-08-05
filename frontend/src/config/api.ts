import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token de acceso en memoria (más seguro que localStorage)
let accessToken: string | null = null;

// Establecer token de acceso
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

// Obtener token de acceso
export const getAccessToken = () => accessToken;

// Interceptor para agregar token de autorización
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    // Agregar headers de seguridad adicionales
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y renovación de tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no es una petición de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Intentar renovar el token
        const response = await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const { accessToken: newToken } = response.data;
        setAccessToken(newToken);

        // Reintentar la petición original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Si falla la renovación, limpiar tokens y redirigir al login
        setAccessToken(null);
        Cookies.remove('refreshToken');
        
        // Disparar evento personalizado para que la app maneje el logout
        window.dispatchEvent(new CustomEvent('auth:logout'));
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;