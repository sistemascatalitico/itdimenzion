import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { securityConfig } from '../config/security';
import { users_role } from '@prisma/client';

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, securityConfig.bcrypt.saltRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateAccessToken = (user: {
  documentNumber: string;
  email: string;
  role: users_role;
  headquartersId: string;
}): string => {
  return jwt.sign(
    {
      documentNumber: user.documentNumber,
      email: user.email,
      role: user.role,
      headquartersId: user.headquartersId,
    },
    securityConfig.jwt.secret,
    { expiresIn: '24h' }
  );
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    securityConfig.jwt.refreshSecret,
    { expiresIn: '30d' }
  );
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, securityConfig.jwt.refreshSecret) as { userId: string };
};

export const generateSecureRandomString = (length: number = 32): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

export const isPasswordStrong = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common, please choose a more unique password');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};