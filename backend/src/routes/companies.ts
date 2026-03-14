import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/database';

const router: express.Router = express.Router();

// GET /api/companies - Obtener todas las empresas
router.get('/', authenticateToken, async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        Headquarters: {
          where: { status: 'ACTIVE' }
        },
        Process: {
          where: { status: 'ACTIVE' }
        },
        JobTitle: {
          where: { status: 'ACTIVE' },
          include: {
            Process: true
          }
        },
        _count: {
          select: {
            User: true,
            Headquarters: true,
            Process: true,
            JobTitle: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: companies,
      pagination: {
        page: 1,
        limit: companies.length,
        total: companies.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/companies/:id - Obtener empresa por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const company = await prisma.company.findUnique({
      where: { id: parseInt(id) },
      include: {
        Headquarters: {
          where: { status: 'ACTIVE' }
        },
        Process: {
          where: { status: 'ACTIVE' }
        },
        JobTitle: {
          where: { status: 'ACTIVE' },
          include: {
            Process: true
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

    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/companies - Crear nueva empresa
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
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
      website,
      commentary,
      documents
    } = req.body;

    // Validar campos requeridos
    if (!name || !taxDocumentType || !taxDocumentNumber || !country || !state || !city) {
      return res.status(400).json({
        error: 'Los campos nombre, tipo de documento tributario, número de documento, país, estado y ciudad son obligatorios'
      });
    }

    // Verificar unicidad de nombre, taxDocumentNumber y email
    const existingCompany = await prisma.company.findFirst({
      where: {
        OR: [
          { name },
          { taxDocumentNumber },
          ...(email ? [{ email }] : [])
        ]
      }
    });

    if (existingCompany) {
      if (existingCompany.name === name) {
        return res.status(400).json({ error: 'Ya existe una empresa con este nombre' });
      }
      if (existingCompany.taxDocumentNumber === taxDocumentNumber) {
        return res.status(400).json({ error: 'Ya existe una empresa con este número de documento tributario' });
      }
      if (email && existingCompany.email === email) {
        return res.status(400).json({ error: 'Ya existe una empresa con este correo electrónico' });
      }
    }

    const company = await prisma.company.create({
      data: {
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
        website,
        commentary,
        documents: documents ? JSON.stringify(documents) : null,
        createdBy: req.user?.documentNumber,
        updatedAt: new Date()
      }
    });

    res.status(201).json(company);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/companies/:id - Actualizar empresa
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
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
      website,
      commentary,
      documents,
      status
    } = req.body;

    // Verificar que la empresa existe
    const existingCompany = await prisma.company.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCompany) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Verificar unicidad de nombre, taxDocumentNumber y email (excluyendo la empresa actual)
    const duplicateCompany = await prisma.company.findFirst({
      where: {
        OR: [
          { name },
          { taxDocumentNumber },
          ...(email ? [{ email }] : [])
        ],
        NOT: {
          id: parseInt(id)
        }
      }
    });

    if (duplicateCompany) {
      if (duplicateCompany.name === name) {
        return res.status(400).json({ error: 'Ya existe una empresa con este nombre' });
      }
      if (duplicateCompany.taxDocumentNumber === taxDocumentNumber) {
        return res.status(400).json({ error: 'Ya existe una empresa con este número de documento tributario' });
      }
      if (email && duplicateCompany.email === email) {
        return res.status(400).json({ error: 'Ya existe una empresa con este correo electrónico' });
      }
    }

    const updatedCompany = await prisma.company.update({
      where: { id: parseInt(id) },
      data: {
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
        website,
        commentary,
        documents: documents ? JSON.stringify(documents) : null,
        status,
        updatedBy: req.user?.documentNumber,
        updatedAt: new Date()
      }
    });

    res.json(updatedCompany);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/companies/:id - Eliminar empresa (soft delete)
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Verificar que la empresa existe
    const existingCompany = await prisma.company.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            User: true,
            Headquarters: true,
            Process: true,
            JobTitle: true
          }
        }
      }
    });

    if (!existingCompany) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Verificar si tiene datos relacionados
    if (existingCompany._count.User > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar la empresa porque tiene usuarios asociados' 
      });
    }

    // Soft delete - cambiar status a INACTIVE
    const deletedCompany = await prisma.company.update({
      where: { id: parseInt(id) },
      data: {
        status: 'INACTIVE',
        updatedBy: req.user?.documentNumber,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Empresa eliminada exitosamente', company: deletedCompany });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/companies/:id/stats - Obtener estadísticas de la empresa
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const stats = await prisma.company.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            User: true,
            Headquarters: true,
            Process: true,
            JobTitle: true
          }
        },
        User: {
          where: { status: 'ACTIVE' },
          select: {
            role: true,
            status: true
          }
        }
      }
    });

    if (!stats) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Calcular estadísticas adicionales
    const roleStats = stats.User.reduce((acc: any, user: any) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const response = {
      totalUsers: stats._count.User,
      totalHeadquarters: stats._count.Headquarters,
      totalProcesses: stats._count.Process,
      totalJobTitles: stats._count.JobTitle,
      roleDistribution: roleStats
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching company stats:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;


