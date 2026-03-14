import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { transferAsset, createLoan, returnLoan } from '../controllers/assetTransfers.controller';

const router: Router = Router();

router.post('/assets/:id/transfer', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), transferAsset);
router.post('/assets/:id/loan', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), createLoan);
router.post('/assets/:id/loan/return', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), returnLoan);

export default router;
