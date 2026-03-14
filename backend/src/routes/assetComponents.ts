import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { listComponents, addComponent, removeComponent, moveComponent } from '../controllers/assetComponents.controller';

const router = Router();

router.get('/assets/:id/components', authenticateToken, listComponents);
router.post('/assets/:id/components', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), addComponent);
router.delete('/assets/:id/components/:compId', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), removeComponent);
router.post('/assets/:id/components/:compId/move', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), moveComponent);

export default router;
