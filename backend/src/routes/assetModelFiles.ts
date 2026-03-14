import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  listModelImages,
  uploadModelImage,
  updateModelImage,
  deleteModelImage
} from '../controllers/assetModelImages.controller';
import {
  listModelDocuments,
  uploadModelDocument,
  updateModelDocument,
  deleteModelDocument
} from '../controllers/assetModelDocuments.controller';
import { uploadImage, uploadDocument } from '../middleware/upload';

const router = Router();

// Imágenes de modelos
router.get('/asset-models/:modelId/images', authenticateToken, listModelImages);
router.post('/asset-models/:modelId/images', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), uploadImage.single('image'), uploadModelImage);
router.put('/asset-models/:modelId/images/:imageId', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), updateModelImage);
router.delete('/asset-models/:modelId/images/:imageId', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), deleteModelImage);

// Documentos de modelos
router.get('/asset-models/:modelId/documents', authenticateToken, listModelDocuments);
router.post('/asset-models/:modelId/documents', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), uploadDocument.single('document'), uploadModelDocument);
router.put('/asset-models/:modelId/documents/:docId', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), updateModelDocument);
router.delete('/asset-models/:modelId/documents/:docId', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), deleteModelDocument);

export default router;
