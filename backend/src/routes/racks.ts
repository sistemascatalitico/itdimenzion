import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { listRacks, createRack, assignToRack, removeFromRack } from '../controllers/racks.controller';

const router = Router();

router.get('/racks', authenticateToken, listRacks);
router.post('/racks', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), createRack);
router.post('/racks/:id/assign', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), assignToRack);
router.delete('/racks/assignments/:assignmentId', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), removeFromRack);

export default router;
