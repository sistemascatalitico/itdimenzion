import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { securityConfig } from '../config/security';
import { UserRole } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    headquartersId: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        statusCode: 401,
      });
    }

    const decoded = jwt.verify(token, securityConfig.jwt.secret) as {
      id: string;
      email: string;
      role: UserRole;
      headquartersId: string;
    };

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        headquartersId: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({
        error: 'Invalid or inactive user account',
        statusCode: 401,
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      headquartersId: user.headquartersId?.toString() || '0',
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expired',
        statusCode: 401,
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Invalid token',
        statusCode: 401,
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      statusCode: 500,
    });
  }
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        statusCode: 401,
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        statusCode: 403,
      });
    }

    next();
  };
};

export const requireOwnershipOrRole = (roles: UserRole[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        statusCode: 401,
      });
    }

    // Super admins and specified roles can access any resource
    if (roles.includes(req.user.role)) {
      return next();
    }

    // For regular users, check if they're accessing their own data
    const userId = req.params.id;
    if (userId && userId === req.user.id) {
      return next();
    }

    return res.status(403).json({
      error: 'Access denied - insufficient permissions or not resource owner',
      statusCode: 403,
    });
  };
};

export const requireSameHeadquarters = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      statusCode: 401,
    });
  }

  // Super admins can access any headquarters
  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  const targetUserId = req.params.id;
  if (targetUserId) {
    try {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { headquartersId: true },
      });

      if (!targetUser) {
        return res.status(404).json({
          error: 'User not found',
          statusCode: 404,
        });
      }

      if (targetUser.headquartersId?.toString() !== req.user.headquartersId) {
        return res.status(403).json({
          error: 'Access denied - different headquarters',
          statusCode: 403,
        });
      }
    } catch (error) {
      console.error('Error checking headquarters:', error);
      return res.status(500).json({
        error: 'Error validating access permissions',
        statusCode: 500,
      });
    }
  }

  next();
};