import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * POST /api/suppliers
 * Crear nuevo proveedor
 */
export const createSupplier = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      taxDocumentType,
      taxDocumentNumber,
      country,
      state,
      city,
      addressLine1,
      addressLine2,
      phone,
      email,
      contactName,
      commentary,
      companyId,
    } = req.body;

    // Validaciones básicas
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre del proveedor es obligatorio' });
    }

    if (!city || !city.trim()) {
      return res.status(400).json({ error: 'La ciudad es obligatoria' });
    }

    if (!state || !state.trim()) {
      return res.status(400).json({ error: 'El estado/departamento es obligatorio' });
    }

    if (!country || !country.trim()) {
      return res.status(400).json({ error: 'El país es obligatorio' });
    }

    // Obtener companyId del usuario o del body
    const finalCompanyId = companyId || (req.user as any)?.company?.id || (req.user as any)?.companyId;
    if (!finalCompanyId) {
      return res.status(400).json({ error: 'companyId es requerido. El usuario debe estar asociado a una empresa.' });
    }

    // Construir dirección
    const address = addressLine1 
      ? `${addressLine1}${addressLine2 ? ', ' + addressLine2 : ''}` 
      : null;

    // Crear proveedor
    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        taxDocumentType: taxDocumentType || null,
        taxDocumentNumber: taxDocumentNumber?.trim() || null,
        country: country.trim(),
        state: state.trim(),
        city: city.trim(),
        address: address,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        contactName: contactName?.trim() || null,
        description: commentary?.trim() || null,
        companyId: Number(finalCompanyId),
        createdBy: req.user?.documentNumber || null,
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });

    res.status(201).json(supplier);
  } catch (error: any) {
    console.error('Error creating supplier:', error);
    
    // Manejar errores de unicidad
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Ya existe un proveedor con este documento tributario en este país' 
      });
    }

    res.status(500).json({ 
      error: error.message || 'Error al crear el proveedor' 
    });
  }
};

/**
 * GET /api/suppliers
 * Listar proveedores
 */
export const listSuppliers = async (req: Request, res: Response) => {
  try {
    const { companyId, status, search, page = '1', limit = '50' } = req.query;
    
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (companyId) {
      where.companyId = Number(companyId);
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { taxDocumentNumber: { contains: String(search), mode: 'insensitive' } },
        { city: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
        include: {
          Company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.supplier.count({ where }),
    ]);

    res.json({
      data: suppliers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Error listing suppliers:', error);
    res.status(500).json({ error: error.message || 'Error al listar proveedores' });
  }
};

/**
 * GET /api/suppliers/:id
 * Obtener proveedor por ID
 */
export const getSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id: Number(id) },
      include: {
        Company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json(supplier);
  } catch (error: any) {
    console.error('Error getting supplier:', error);
    res.status(500).json({ error: error.message || 'Error al obtener proveedor' });
  }
};

/**
 * PUT /api/suppliers/:id
 * Actualizar proveedor
 */
export const updateSupplier = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      taxDocumentType,
      taxDocumentNumber,
      country,
      state,
      city,
      addressLine1,
      addressLine2,
      phone,
      email,
      contactName,
      commentary,
      status,
    } = req.body;

    // Validar que existe
    const existing = await prisma.supplier.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Construir dirección
    const address = addressLine1 
      ? `${addressLine1}${addressLine2 ? ', ' + addressLine2 : ''}` 
      : null;

    const supplier = await prisma.supplier.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name: name.trim() }),
        ...(taxDocumentType !== undefined && { taxDocumentType: taxDocumentType || null }),
        ...(taxDocumentNumber !== undefined && { taxDocumentNumber: taxDocumentNumber?.trim() || null }),
        ...(country && { country: country.trim() }),
        ...(state && { state: state.trim() }),
        ...(city && { city: city.trim() }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(contactName !== undefined && { contactName: contactName?.trim() || null }),
        ...(commentary !== undefined && { description: commentary?.trim() || null }),
        ...(status && { status }),
        updatedBy: req.user?.documentNumber || null,
      },
    });

    res.json(supplier);
  } catch (error: any) {
    console.error('Error updating supplier:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Ya existe un proveedor con este documento tributario en este país' 
      });
    }

    res.status(500).json({ error: error.message || 'Error al actualizar proveedor' });
  }
};

/**
 * DELETE /api/suppliers/:id
 * Eliminar proveedor (soft delete cambiando status)
 */
export const deleteSupplier = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.update({
      where: { id: Number(id) },
      data: {
        status: 'INACTIVE',
        updatedBy: req.user?.documentNumber || null,
      },
    });

    res.json({ message: 'Proveedor desactivado exitosamente', supplier });
  } catch (error: any) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar proveedor' });
  }
};










