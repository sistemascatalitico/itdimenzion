import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { addAssetDocument, listAssetDocuments } from '../controllers/assetDocuments.controller';

const router = Router();

router.get('/assets/:id/documents', authenticateToken, listAssetDocuments);
router.post('/assets/:id/documents', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), addAssetDocument);

export default router;
