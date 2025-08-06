import { body, param, query } from 'express-validator';
import { DocumentType, UserRole } from '@prisma/client';

// Force reload - validation updated

export const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email debe ser válido')
    .isLength({ max: 255 })
    .withMessage('Email no puede exceder 255 caracteres'),
    
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Contraseña debe tener entre 8 y 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('Contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial'),
    
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/)
    .withMessage('Nombre solo puede contener letras y espacios'),
    
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/)
    .withMessage('Apellido solo puede contener letras y espacios'),
    
  body('documentType')
    .isIn(Object.values(DocumentType))
    .withMessage('Tipo de documento no válido'),
    
  body('documentNumber')
    .trim()
    .isLength({ min: 6, max: 20 })
    .withMessage('Número de documento debe tener entre 6 y 20 caracteres')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('Número de documento solo puede contener letras y números'),
    
  body('phone')
    .optional()
    .isMobilePhone('es-CO')
    .withMessage('Número de teléfono no válido para Colombia'),
    
  body('headquartersId')
    .isNumeric()
    .custom((value) => {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 1) {
        throw new Error('ID de sede debe ser un número entero válido mayor a 0');
      }
      return true;
    })
    .withMessage('ID de sede debe ser un número entero válido'),
    
  body('jobTitleId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de cargo debe ser un número entero válido'),
    
  body('processId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de proceso debe ser un número entero válido'),
];

export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email debe ser válido')
    .isLength({ max: 255 })
    .withMessage('Email no puede exceder 255 caracteres'),
    
  body('password')
    .isLength({ min: 1, max: 128 })
    .withMessage('Contraseña es requerida')
    .trim(),
];

export const changePasswordValidation = [
  body('currentPassword')
    .isLength({ min: 1 })
    .withMessage('Contraseña actual es requerida'),
    
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('Nueva contraseña debe tener entre 8 y 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('Nueva contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Confirmación de contraseña no coincide');
      }
      return true;
    }),
];

export const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/)
    .withMessage('Nombre solo puede contener letras y espacios'),
    
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/)
    .withMessage('Apellido solo puede contener letras y espacios'),
    
  body('phone')
    .optional()
    .isMobilePhone('es-CO')
    .withMessage('Número de teléfono no válido para Colombia'),
];

export const createUserValidation = [
  ...registerValidation,
  body('role')
    .isIn(Object.values(UserRole))
    .withMessage('Rol de usuario no válido'),
];

export const updateUserValidation = [
  param('id')
    .isUUID()
    .withMessage('ID de usuario debe ser un UUID válido'),
    
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/)
    .withMessage('Nombre solo puede contener letras y espacios'),
    
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/)
    .withMessage('Apellido solo puede contener letras y espacios'),
    
  body('phone')
    .optional()
    .isMobilePhone('es-CO')
    .withMessage('Número de teléfono no válido para Colombia'),
    
  body('role')
    .optional()
    .isIn(Object.values(UserRole))
    .withMessage('Rol de usuario no válido'),
    
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'LOCKED'])
    .withMessage('Estado de usuario no válido'),
    
  body('jobTitleId')
    .optional()
    .isUUID()
    .withMessage('ID de cargo debe ser un UUID válido'),
    
  body('processId')
    .optional()
    .isUUID()
    .withMessage('ID de proceso debe ser un UUID válido'),
];

export const resetPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email debe ser válido'),
];

export const confirmResetPasswordValidation = [
  body('token')
    .isLength({ min: 32, max: 32 })
    .withMessage('Token de reset no válido'),
    
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('Nueva contraseña debe tener entre 8 y 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('Nueva contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial'),
];

export const verifyEmailValidation = [
  body('token')
    .isLength({ min: 32, max: 32 })
    .withMessage('Token de verificación no válido'),
];

export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número entero mayor a 0'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser un número entre 1 y 100'),
    
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Búsqueda no puede exceder 100 caracteres')
    .trim(),
];

export const uuidValidation = [
  param('id')
    .isUUID()
    .withMessage('ID debe ser un UUID válido'),
];