import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/database';

const router: express.Router = express.Router();

// GET /api/headquarters - Obtener todas las sedes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const headquarters = await prisma.headquarters.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        Company: {
          select: {
            id: true,
            name: true,
            taxDocumentType: true,
            taxDocumentNumber: true
          }
        },
        User: {
          where: { status: 'ACTIVE' },
          select: {
            documentNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        _count: {
          select: {
            User: true,
            Asset: true
          }
        }
      },
      orderBy: [
        { Company: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: headquarters,
      pagination: {
        page: 1,
        limit: headquarters.length,
        total: headquarters.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching headquarters:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/headquarters/company/:companyId - Obtener sedes por empresa
router.get('/company/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const headquarters = await prisma.headquarters.findMany({
      where: {
        companyId: parseInt(companyId),
        status: 'ACTIVE'
      },
      include: {
        User: {
          where: { status: 'ACTIVE' },
          select: {
            documentNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        _count: {
          select: {
            User: true,
            Asset: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: headquarters,
      pagination: {
        page: 1,
        limit: headquarters.length,
        total: headquarters.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching headquarters by company:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/headquarters/:id - Obtener sede por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const headquarters = await prisma.headquarters.findUnique({
      where: { id: parseInt(id) },
      include: {
        Company: {
          select: {
            id: true,
            name: true,
            taxDocumentType: true,
            taxDocumentNumber: true
          }
        },
        User: {
          where: { status: 'ACTIVE' },
          select: {
            documentNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            status: true
          }
        }
      }
    });

    if (!headquarters) {
      return res.status(404).json({ error: 'Sede no encontrada' });
    }

    res.json(headquarters);
  } catch (error) {
    console.error('Error fetching headquarters:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/headquarters - Crear nueva sede
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      companyId,
      country,
      state,
      city,
      addressLine1,
      addressLine2,
      phone,
      email,
      commentary
    } = req.body;

    // Validar campos requeridos
    if (!name || !companyId || !country || !state || !city) {
      return res.status(400).json({
        error: 'Los campos nombre, empresa, país, estado y ciudad son obligatorios'
      });
    }

    // Verificar que la empresa existe
    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) }
    });

    if (!company) {
      return res.status(400).json({ error: 'La empresa especificada no existe' });
    }

    // Verificar unicidad de nombre dentro de la misma empresa
    const existingHeadquarters = await prisma.headquarters.findFirst({
      where: {
        name,
        companyId: parseInt(companyId)
      }
    });

    if (existingHeadquarters) {
      return res.status(400).json({ error: 'Ya existe una sede con este nombre en esta empresa' });
    }

    const headquarters = await prisma.headquarters.create({
      data: {
        name,
        companyId: parseInt(companyId),
        country,
        state,
        city,
        addressLine1,
        addressLine2,
        phone,
        email,
        commentary,
        createdBy: req.user?.documentNumber,
        updatedAt: new Date()
      },
      include: {
        Company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json(headquarters);
  } catch (error) {
    console.error('Error creating headquarters:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/headquarters/:id - Actualizar sede
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      companyId,
      country,
      state,
      city,
      addressLine1,
      addressLine2,
      phone,
      email,
      commentary,
      status
    } = req.body;

    // Verificar que la sede existe
    const existingHeadquarters = await prisma.headquarters.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingHeadquarters) {
      return res.status(404).json({ error: 'Sede no encontrada' });
    }

    // Verificar que la empresa existe (si se está cambiando)
    if (companyId && companyId !== existingHeadquarters.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: parseInt(companyId) }
      });

      if (!company) {
        return res.status(400).json({ error: 'La empresa especificada no existe' });
      }
    }

    // Verificar unicidad de nombre dentro de la misma empresa (excluyendo la sede actual)
    if (name && name !== existingHeadquarters.name) {
      const duplicateHeadquarters = await prisma.headquarters.findFirst({
        where: {
          name,
          companyId: parseInt(companyId) || existingHeadquarters.companyId,
          NOT: {
            id: parseInt(id)
          }
        }
      });

      if (duplicateHeadquarters) {
        return res.status(400).json({ error: 'Ya existe una sede con este nombre en esta empresa' });
      }
    }

    const updatedHeadquarters = await prisma.headquarters.update({
      where: { id: parseInt(id) },
      data: {
        name,
        companyId: companyId ? parseInt(companyId) : undefined,
        country,
        state,
        city,
        addressLine1,
        addressLine2,
        phone,
        email,
        commentary,
        status,
        updatedBy: req.user?.documentNumber,
        updatedAt: new Date()
      },
      include: {
        Company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(updatedHeadquarters);
  } catch (error) {
    console.error('Error updating headquarters:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/headquarters/:id - Eliminar sede (soft delete)
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Verificar que la sede existe
    const existingHeadquarters = await prisma.headquarters.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            User: true,
            Asset: true
          }
        }
      }
    });

    if (!existingHeadquarters) {
      return res.status(404).json({ error: 'Sede no encontrada' });
    }

    // Verificar si tiene datos relacionados
    if (existingHeadquarters._count.User > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar la sede porque tiene usuarios asociados' 
      });
    }

    // Soft delete - cambiar status a INACTIVE
    const deletedHeadquarters = await prisma.headquarters.update({
      where: { id: parseInt(id) },
      data: {
        status: 'INACTIVE',
        updatedBy: req.user?.documentNumber,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Sede eliminada exitosamente', headquarters: deletedHeadquarters });
  } catch (error) {
    console.error('Error deleting headquarters:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;


