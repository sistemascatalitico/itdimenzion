import express, { Response, Router } from 'express';
import { users_role, users_status } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import UserValidation from '../utils/userValidation';
import { prisma } from '../config/database';

const router: Router = express.Router();

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
  role: users_role;
  status: users_status;
  isDeletionProtected?: boolean;
  addressLine1?: string | null;
  addressLine2?: string | null;
  residenceCountry?: string | null;
  residenceState?: string | null;
  residenceCity?: string | null;
  company?: {
    id: number;
    name: string;
    taxDocumentNumber: string;
  } | null;
  headquarters?: {
    id: number;
    name: string;
    commentary: string | null;
  } | null;
  jobTitle?: {
    id: number;
    name: string;
    commentary: string | null;
              Process: {
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
    const managedRoles = UserValidation.getManagedRoles(currentUser.role as users_role);
    
    // Query parameters for pagination and filtering
    const {
      page = '1',
      limit = '50',
      search,
      role,
      status,
      deleted,
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

    // Add search filter (MySQL compatible) - optimized
    if (search) {
      const searchTerm = (search as string).trim();
      if (searchTerm) {
        where.OR = [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { username: { contains: searchTerm, mode: 'insensitive' } },
          { documentNumber: { contains: searchTerm, mode: 'insensitive' } }
        ];
      }
    }

    // Add role filter
    if (role && managedRoles.includes(role as users_role)) {
      where.role = role as users_role;
    }

    // Add status filter
    if (status) {
      where.status = status as users_status;
    }

    // Add deleted users filter (show only INACTIVE users)
    if (deleted === 'true') {
      where.status = users_status.INACTIVE;
    } else {
      // By default, show only ACTIVE users unless specifically asking for INACTIVE or both
      if (!status) {
        where.status = users_status.ACTIVE;
      }
    }

    // Add company filter
    if (companyId) {
      where.companyId = parseInt(companyId as string);
    }

    // Fetch users with related data - optimized query
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
          isDeletionProtected: true,
          addressLine1: true,
          addressLine2: true,
          residenceCountry: true,
          residenceState: true,
          residenceCity: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          Company: {
            select: {
              id: true,
              name: true,
              taxDocumentNumber: true
            }
          },
          Headquarters: {
            select: {
              id: true,
              name: true,
              commentary: true
            }
          },
          JobTitle: {
            select: {
              id: true,
              name: true,
              commentary: true,
              Process: {
                select: {
                  name: true
                }
              }
            }
          },
              Process: {
            select: {
              id: true,
              name: true,
              commentary: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' },
          { firstName: 'asc' }
        ],
        skip,
        take: limitNum,
        // Optimize with cursor-based pagination for large datasets
        ...(pageNum > 1 && { 
          cursor: undefined // Could be implemented for very large datasets
        })
      }),
      // Optimized count query - only when necessary
      search || role || status || companyId ? 
        prisma.user.count({ where }) : 
        prisma.user.count({ 
          where: { 
            role: { in: managedRoles } 
          } 
        })
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

    const managedRoles = UserValidation.getManagedRoles(currentUser.role as users_role);

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
          status: users_status.ACTIVE
        }
      }),
      prisma.user.count({
        where: {
          role: {
            in: managedRoles
          },
          status: users_status.INACTIVE
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
      isDeletionProtected,
      addressLine1,
      addressLine2,
      residenceCountry,
      residenceState,
      residenceCity,
      companyId,
      headquartersId,
      processId,
      jobTitleId
    } = req.body;

    // Check if current user can assign the requested role
    if (!UserValidation.canAssignRole(currentUser.role as users_role, role)) {
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

    // Check for duplicate username, email, and documentNumber
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
          { documentNumber }
        ]
      },
      select: {
        username: true,
        email: true,
        documentNumber: true
      }
    });

    if (existingUser) {
      const errors = [];
      if (existingUser.username === username) {
        errors.push('El nombre de usuario ya está en uso');
      }
      if (existingUser.email === email) {
        errors.push('El correo electrónico ya está en uso');
      }
      if (existingUser.documentNumber === documentNumber) {
        errors.push('El número de documento ya está registrado');
      }
      return res.status(400).json({ errors });
    }

    // Hash password
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with password history
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
        isDeletionProtected: isDeletionProtected || false,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        residenceCountry: residenceCountry || null,
        residenceState: residenceState || null,
        residenceCity: residenceCity || null,
        companyId: companyId || null,
        headquartersId: headquartersId || null,
        processId: processId || null,
        jobTitleId: jobTitleId || null,
        createdBy: currentUser.documentNumber,
        updatedBy: currentUser.documentNumber,
        updatedAt: new Date(),
        PasswordHistory: {
          create: {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            password: hashedPassword
          }
        }
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
        isDeletionProtected: true,
        addressLine1: true,
        addressLine2: true,
        residenceCountry: true,
        residenceState: true,
        residenceCity: true,
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

// Change password with history validation
router.put('/change-password', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva contraseña son obligatorias' });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { documentNumber: currentUser.documentNumber },
      include: {
        PasswordHistory: {
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Check if new password is in recent history (last 3 passwords)
    for (const historyEntry of user.PasswordHistory) {
      const isPasswordInHistory = await bcrypt.compare(newPassword, historyEntry.password);
      if (isPasswordInHistory) {
        return res.status(400).json({ error: 'La nueva contraseña no puede ser igual a las últimas 3 contraseñas utilizadas' });
      }
    }

    // Update password and add to history
    await prisma.user.update({
      where: { documentNumber: currentUser.documentNumber },
      data: {
        password: hashedNewPassword,
        PasswordHistory: {
          create: {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            password: hashedNewPassword
          }
        },
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Contraseña cambiada exitosamente' });
  } catch (error) {
    console.error('Error changing password:', error);
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
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        twoFactorEnabled: true,
        Company: {
          select: {
            id: true,
            name: true,
            taxDocumentNumber: true
          }
        },
        Headquarters: {
          select: {
            id: true,
            name: true,
            commentary: true
          }
        },
        JobTitle: {
          select: {
            id: true,
            name: true,
            commentary: true,
            Process: {
              select: {
                name: true
              }
            }
          }
        },
              Process: {
          select: {
            id: true,
            name: true,
            commentary: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Check if current user can view this user
    if (!UserValidation.canManageUser(currentUser.role as users_role, user.role)) {
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
    if (!UserValidation.canManageUser(currentUser.role as users_role, existingUser.role)) {
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
      isDeletionProtected,
      addressLine1,
      addressLine2,
      residenceCountry,
      residenceState,
      residenceCity,
      companyId,
      headquartersId,
      processId,
      jobTitleId
    } = req.body;

    // Check if current user can assign the requested role
    if (role && !UserValidation.canAssignRole(currentUser.role as users_role, role)) {
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
      ...(isDeletionProtected !== undefined && { isDeletionProtected }),
      ...(addressLine1 !== undefined && { addressLine1 }),
      ...(addressLine2 !== undefined && { addressLine2 }),
      ...(residenceCountry !== undefined && { residenceCountry }),
      ...(residenceState !== undefined && { residenceState }),
      ...(residenceCity !== undefined && { residenceCity }),
      ...(companyId !== undefined && { companyId }),
      ...(headquartersId !== undefined && { headquartersId }),
      ...(processId !== undefined && { processId }),
      ...(jobTitleId !== undefined && { jobTitleId })
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
        isDeletionProtected: true,
        addressLine1: true,
        addressLine2: true,
        residenceCountry: true,
        residenceState: true,
        residenceCity: true,
        updatedAt: true,
        Company: {
          select: {
            id: true,
            name: true,
            taxDocumentNumber: true
          }
        },
        Headquarters: {
          select: {
            id: true,
            name: true,
            commentary: true
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
        status: true
      }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Check if current user can manage this user
    if (!UserValidation.canManageUser(currentUser.role as users_role, existingUser.role)) {
      return res.status(403).json({ error: 'No tienes permisos para cambiar el estado de este usuario' });
    }

    // Toggle status
    const newusers_status = existingUser.status === users_status.ACTIVE ? users_status.INACTIVE : users_status.ACTIVE;

    const updatedUser = await prisma.user.update({
      where: { documentNumber },
      data: {
        status: newusers_status,
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
      message: `Usuario ${newusers_status === users_status.ACTIVE ? 'activado' : 'desactivado'} exitosamente`,
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

// Disable user (soft delete - only SUPER_ADMIN can disable SUPER_ADMIN)
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

    // Check if user is protected against deletion
    if (existingUser.isDeletionProtected) {
      return res.status(403).json({ error: 'Este usuario está protegido contra eliminación' });
    }

    // Check special rule: only SUPER_ADMIN can disable SUPER_ADMIN
    if (existingUser.role === users_role.SUPER_ADMIN && currentUser.role !== users_role.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Solo un Super Admin puede deshabilitar otros Super Admins' });
    }

    // Check if current user can manage this user
    if (!UserValidation.canManageUser(currentUser.role as users_role, existingUser.role)) {
      return res.status(403).json({ error: 'No tienes permisos para deshabilitar este usuario' });
    }

    // Prevent self-deletion
    if (documentNumber === currentUser.documentNumber) {
      return res.status(400).json({ error: 'No puedes deshabilitar tu propio usuario' });
    }

    // Check if user is already inactive
    if (existingUser.status === users_status.INACTIVE) {
      return res.status(400).json({ error: 'El usuario ya está deshabilitado' });
    }

    // Soft delete: change status to INACTIVE instead of actual deletion
    await prisma.user.update({
      where: { documentNumber },
      data: { 
        status: users_status.INACTIVE,
        updatedBy: currentUser.documentNumber
      }
    });

    res.json({ 
      message: `Usuario ${existingUser.firstName} ${existingUser.lastName} deshabilitado exitosamente`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;