import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  listManufacturers, createManufacturer, updateManufacturer, deleteManufacturer,
  listCategories, createCategory, updateCategory, deleteCategory,
  listGroups, createGroup, updateGroup, deleteGroup, getGroupsByCategory,
  listTypes, createType, updateType, deleteType,
  listModels, createModel, updateModel, deleteModel,
} from '../controllers/assetsCatalogs.controller';

const router: Router = Router();

// Manufacturers
router.get('/asset-manufacturers', authenticateToken, listManufacturers);
router.post('/asset-manufacturers', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), createManufacturer);
router.put('/asset-manufacturers/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), updateManufacturer);
router.delete('/asset-manufacturers/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), deleteManufacturer);

// Categories
router.get('/asset-categories', authenticateToken, listCategories);
router.post('/asset-categories', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), createCategory);
router.put('/asset-categories/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), updateCategory);
router.delete('/asset-categories/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), deleteCategory);

// Groups
router.get('/asset-groups', authenticateToken, listGroups);
router.get('/asset-groups/category/:categoryId', authenticateToken, getGroupsByCategory);
router.post('/asset-groups', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), createGroup);
router.put('/asset-groups/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), updateGroup);
router.delete('/asset-groups/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), deleteGroup);

// Types
router.get('/asset-types', authenticateToken, listTypes);
router.post('/asset-types', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), createType);
router.put('/asset-types/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), updateType);
router.delete('/asset-types/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), deleteType);

// Models
router.get('/asset-models', authenticateToken, listModels);
router.post('/asset-models', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), createModel);
router.put('/asset-models/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), updateModel);
router.delete('/asset-models/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), deleteModel);

export default router;
