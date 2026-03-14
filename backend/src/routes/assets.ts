import { Router } from 'express';
import { listAssets, getAsset, createAsset, updateAsset, deleteAsset, getAssetHistory, getAssetConnections, getAssetTickets, getAssetKnowledgeBase } from '../controllers/assets.controller';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { users_role } from '@prisma/client';

const router = Router();

// Todas las rutas requieren autenticación
router.get('/assets', authenticateToken, listAssets);
router.get('/assets/:id', authenticateToken, getAsset);
// Crear y editar requieren rol SUPER_ADMIN o ADMIN
router.post('/assets', authenticateToken, requireRole([users_role.SUPER_ADMIN, users_role.ADMIN]), createAsset);
router.put('/assets/:id', authenticateToken, requireRole([users_role.SUPER_ADMIN, users_role.ADMIN]), updateAsset);
router.delete('/assets/:id', authenticateToken, requireRole([users_role.SUPER_ADMIN, users_role.ADMIN]), deleteAsset);

// Endpoints de información relacionada (solo autenticación requerida)
router.get('/assets/:id/history', authenticateToken, getAssetHistory);
router.get('/assets/:id/connections', authenticateToken, getAssetConnections);
router.get('/assets/:id/tickets', authenticateToken, getAssetTickets);
router.get('/assets/:id/knowledge-base', authenticateToken, getAssetKnowledgeBase);

export default router;


