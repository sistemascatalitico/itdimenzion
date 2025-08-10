import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface UniqueCheckResult {
  isUnique: boolean;
  field: string;
  value: string;
}

export class UserValidation {
  // Check if email is unique (excluding a specific user)
  static async checkEmailUniqueness(email: string, excludeUserId?: string): Promise<UniqueCheckResult> {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { documentNumber: true, email: true }
      });

      const isUnique = !existingUser || (excludeUserId ? existingUser.documentNumber === excludeUserId : false);

      return {
        isUnique,
        field: 'email',
        value: email
      };
    } catch (error) {
      console.error('Error checking email uniqueness:', error);
      return { isUnique: false, field: 'email', value: email };
    }
  }

  // Check if username is unique (excluding a specific user)
  static async checkUsernameUniqueness(username: string, excludeUserId?: string): Promise<UniqueCheckResult> {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { username },
        select: { documentNumber: true, username: true }
      });

      const isUnique = !existingUser || (excludeUserId ? existingUser.documentNumber === excludeUserId : false);

      return {
        isUnique,
        field: 'username',
        value: username
      };
    } catch (error) {
      console.error('Error checking username uniqueness:', error);
      return { isUnique: false, field: 'username', value: username };
    }
  }

  // Check if document number is unique (excluding a specific user)
  static async checkDocumentUniqueness(documentNumber: string, excludeUserId?: string): Promise<UniqueCheckResult> {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { documentNumber },
        select: { documentNumber: true }
      });

      const isUnique = !existingUser || (excludeUserId ? existingUser.documentNumber === excludeUserId : false);

      return {
        isUnique,
        field: 'documentNumber',
        value: documentNumber
      };
    } catch (error) {
      console.error('Error checking document uniqueness:', error);
      return { isUnique: false, field: 'documentNumber', value: documentNumber };
    }
  }

  // Validate user data for creation
  static async validateUserCreation(userData: {
    documentNumber: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    companyId?: number;
    headquartersId?: number;
  }): Promise<ValidationResult> {
    const errors: string[] = [];

    // Basic field validation
    if (!userData.documentNumber?.trim()) {
      errors.push('El número de documento es requerido');
    }

    if (!userData.email?.trim()) {
      errors.push('El email es requerido');
    } else if (!this.isValidEmail(userData.email)) {
      errors.push('El email no tiene un formato válido');
    }

    if (!userData.username?.trim()) {
      errors.push('El nombre de usuario es requerido');
    } else if (userData.username.length < 3) {
      errors.push('El nombre de usuario debe tener al menos 3 caracteres');
    }

    if (!userData.firstName?.trim()) {
      errors.push('El nombre es requerido');
    }

    if (!userData.lastName?.trim()) {
      errors.push('El apellido es requerido');
    }

    if (!userData.role || !Object.values(UserRole).includes(userData.role)) {
      errors.push('El rol seleccionado no es válido');
    }

    // Stop here if basic validation fails
    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Check uniqueness constraints
    const [emailCheck, usernameCheck, documentCheck] = await Promise.all([
      this.checkEmailUniqueness(userData.email),
      this.checkUsernameUniqueness(userData.username),
      this.checkDocumentUniqueness(userData.documentNumber)
    ]);

    if (!emailCheck.isUnique) {
      errors.push('Ya existe un usuario con este email');
    }

    if (!usernameCheck.isUnique) {
      errors.push('Ya existe un usuario con este nombre de usuario');
    }

    if (!documentCheck.isUnique) {
      errors.push('Ya existe un usuario con este número de documento');
    }

    // Validate company and headquarters if provided
    if (userData.companyId) {
      const companyExists = await prisma.company.findUnique({
        where: { id: userData.companyId },
        select: { id: true }
      });

      if (!companyExists) {
        errors.push('La empresa seleccionada no existe');
      }
    }

    if (userData.headquartersId) {
      const headquartersExists = await prisma.headquarters.findUnique({
        where: { id: userData.headquartersId },
        select: { id: true, companyId: true }
      });

      if (!headquartersExists) {
        errors.push('La sede seleccionada no existe');
      } else if (userData.companyId && headquartersExists.companyId !== userData.companyId) {
        errors.push('La sede seleccionada no pertenece a la empresa especificada');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // Validate user data for update
  static async validateUserUpdate(
    userId: string,
    userData: {
      email?: string;
      username?: string;
      firstName?: string;
      lastName?: string;
      role?: UserRole;
      companyId?: number;
      headquartersId?: number;
    }
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    // Basic field validation for provided fields
    if (userData.email !== undefined) {
      if (!userData.email?.trim()) {
        errors.push('El email es requerido');
      } else if (!this.isValidEmail(userData.email)) {
        errors.push('El email no tiene un formato válido');
      }
    }

    if (userData.username !== undefined) {
      if (!userData.username?.trim()) {
        errors.push('El nombre de usuario es requerido');
      } else if (userData.username.length < 3) {
        errors.push('El nombre de usuario debe tener al menos 3 caracteres');
      }
    }

    if (userData.firstName !== undefined && !userData.firstName?.trim()) {
      errors.push('El nombre es requerido');
    }

    if (userData.lastName !== undefined && !userData.lastName?.trim()) {
      errors.push('El apellido es requerido');
    }

    if (userData.role !== undefined && (!userData.role || !Object.values(UserRole).includes(userData.role))) {
      errors.push('El rol seleccionado no es válido');
    }

    // Stop here if basic validation fails
    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Check uniqueness constraints for changed fields
    const uniquenessChecks = [];

    if (userData.email) {
      uniquenessChecks.push(this.checkEmailUniqueness(userData.email, userId));
    }

    if (userData.username) {
      uniquenessChecks.push(this.checkUsernameUniqueness(userData.username, userId));
    }

    if (uniquenessChecks.length > 0) {
      const results = await Promise.all(uniquenessChecks);
      
      for (const result of results) {
        if (!result.isUnique) {
          if (result.field === 'email') {
            errors.push('Ya existe un usuario con este email');
          } else if (result.field === 'username') {
            errors.push('Ya existe un usuario con este nombre de usuario');
          }
        }
      }
    }

    // Validate company and headquarters if provided
    if (userData.companyId !== undefined) {
      if (userData.companyId) {
        const companyExists = await prisma.company.findUnique({
          where: { id: userData.companyId },
          select: { id: true }
        });

        if (!companyExists) {
          errors.push('La empresa seleccionada no existe');
        }
      }
    }

    if (userData.headquartersId !== undefined) {
      if (userData.headquartersId) {
        const headquartersExists = await prisma.headquarters.findUnique({
          where: { id: userData.headquartersId },
          select: { id: true, companyId: true }
        });

        if (!headquartersExists) {
          errors.push('La sede seleccionada no existe');
        } else if (userData.companyId && headquartersExists.companyId !== userData.companyId) {
          errors.push('La sede seleccionada no pertenece a la empresa especificada');
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // Check if user can manage another user based on role hierarchy
  static canManageUser(currentUserRole: UserRole, targetUserRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.SUPER_ADMIN]: 1,
      [UserRole.ADMIN]: 2,
      [UserRole.SUPERVISOR]: 3,
      [UserRole.USER]: 4
    };

    const currentLevel = roleHierarchy[currentUserRole];
    const targetLevel = roleHierarchy[targetUserRole];

    // SUPER_ADMIN can manage everyone
    if (currentUserRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Users can only manage users with lower hierarchy levels
    return currentLevel < targetLevel;
  }

  // Check if user can be assigned a specific role
  static canAssignRole(currentUserRole: UserRole, targetRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.SUPER_ADMIN]: 1,
      [UserRole.ADMIN]: 2,
      [UserRole.SUPERVISOR]: 3,
      [UserRole.USER]: 4
    };

    const currentLevel = roleHierarchy[currentUserRole];
    const targetLevel = roleHierarchy[targetRole];

    // SUPER_ADMIN can assign any role
    if (currentUserRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Users can only assign roles with equal or lower hierarchy levels
    return currentLevel <= targetLevel;
  }

  // Validate email format
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Get manageable roles for a user
  static getManagedRoles(currentUserRole: UserRole): UserRole[] {
    switch (currentUserRole) {
      case UserRole.SUPER_ADMIN:
        return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.USER];
      case UserRole.ADMIN:
        return [UserRole.SUPERVISOR, UserRole.USER];
      case UserRole.SUPERVISOR:
        return [UserRole.USER];
      default:
        return [];
    }
  }

  // Get assignable roles for a user
  static getAssignableRoles(currentUserRole: UserRole): UserRole[] {
    switch (currentUserRole) {
      case UserRole.SUPER_ADMIN:
        return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.USER];
      case UserRole.ADMIN:
        return [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.USER];
      case UserRole.SUPERVISOR:
        return [UserRole.SUPERVISOR, UserRole.USER];
      default:
        return [UserRole.USER];
    }
  }
}

export default UserValidation;