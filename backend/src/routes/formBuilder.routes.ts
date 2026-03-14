import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import * as formBuilderController from '../controllers/formBuilder.controller';

const router: express.Router = express.Router();

// =========================
// FORMS ROUTES
// =========================

/**
 * GET /api/forms
 * Listar formularios con filtros opcionales
 * Query params: companyId, moduleType, status, isTemplate, assetTypeId, search, page, limit
 */
router.get('/', authenticateToken, formBuilderController.listForms);

/**
 * GET /api/forms/asset-type/:assetTypeId
 * Obtener formulario por AssetType
 */
router.get('/asset-type/:assetTypeId', authenticateToken, formBuilderController.getFormByAssetType);

/**
 * GET /api/forms/:id
 * Obtener un formulario por ID
 */
router.get('/:id', authenticateToken, formBuilderController.getForm);

/**
 * POST /api/forms
 * Crear un nuevo formulario
 */
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  // Agregar el usuario autenticado al body
  req.body.createdBy = req.user?.documentNumber;
  formBuilderController.createForm(req, res);
});

/**
 * PUT /api/forms/:id
 * Actualizar un formulario
 */
router.put('/:id', authenticateToken, formBuilderController.updateForm);

/**
 * DELETE /api/forms/:id
 * Eliminar un formulario (soft delete)
 */
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  // Agregar el usuario autenticado al body
  req.body.deletedBy = req.user?.documentNumber;
  formBuilderController.deleteForm(req, res);
});

/**
 * POST /api/forms/:id/clone
 * Clonar un formulario
 */
router.post('/:id/clone', authenticateToken, async (req: AuthenticatedRequest, res) => {
  // Agregar el usuario autenticado al body
  req.body.createdBy = req.user?.documentNumber;
  formBuilderController.cloneForm(req, res);
});

// =========================
// FORM FIELDS ROUTES
// =========================

/**
 * GET /api/forms/:formId/fields
 * Listar campos de un formulario
 */
router.get('/:formId/fields', authenticateToken, formBuilderController.listFormFields);

/**
 * GET /api/forms/:formId/fields/:id
 * Obtener un campo por ID
 */
router.get('/:formId/fields/:id', authenticateToken, formBuilderController.getFormField);

/**
 * POST /api/forms/:formId/fields
 * Crear un nuevo campo
 */
router.post('/:formId/fields', authenticateToken, async (req: AuthenticatedRequest, res) => {
  // Agregar el usuario autenticado al body
  req.body.createdBy = req.user?.documentNumber;
  formBuilderController.createFormField(req, res);
});

/**
 * PUT /api/forms/:formId/fields/:id
 * Actualizar un campo
 */
router.put('/:formId/fields/:id', authenticateToken, formBuilderController.updateFormField);

/**
 * DELETE /api/forms/:formId/fields/:id
 * Eliminar un campo (soft delete)
 */
router.delete('/:formId/fields/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  // Agregar el usuario autenticado al body
  req.body.deletedBy = req.user?.documentNumber;
  formBuilderController.deleteFormField(req, res);
});

/**
 * PUT /api/forms/:formId/fields/reorder
 * Reordenar campos de un formulario
 */
router.put('/:formId/fields/reorder', authenticateToken, formBuilderController.reorderFormFields);

// =========================
// FIELD NUMBERING ROUTES
// =========================

/**
 * POST /api/forms/:formId/fields/:fieldId/generate-number
 * Generar siguiente número incremental para un campo
 * Body: { companyId?, assetTypeId? }
 */
router.post('/:formId/fields/:fieldId/generate-number', authenticateToken, formBuilderController.generateFieldNumber);

export default router;

