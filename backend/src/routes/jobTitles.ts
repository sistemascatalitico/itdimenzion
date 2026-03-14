import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/database';

const router: express.Router = express.Router();


// GET /api/job-titles - Obtener todos los cargos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const jobTitles = await prisma.jobTitle.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        Process: {
          select: {
            id: true,
            name: true,
            Company: {
              select: {
                id: true,
                name: true,
                taxDocumentType: true,
                taxDocumentNumber: true
              }
            }
          }
        },
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
            User: true
          }
        }
      },
      orderBy: [
        { Company: { name: 'asc' } },
        { Process: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: jobTitles,
      pagination: {
        page: 1,
        limit: jobTitles.length,
        total: jobTitles.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching job titles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/job-titles/company/:companyId - Obtener cargos por empresa
router.get('/company/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const jobTitles = await prisma.jobTitle.findMany({
      where: {
        companyId: parseInt(companyId),
        status: 'ACTIVE'
      },
      include: {
        Process: {
          select: {
            id: true,
            name: true
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
            User: true
          }
        }
      },
      orderBy: [
        { Process: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: jobTitles,
      pagination: {
        page: 1,
        limit: jobTitles.length,
        total: jobTitles.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching job titles by company:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/job-titles/process/:processId - Obtener cargos por proceso
router.get('/process/:processId', authenticateToken, async (req, res) => {
  try {
    const { processId } = req.params;
    const jobTitles = await prisma.jobTitle.findMany({
      where: {
        processId: parseInt(processId),
        status: 'ACTIVE'
      },
      include: {
        Process: {
          select: {
            id: true,
            name: true,
            Company: {
              select: {
                id: true,
                name: true
              }
            }
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
      data: jobTitles,
      pagination: {
        page: 1,
        limit: jobTitles.length,
        total: jobTitles.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching job titles by process:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// POST /api/job-titles - Crear nuevo cargo
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      processId,
      companyId,
      commentary
    } = req.body;

    // Validar campos requeridos
    if (!name || !processId || !companyId) {
      return res.status(400).json({
        error: 'Los campos nombre, proceso y empresa son obligatorios'
      });
    }

    // Verificar que el proceso existe
    const process = await prisma.process.findUnique({
      where: { id: parseInt(processId) }
    });

    if (!process) {
      return res.status(400).json({ error: 'El proceso especificado no existe' });
    }

    // Verificar que la empresa existe
    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) }
    });

    if (!company) {
      return res.status(400).json({ error: 'La empresa especificada no existe' });
    }

    // Verificar que el proceso pertenece a la empresa
    if (process.companyId !== parseInt(companyId)) {
      return res.status(400).json({ error: 'El proceso no pertenece a la empresa especificada' });
    }

    // Verificar unicidad de nombre dentro del mismo proceso
    const existingJobTitle = await prisma.jobTitle.findFirst({
      where: {
        name,
        processId: parseInt(processId)
      }
    });

    if (existingJobTitle) {
      return res.status(400).json({ error: 'Ya existe un cargo con este nombre en este proceso' });
    }

    const jobTitle = await prisma.jobTitle.create({
      data: {
        name,
        processId: parseInt(processId),
        companyId: parseInt(companyId),
        commentary,
        createdBy: req.user?.documentNumber,
        updatedAt: new Date()
      },
      include: {
        Process: {
          select: {
            id: true,
            name: true,
            Company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    res.status(201).json(jobTitle);
  } catch (error) {
    console.error('Error creating job title:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/job-titles/:id - Actualizar cargo
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      processId,
      companyId,
      commentary,
      status
    } = req.body;

    // Verificar que el cargo existe
    const existingJobTitle = await prisma.jobTitle.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingJobTitle) {
      return res.status(404).json({ error: 'Cargo no encontrado' });
    }

    // Verificar que el proceso existe (si se está cambiando)
    if (processId && processId !== existingJobTitle.processId) {
      const process = await prisma.process.findUnique({
        where: { id: parseInt(processId) }
      });

      if (!process) {
        return res.status(400).json({ error: 'El proceso especificado no existe' });
      }
    }

    // Verificar que la empresa existe (si se está cambiando)
    if (companyId && companyId !== existingJobTitle.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: parseInt(companyId) }
      });

      if (!company) {
        return res.status(400).json({ error: 'La empresa especificada no existe' });
      }
    }

    // Verificar que el proceso pertenece a la empresa (si se están cambiando ambos)
    if (processId && companyId) {
      const process = await prisma.process.findUnique({
        where: { id: parseInt(processId) }
      });

      if (process && process.companyId !== parseInt(companyId)) {
        return res.status(400).json({ error: 'El proceso no pertenece a la empresa especificada' });
      }
    }

    // Verificar unicidad de nombre dentro del mismo proceso (excluyendo el cargo actual)
    if (name && name !== existingJobTitle.name) {
      const duplicateJobTitle = await prisma.jobTitle.findFirst({
        where: {
          name,
          processId: parseInt(processId) || existingJobTitle.processId,
          NOT: {
            id: parseInt(id)
          }
        }
      });

      if (duplicateJobTitle) {
        return res.status(400).json({ error: 'Ya existe un cargo con este nombre en este proceso' });
      }
    }

    const updatedJobTitle = await prisma.jobTitle.update({
      where: { id: parseInt(id) },
      data: {
        name,
        processId: processId ? parseInt(processId) : undefined,
        companyId: companyId ? parseInt(companyId) : undefined,
        commentary,
        status,
        updatedBy: req.user?.documentNumber
      },
      include: {
        Process: {
          select: {
            id: true,
            name: true,
            Company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    res.json(updatedJobTitle);
  } catch (error) {
    console.error('Error updating job title:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/job-titles/:id - Eliminar cargo (soft delete)
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Verificar que el cargo existe
    const existingJobTitle = await prisma.jobTitle.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            User: true
          }
        }
      }
    });

    if (!existingJobTitle) {
      return res.status(404).json({ error: 'Cargo no encontrado' });
    }

    // Verificar si tiene datos relacionados
    if (existingJobTitle._count.User > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el cargo porque tiene usuarios asociados' 
      });
    }

    // Soft delete - cambiar status a INACTIVE
    const deletedJobTitle = await prisma.jobTitle.update({
      where: { id: parseInt(id) },
      data: {
        status: 'INACTIVE',
        updatedBy: req.user?.documentNumber
      }
    });

    res.json({ message: 'Cargo eliminado exitosamente', jobTitle: deletedJobTitle });
  } catch (error) {
    console.error('Error deleting job title:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/job-titles/:id - Obtener cargo por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const jobTitle = await prisma.jobTitle.findUnique({
      where: { id: parseInt(id) },
      include: {
        Process: {
          select: {
            id: true,
            name: true,
            Company: {
              select: {
                id: true,
                name: true,
                taxDocumentType: true,
                taxDocumentNumber: true
              }
            }
          }
        },
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

    if (!jobTitle) {
      return res.status(404).json({ error: 'Cargo no encontrado' });
    }

    res.json(jobTitle);
  } catch (error) {
    console.error('Error fetching job title:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;



