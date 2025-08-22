import express, { Response, Router } from 'express';
import { PrismaClient, UserRole, Status } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import UserValidation from '../utils/userValidation';

const router: Router = express.Router();
const prisma = new PrismaClient();

// Enhanced user interface for responses
interface UserResponse {
  documentNumber: string;
  documentType: string;
  firstName: string;
  lastName: string;
  email: string;
  contactEmail?: string | null;
  phone?: string | null;
  username: string | null;
  role: UserRole;
  status: Status;
  addressLine1?: string | null;
  addressLine2?: string | null;
  residenceCountry?: string | null;
  residenceState?: string | null;
  residenceCity?: string | null;
  isDeletionProtected?: boolean;
  company?: {
    id: number;
    name: string;
    nit: string;
  } | null;
  headquarters?: {
    id: number;
    name: string;
    code: string;
  } | null;
  jobTitle?: {
    id: number;
    name: string;
    code: string;
    process: {
      name: string;
    };
  } | null;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

// Get users with role-based filtering
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Get manageable roles for current user
    const managedRoles = UserValidation.getManagedRoles(currentUser.role as UserRole);
    
    // Query parameters for pagination and filtering
    const {
      page = '1',
      limit = '50',
      search,
      role,
      status,
      companyId
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      role: {
        in: managedRoles
      }
    };

    // Add search filter (MySQL compatible)
    if (search) {
      where.OR = [
        { firstName: { contains: search as string } },
        { lastName: { contains: search as string } },
        { email: { contains: search as string } },
        { username: { contains: search as string } },
        { documentNumber: { contains: search as string } }
      ];
    }

    // Add role filter
    if (role && managedRoles.includes(role as UserRole)) {
      where.role = role as UserRole;
    }

    // Add status filter
    if (status) {
      where.status = status as Status;
    }

    // Add company filter
    if (companyId) {
      where.companyId = parseInt(companyId as string);
    }

    // Fetch users with related data
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          documentNumber: true,
          documentType: true,
          firstName: true,
          lastName: true,
          email: true,
          contactEmail: true,
          phone: true,
          username: true,
          role: true,
          status: true,
          addressLine1: true,
          addressLine2: true,
          residenceCountry: true,
          residenceState: true,
          residenceCity: true,
          isDeletionProtected: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          company: {
            select: {
              id: true,
              name: true,
              nit: true
            }
          },
          headquarters: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          jobTitle: {
            select: {
              id: true,
              name: true,
              code: true,
              process: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' },
          { firstName: 'asc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.user.count({ where })
    ]);

    const formattedUsers: UserResponse[] = users.map(user => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString()
    }));

    res.json({
      users: formattedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      },
      managedRoles
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get single user
router.get('/:documentNumber', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUser = req.user;
    const { documentNumber } = req.params;

    if (!currentUser) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const user = await prisma.user.findUnique({
      where: { documentNumber },
      select: {
        documentNumber: true,
        documentType: true,
        firstName: true,
        lastName: true,
        email: true,
        contactEmail: true,
        phone: true,
        username: true,
        role: true,
        status: true,
        addressLine1: true,
        addressLine2: true,
        residenceCountry: true,
        residenceState: true,
        residenceCity: true,
        isDeletionProtected: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        twoFactorEnabled: true,
        company: {
          select: {
            id: true,
            name: true,
            nit: true
          }
        },
        headquarters: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        jobTitle: {
          select: {
            id: true,
            name: true,
            code: true,
            process: {
              select: {
                name: true
              }
            }
          }
        },
        process: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Check if current user can view this user
    if (!UserValidation.canManageUser(currentUser.role as UserRole, user.role)) {
      return res.status(403).json({ error: 'No tienes permisos para ver este usuario' });
    }

    const formattedUser = {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString()
    };

    res.json({ user: formattedUser });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Create new user
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUser = req.user;
    
    if (!currentUser) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const {
      documentNumber,
      documentType,
      firstName,
      lastName,
      email,
      contactEmail,
      phone,
      username,
      password,
      role,
      addressLine1,
      addressLine2,
      residenceCountry,
      residenceState,
      residenceCity,
      companyId,
      headquartersId,
      processId,
      jobTitleId,
      isDeletionProtected
    } = req.body;

    // Check if current user can assign the requested role
    if (!UserValidation.canAssignRole(currentUser.role as UserRole, role)) {
      return res.status(403).json({ error: 'No tienes permisos para asignar este rol' });
    }

    // Validate user data
    const validation = await UserValidation.validateUserCreation({
      documentNumber,
      email,
      username,
      firstName,
      lastName,
      role,
      companyId,
      headquartersId
    });

    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // Hash password
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        documentNumber,
        documentType,
        firstName,
        lastName,
        email,
        contactEmail: contactEmail || null,
        phone,
        username,
        password: hashedPassword,
        role,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        residenceCountry: residenceCountry || null,
        residenceState: residenceState || null,
        residenceCity: residenceCity || null,
        companyId: companyId || null,
        headquartersId: headquartersId || null,
        processId: processId || null,
        jobTitleId: jobTitleId || null,
        isDeletionProtected: isDeletionProtected || false,
        createdBy: currentUser.documentNumber,
        updatedBy: currentUser.documentNumber
      },
      select: {
        documentNumber: true,
        documentType: true,
        firstName: true,
        lastName: true,
        email: true,
        contactEmail: true,
        phone: true,
        username: true,
        role: true,
        status: true,
        addressLine1: true,
        addressLine2: true,
        residenceCountry: true,
        residenceState: true,
        residenceCity: true,
        isDeletionProtected: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const formattedUser = {
      ...newUser,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString()
    };

    res.status(201).json({ 
      message: 'Usuario creado exitosamente',
      user: formattedUser 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Update user (excluding document number)
router.put('/:documentNumber', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUser = req.user;
    const { documentNumber } = req.params;

    if (!currentUser) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { documentNumber },
      select: {
        documentNumber: true,
        role: true,
        status: true
      }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Check if current user can manage this user
    if (!UserValidation.canManageUser(currentUser.role as UserRole, existingUser.role)) {
      return res.status(403).json({ error: 'No tienes permisos para editar este usuario' });
    }

    const {
      firstName,
      lastName,
      email,
      contactEmail,
      phone,
      username,
      role,
      addressLine1,
      addressLine2,
      residenceCountry,
      residenceState,
      residenceCity,
      companyId,
      headquartersId,
      processId,
      jobTitleId,
      isDeletionProtected
    } = req.body;

    // Check if current user can assign the requested role
    if (role && !UserValidation.canAssignRole(currentUser.role as UserRole, role)) {
      return res.status(403).json({ error: 'No tienes permisos para asignar este rol' });
    }

    // Validate user data
    const updateData = {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(email !== undefined && { email }),
      ...(contactEmail !== undefined && { contactEmail }),
      ...(phone !== undefined && { phone }),
      ...(username !== undefined && { username }),
      ...(role !== undefined && { role }),
      ...(addressLine1 !== undefined && { addressLine1 }),
      ...(addressLine2 !== undefined && { addressLine2 }),
      ...(residenceCountry !== undefined && { residenceCountry }),
      ...(residenceState !== undefined && { residenceState }),
      ...(residenceCity !== undefined && { residenceCity }),
      ...(companyId !== undefined && { companyId }),
      ...(headquartersId !== undefined && { headquartersId }),
      ...(processId !== undefined && { processId }),
      ...(jobTitleId !== undefined && { jobTitleId }),
      ...(isDeletionProtected !== undefined && { isDeletionProtected })
    };

    const validation = await UserValidation.validateUserUpdate(documentNumber, updateData);

    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { documentNumber },
      data: {
        ...updateData,
        updatedBy: currentUser.documentNumber
      },
      select: {
        documentNumber: true,
        documentType: true,
        firstName: true,
        lastName: true,
        email: true,
        contactEmail: true,
        phone: true,
        username: true,
        role: true,
        status: true,
        addressLine1: true,
        addressLine2: true,
        residenceCountry: true,
        residenceState: true,
        residenceCity: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
            nit: true
          }
        },
        headquarters: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    const formattedUser = {
      ...updatedUser,
      updatedAt: updatedUser.updatedAt.toISOString()
    };

    res.json({ 
      message: 'Usuario actualizado exitosamente',
      user: formattedUser 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Toggle user status
router.patch('/:documentNumber/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUser = req.user;
    const { documentNumber } = req.params;

    if (!currentUser) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { documentNumber },
      select: {
        documentNumber: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        isDeletionProtected: true
      }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Check if current user can manage this user
    if (!UserValidation.canManageUser(currentUser.role as UserRole, existingUser.role)) {
      return res.status(403).json({ error: 'No tienes permisos para cambiar el estado de este usuario' });
    }

    // Toggle status
    const newStatus = existingUser.status === Status.ACTIVE ? Status.INACTIVE : Status.ACTIVE;

    const updatedUser = await prisma.user.update({
      where: { documentNumber },
      data: {
        status: newStatus,
        updatedBy: currentUser.documentNumber
      },
      select: {
        documentNumber: true,
        firstName: true,
        lastName: true,
        status: true,
        updatedAt: true
      }
    });

    res.json({ 
      message: `Usuario ${newStatus === Status.ACTIVE ? 'activado' : 'desactivado'} exitosamente`,
      user: {
        ...updatedUser,
        updatedAt: updatedUser.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Delete user (only SUPER_ADMIN can delete SUPER_ADMIN)
router.delete('/:documentNumber', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUser = req.user;
    const { documentNumber } = req.params;

    if (!currentUser) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { documentNumber },
      select: {
        documentNumber: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        isDeletionProtected: true
      }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Check if user is deletion protected
    if (existingUser.isDeletionProtected) {
      return res.status(403).json({ error: 'Este usuario está protegido contra eliminación' });
    }

    // Check special rule: only SUPER_ADMIN can delete SUPER_ADMIN
    if (existingUser.role === UserRole.SUPER_ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Solo un Super Admin puede eliminar otros Super Admins' });
    }

    // Check if current user can manage this user
    if (!UserValidation.canManageUser(currentUser.role as UserRole, existingUser.role)) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este usuario' });
    }

    // Prevent self-deletion
    if (documentNumber === currentUser.documentNumber) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }

    // Perform soft delete by setting status to INACTIVE instead of hard delete
    await prisma.user.update({
      where: { documentNumber },
      data: {
        status: Status.INACTIVE,
        updatedBy: currentUser.documentNumber
      }
    });

    res.json({ 
      message: `Usuario ${existingUser.firstName} ${existingUser.lastName} desactivado exitosamente`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Check uniqueness endpoints
router.get('/check/email/:email', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.params;
    const { exclude } = req.query;

    const result = await UserValidation.checkEmailUniqueness(email, exclude as string);
    res.json(result);
  } catch (error) {
    console.error('Error checking email uniqueness:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/check/username/:username', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username } = req.params;
    const { exclude } = req.query;

    const result = await UserValidation.checkUsernameUniqueness(username, exclude as string);
    res.json(result);
  } catch (error) {
    console.error('Error checking username uniqueness:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/check/document/:documentNumber', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { documentNumber } = req.params;
    const { exclude } = req.query;

    const result = await UserValidation.checkDocumentUniqueness(documentNumber, exclude as string);
    res.json(result);
  } catch (error) {
    console.error('Error checking document uniqueness:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get user statistics
router.get('/stats/overview', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUser = req.user;
    
    if (!currentUser) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const managedRoles = UserValidation.getManagedRoles(currentUser.role as UserRole);

    const [totalUsers, activeUsers, inactiveUsers, roleStats] = await Promise.all([
      prisma.user.count({
        where: {
          role: {
            in: managedRoles
          }
        }
      }),
      prisma.user.count({
        where: {
          role: {
            in: managedRoles
          },
          status: Status.ACTIVE
        }
      }),
      prisma.user.count({
        where: {
          role: {
            in: managedRoles
          },
          status: Status.INACTIVE
        }
      }),
      prisma.user.groupBy({
        by: ['role'],
        where: {
          role: {
            in: managedRoles
          }
        },
        _count: {
          _all: true
        }
      })
    ]);

    const roleBreakdown = roleStats.map(stat => ({
      role: stat.role,
      count: stat._count._all
    }));

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      roleBreakdown,
      managedRoles
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const {
      firstName,
      lastName,
      phone,
      contactEmail,
      addressLine1,
      addressLine2,
      residenceCountry,
      residenceState,
      residenceCity
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'Nombre y apellido son obligatorios' });
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: {
        documentNumber: currentUser.documentNumber
      },
      data: {
        firstName,
        lastName,
        phone: phone || null,
        contactEmail: contactEmail ?? null,
        addressLine1: addressLine1 ?? null,
        addressLine2: addressLine2 ?? null,
        residenceCountry: residenceCountry ?? null,
        residenceState: residenceState ?? null,
        residenceCity: residenceCity ?? null,
        updatedAt: new Date()
      }
    });

    // Transform to response format
    const userResponse: UserResponse = {
      documentNumber: updatedUser.documentNumber,
      documentType: updatedUser.documentType,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      contactEmail: updatedUser.contactEmail,
      phone: updatedUser.phone,
      username: updatedUser.username,
      role: updatedUser.role,
      status: updatedUser.status,
      addressLine1: updatedUser.addressLine1,
      addressLine2: updatedUser.addressLine2,
      residenceCountry: updatedUser.residenceCountry,
      residenceState: updatedUser.residenceState,
      residenceCity: updatedUser.residenceCity,
      company: null,
      headquarters: null,
      jobTitle: null,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
      lastLogin: updatedUser.lastLogin?.toISOString()
    };

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: userResponse
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;