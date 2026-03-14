import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  listFields, createField, updateField, deleteField,
  listFieldOptions, addFieldOption, updateFieldOption, deleteFieldOption,
  listBindings, createBinding, updateBinding, deleteBinding,
  upsertAssetValue, resolveFieldsForType,
  getFieldsForAssetType, invokeReusableField,
} from '../controllers/customFields.controller';

const router: Router = Router();

// Fields
router.get('/custom-fields', authenticateToken, listFields);
router.post('/custom-fields', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), createField);
router.put('/custom-fields/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), updateField);
router.delete('/custom-fields/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), deleteField);

// Options
router.get('/custom-fields/:fieldId/options', authenticateToken, listFieldOptions);
router.post('/custom-fields/:fieldId/options', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), addFieldOption);
router.put('/custom-field-options/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), updateFieldOption);
router.delete('/custom-field-options/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), deleteFieldOption);

// Bindings
router.get('/custom-field-bindings', authenticateToken, listBindings);
router.post('/custom-field-bindings', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), createBinding);
router.put('/custom-field-bindings/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), updateBinding);
router.delete('/custom-field-bindings/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), deleteBinding);

// Values
router.post('/assets/:assetId/custom-field-values', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), upsertAssetValue);

// Resolver de formulario por Type
router.get('/asset-types/:typeId/resolved-fields', authenticateToken, resolveFieldsForType);

router.get('/asset-types/:assetTypeId/fields', authenticateToken, getFieldsForAssetType);
router.post('/asset-types/:assetTypeId/fields/invoke', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), invokeReusableField);

export default router;
