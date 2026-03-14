import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  listAssetImages,
  uploadAssetImage,
  updateAssetImage,
  deleteAssetImage
} from '../controllers/assetImages.controller';
import {
  listAssetDocuments,
  getActiveDocuments,
  addAssetDocument,
  updateAssetDocument,
  deleteAssetDocument
} from '../controllers/assetDocuments.controller';
import {
  getResolvedAssetImages,
  getResolvedAssetDocuments,
  getResolvedAssetData
} from '../controllers/assetResolvedData.controller';
import { uploadImage, uploadDocument } from '../middleware/upload';

const router: Router = Router();

// Imágenes de activos (solo las del activo, no del modelo)
router.get('/assets/:assetId/images', authenticateToken, listAssetImages);
router.post('/assets/:assetId/images', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), uploadImage.single('image'), uploadAssetImage);
router.put('/assets/:assetId/images/:imageId', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), updateAssetImage);
router.delete('/assets/:assetId/images/:imageId', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), deleteAssetImage);

// Documentos de activos (solo los del activo, no del modelo)
router.get('/assets/:assetId/documents', authenticateToken, listAssetDocuments);
router.get('/assets/:assetId/documents/active', authenticateToken, getActiveDocuments);
router.post('/assets/:assetId/documents', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), uploadDocument.single('document'), addAssetDocument);
router.put('/assets/:assetId/documents/:docId', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), uploadDocument.single('document'), updateAssetDocument);
router.delete('/assets/:assetId/documents/:docId', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), deleteAssetDocument);

// Imágenes resueltas (modelo + activo combinados)
router.get('/assets/:assetId/images/resolved', authenticateToken, getResolvedAssetImages);

// Documentos resueltos (modelo + activo combinados)
router.get('/assets/:assetId/documents/resolved', authenticateToken, getResolvedAssetDocuments);

// Todo resuelto (imágenes + documentos combinados)
router.get('/assets/:assetId/resolved', authenticateToken, getResolvedAssetData);

export default router;
