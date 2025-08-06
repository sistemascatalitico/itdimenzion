import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { securityConfig } from '../config/security';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  isPasswordStrong,
  generateSecureRandomString,
} from '../utils/encryption';
import { AuthenticatedRequest } from '../middleware/auth';
import { logSecurityEvent } from '../middleware/security';

export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de validación incorrectos',
        details: errors.array(),
        statusCode: 400,
      });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      documentType,
      documentNumber,
      phone,
      headquartersId: headquartersIdRaw,
      jobTitleId: jobTitleIdRaw,
      processId: processIdRaw,
    } = req.body;

    // Convert string IDs to integers
    const headquartersId = parseInt(headquartersIdRaw, 10);
    const jobTitleId = jobTitleIdRaw ? parseInt(jobTitleIdRaw, 10) : undefined;
    const processId = processIdRaw ? parseInt(processIdRaw, 10) : undefined;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { documentNumber },
        ],
      },
    });

    if (existingUser) {
      logSecurityEvent('REGISTRATION_ATTEMPT_DUPLICATE', req, {
        email: email.toLowerCase(),
        documentNumber,
      });
      
      return res.status(409).json({
        error: 'Usuario ya existe con este email o documento',
        statusCode: 409,
      });
    }

    // Validar fortaleza de la contraseña
    const passwordValidation = isPasswordStrong(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Contraseña no cumple los requisitos de seguridad',
        details: passwordValidation.errors,
        statusCode: 400,
      });
    }

    // Verificar que la sede existe
    const headquarters = await prisma.headquarters.findUnique({
      where: { id: headquartersId },
      include: { company: true },
    });

    if (!headquarters || headquarters.status !== 'ACTIVE') {
      return res.status(400).json({
        error: 'Sede no válida o inactiva',
        statusCode: 400,
      });
    }

    // Hashear la contraseña
    const hashedPassword = await hashPassword(password);
    
    // Generar token de verificación de email
    const emailVerificationToken = generateSecureRandomString(32);

    // Crear el usuario
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        documentType,
        documentNumber,
        phone,
        headquartersId,
        jobTitleId,
        processId,
        emailVerificationToken,
        role: 'USER', // Rol por defecto
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        documentType: true,
        documentNumber: true,
        role: true,
        status: true,
        createdAt: true,
        headquarters: {
          select: {
            id: true,
            name: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    logSecurityEvent('USER_REGISTERED', req, {
      userId: newUser.id,
      email: newUser.email,
      headquartersId,
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente. Verifica tu email para activar la cuenta.',
      user: newUser,
      statusCode: 201,
    });

  } catch (error) {
    console.error('Error en registro:', error);
    logSecurityEvent('REGISTRATION_ERROR', req, { error: error instanceof Error ? error.message : 'Unknown error' });
    
    res.status(500).json({
      error: 'Error interno del servidor',
      statusCode: 500,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Login attempt:', { email: req.body.email });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        error: 'Datos de validación incorrectos',
        details: errors.array(),
        statusCode: 400,
      });
    }

    const { email, password } = req.body;
    const userEmail = email.toLowerCase();
    
    console.log('🔍 Looking for user:', userEmail);

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        headquarters: {
          include: {
            company: true,
          },
        },
      },
    });

    // Log de intento de login
    const loginData = {
      email: userEmail,
      ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      success: false,
      failureReason: '',
    };

    console.log('👤 User found:', user ? { id: user.id, email: user.email, role: user.role } : null);

    if (!user) {
      console.log('❌ User not found');
      loginData.failureReason = 'Usuario no encontrado';
      logSecurityEvent('LOGIN_ATTEMPT_INVALID_USER', req, loginData);
      
      return res.status(401).json({
        error: 'Credenciales inválidas',
        statusCode: 401,
      });
    }

    // Verificar si la cuenta está bloqueada
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      loginData.failureReason = 'Cuenta bloqueada';
      
      await prisma.loginLog.create({
        data: {
          userId: user.id,
          ipAddress: loginData.ipAddress || 'unknown',
          userAgent: loginData.userAgent || 'unknown',
          success: false,
          failureReason: loginData.failureReason,
        },
      });

      logSecurityEvent('LOGIN_ATTEMPT_BLOCKED_ACCOUNT', req, loginData);
      
      return res.status(423).json({
        error: 'Cuenta temporalmente bloqueada por múltiples intentos fallidos',
        statusCode: 423,
      });
    }

    // Verificar contraseña
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      // Incrementar intentos fallidos
      const newAttempts = user.loginAttempts + 1;
      const shouldLock = newAttempts >= securityConfig.loginSecurity.maxAttempts;
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: newAttempts,
          ...(shouldLock && {
            lockedUntil: new Date(Date.now() + securityConfig.loginSecurity.lockTimeMs),
          }),
        },
      });

      loginData.failureReason = 'Contraseña incorrecta';
      
      await prisma.loginLog.create({
        data: {
          userId: user.id,
          ipAddress: loginData.ipAddress || 'unknown',
          userAgent: loginData.userAgent || 'unknown',
          success: false,
          failureReason: loginData.failureReason,
        },
      });

      logSecurityEvent('LOGIN_ATTEMPT_INVALID_PASSWORD', req, {
        ...loginData,
        attempts: newAttempts,
        locked: shouldLock,
      });

      return res.status(401).json({
        error: 'Credenciales inválidas',
        statusCode: 401,
      });
    }

    // Verificar estado del usuario
    if (user.status !== 'ACTIVE') {
      loginData.failureReason = `Estado de cuenta: ${user.status}`;
      
      await prisma.loginLog.create({
        data: {
          userId: user.id,
          ipAddress: loginData.ipAddress || 'unknown',
          userAgent: loginData.userAgent || 'unknown',
          success: false,
          failureReason: loginData.failureReason,
        },
      });

      logSecurityEvent('LOGIN_ATTEMPT_INACTIVE_USER', req, loginData);
      
      return res.status(403).json({
        error: 'Cuenta no activa. Contacta al administrador.',
        statusCode: 403,
      });
    }

    // Login exitoso - Limpiar intentos fallidos
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
      },
    });

    // Generar tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      headquartersId: user.headquartersId?.toString() || '0',
    });

    const refreshToken = generateRefreshToken(user.id);
    
    // Guardar refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      },
    });

    // Log de login exitoso
    await prisma.loginLog.create({
      data: {
        userId: user.id,
        ipAddress: loginData.ipAddress || 'unknown',
        userAgent: loginData.userAgent || 'unknown',
        success: true,
      },
    });

    logSecurityEvent('LOGIN_SUCCESS', req, {
      userId: user.id,
      email: user.email,
    });

    // Configurar cookie segura para refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
    });

    res.json({
      message: 'Login exitoso',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        headquarters: user.headquarters,
      },
      statusCode: 200,
    });

  } catch (error) {
    console.error('Error detallado en login:', error);
    logSecurityEvent('LOGIN_ERROR', req, { error: error instanceof Error ? error.message : 'Unknown error' });
    
    res.status(500).json({
      error: 'Error interno del servidor',
      statusCode: 500,
      debug: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined,
    });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.cookies;

    if (!token) {
      return res.status(401).json({
        error: 'Token de renovación requerido',
        statusCode: 401,
      });
    }

    // Verificar token
    const decoded = verifyRefreshToken(token);
    
    // Buscar token en la base de datos
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            headquarters: true,
          },
        },
      },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      // Eliminar token expirado
      if (storedToken) {
        await prisma.refreshToken.delete({
          where: { id: storedToken.id },
        });
      }

      return res.status(401).json({
        error: 'Token de renovación inválido o expirado',
        statusCode: 401,
      });
    }

    // Verificar que el usuario está activo
    if (storedToken.user.status !== 'ACTIVE') {
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      return res.status(403).json({
        error: 'Usuario no activo',
        statusCode: 403,
      });
    }

    // Generar nuevo access token
    const newAccessToken = generateAccessToken({
      id: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      headquartersId: storedToken.user.headquartersId?.toString() || '0',
    });

    res.json({
      accessToken: newAccessToken,
      statusCode: 200,
    });

  } catch (error) {
    console.error('Error renovando token:', error);
    
    res.status(401).json({
      error: 'Token de renovación inválido',
      statusCode: 401,
    });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { refreshToken: token } = req.cookies;
    
    if (token) {
      // Eliminar refresh token de la base de datos
      await prisma.refreshToken.deleteMany({
        where: { token },
      });
    }

    // Limpiar cookie
    res.clearCookie('refreshToken');

    logSecurityEvent('USER_LOGOUT', req, {
      userId: req.user?.id,
    });

    res.json({
      message: 'Logout exitoso',
      statusCode: 200,
    });

  } catch (error) {
    console.error('Error en logout:', error);
    
    res.status(500).json({
      error: 'Error interno del servidor',
      statusCode: 500,
    });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuario no autenticado',
        statusCode: 401,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        documentType: true,
        documentNumber: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        twoFactorEnabled: true,
        profilePicture: true,
        lastLogin: true,
        createdAt: true,
        headquarters: {
          select: {
            id: true,
            name: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        jobTitle: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        process: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        statusCode: 404,
      });
    }

    res.json({
      user,
      statusCode: 200,
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    
    res.status(500).json({
      error: 'Error interno del servidor',
      statusCode: 500,
    });
  }
};