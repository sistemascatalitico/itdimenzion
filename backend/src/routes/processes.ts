import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/database';

const router = express.Router();

// GET /api/processes - Obtener todos los procesos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const processes = await prisma.process.findMany({
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
        JobTitle: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            commentary: true
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
            JobTitle: true,
            User: true
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
      data: processes,
      pagination: {
        page: 1,
        limit: processes.length,
        total: processes.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching processes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/processes/company/:companyId - Obtener procesos por empresa
router.get('/company/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const processes = await prisma.process.findMany({
      where: {
        companyId: parseInt(companyId),
        status: 'ACTIVE'
      },
      include: {
        JobTitle: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            commentary: true
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
            JobTitle: true,
            User: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: processes,
      pagination: {
        page: 1,
        limit: processes.length,
        total: processes.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching processes by company:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/processes/:id - Obtener proceso por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const process = await prisma.process.findUnique({
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
        JobTitle: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            commentary: true,
            status: true
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

    if (!process) {
      return res.status(404).json({ error: 'Proceso no encontrado' });
    }

    res.json(process);
  } catch (error) {
    console.error('Error fetching process:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/processes - Crear nuevo proceso
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      companyId,
      commentary
    } = req.body;

    // Validar campos requeridos
    if (!name || !companyId) {
      return res.status(400).json({
        error: 'Los campos nombre y empresa son obligatorios'
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
    const existingProcess = await prisma.process.findFirst({
      where: {
        name,
        companyId: parseInt(companyId)
      }
    });

    if (existingProcess) {
      return res.status(400).json({ error: 'Ya existe un proceso con este nombre en esta empresa' });
    }

    const process = await prisma.process.create({
      data: {
        name,
        companyId: parseInt(companyId),
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

    res.status(201).json(process);
  } catch (error) {
    console.error('Error creating process:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/processes/:id - Actualizar proceso
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      companyId,
      commentary,
      status
    } = req.body;

    // Verificar que el proceso existe
    const existingProcess = await prisma.process.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingProcess) {
      return res.status(404).json({ error: 'Proceso no encontrado' });
    }

    // Verificar que la empresa existe (si se está cambiando)
    if (companyId && companyId !== existingProcess.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: parseInt(companyId) }
      });

      if (!company) {
        return res.status(400).json({ error: 'La empresa especificada no existe' });
      }
    }

    // Verificar unicidad de nombre dentro de la misma empresa (excluyendo el proceso actual)
    if (name && name !== existingProcess.name) {
      const duplicateProcess = await prisma.process.findFirst({
        where: {
          name,
          companyId: parseInt(companyId) || existingProcess.companyId,
          NOT: {
            id: parseInt(id)
          }
        }
      });

      if (duplicateProcess) {
        return res.status(400).json({ error: 'Ya existe un proceso con este nombre en esta empresa' });
      }
    }

    const updatedProcess = await prisma.process.update({
      where: { id: parseInt(id) },
      data: {
        name,
        companyId: companyId ? parseInt(companyId) : undefined,
        commentary,
        status,
        updatedBy: req.user?.documentNumber
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

    res.json(updatedProcess);
  } catch (error) {
    console.error('Error updating process:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/processes/:id - Eliminar proceso (soft delete)
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Verificar que el proceso existe
    const existingProcess = await prisma.process.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            JobTitle: true,
            User: true
          }
        }
      }
    });

    if (!existingProcess) {
      return res.status(404).json({ error: 'Proceso no encontrado' });
    }

    // Verificar si tiene datos relacionados
    if (existingProcess._count.JobTitle > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el proceso porque tiene cargos asociados' 
      });
    }

    if (existingProcess._count.User > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el proceso porque tiene usuarios asociados' 
      });
    }

    // Soft delete - cambiar status a INACTIVE
    const deletedProcess = await prisma.process.update({
      where: { id: parseInt(id) },
      data: {
        status: 'INACTIVE',
        updatedBy: req.user?.documentNumber
      }
    });

    res.json({ message: 'Proceso eliminado exitosamente', process: deletedProcess });
  } catch (error) {
    console.error('Error deleting process:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;


