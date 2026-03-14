import express from 'express';
import { authenticateToken } from '../middleware/auth';
import * as suppliersController from '../controllers/suppliers.controller';

const router: express.Router = express.Router();

/**
 * POST /api/suppliers
 * Crear nuevo proveedor
 */
router.post('/', authenticateToken, suppliersController.createSupplier);

/**
 * GET /api/suppliers
 * Listar proveedores con filtros opcionales
 * Query params: companyId, status, search, page, limit
 */
router.get('/', authenticateToken, suppliersController.listSuppliers);

/**
 * GET /api/suppliers/:id
 * Obtener proveedor por ID
 */
router.get('/:id', authenticateToken, suppliersController.getSupplier);

/**
 * PUT /api/suppliers/:id
 * Actualizar proveedor
 */
router.put('/:id', authenticateToken, suppliersController.updateSupplier);

/**
 * DELETE /api/suppliers/:id
 * Desactivar proveedor (soft delete)
 */
router.delete('/:id', authenticateToken, suppliersController.deleteSupplier);

export default router;






















