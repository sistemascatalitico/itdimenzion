import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { 
  register, 
  login, 
  logout, 
  refreshToken, 
  getProfile 
} from '../controllers/auth.controller';
import { 
  authenticateToken, 
  requireRole 
} from '../middleware/auth';
import { 
  registerValidation, 
  loginValidation 
} from '../middleware/validation';
import { authRateLimit } from '../middleware/security';

const router: Router = Router();

// Rutas públicas (con rate limiting más estricto)
router.post('/register', authRateLimit, registerValidation, register);
router.post('/login', authRateLimit, loginValidation, login);
router.post('/refresh-token', refreshToken);

// Rutas protegidas
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);

// Ruta de prueba para verificar autenticación
router.get('/test', authenticateToken, (req: AuthenticatedRequest, res) => {
  res.json({
    message: 'Autenticación funciona correctamente',
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

// Ruta de prueba para verificar roles de administrador
router.get('/admin-test', 
  authenticateToken, 
  requireRole(['SUPER_ADMIN', 'ADMIN']), 
  (req: AuthenticatedRequest, res) => {
    res.json({
      message: 'Acceso de administrador funciona correctamente',
      user: req.user,
      timestamp: new Date().toISOString(),
    });
  }
);

export default router;