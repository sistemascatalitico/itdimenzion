import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { assignAsset, unassignAsset } from '../controllers/assetAssignments.controller';

const router: Router = Router();

router.post('/assets/:id/assign', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), assignAsset);
router.post('/assets/:id/unassign', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), unassignAsset);

export default router;
