// Permission system types for ITDimenzion platform

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string; // create, read, update, delete, manage
  resource: string; // users, companies, assets, etc.
  isSystem?: boolean; // Cannot be deleted
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  color: string; // For UI display
  level: number; // 1=SUPER_ADMIN, 2=ADMIN, 3=SUPERVISOR, 4=USER
  isSystem: boolean; // System roles cannot be deleted
  permissions: Permission[];
  userCount?: number; // Number of users with this role
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  parentModule?: string;
  isActive: boolean;
  order: number;
  permissions: Permission[];
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
  granted: boolean;
  grantedAt: Date;
  grantedBy: string; // User document number
}

export interface UserPermission {
  userId: string; // User document number
  permissionId: string;
  granted: boolean;
  grantedAt: Date;
  grantedBy: string; // User document number
  expiresAt?: Date;
}

// Permission constants
export const PERMISSION_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage', // All CRUD operations
  ASSIGN: 'assign', // For role/permission assignments
  EXPORT: 'export',
  IMPORT: 'import'
} as const;

export type PermissionAction = typeof PERMISSION_ACTIONS[keyof typeof PERMISSION_ACTIONS];

export const SYSTEM_MODULES = {
  DASHBOARD: 'dashboard',
  USERS: 'users',
  ROLES: 'roles', 
  PERMISSIONS: 'permissions',
  COMPANIES: 'companies',
  HEADQUARTERS: 'headquarters',
  PROCESSES: 'processes',
  JOB_TITLES: 'job_titles',
  ASSETS: 'assets',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  AUDIT: 'audit'
} as const;

export type SystemModule = typeof SYSTEM_MODULES[keyof typeof SYSTEM_MODULES];

// System roles with their hierarchical levels
export const SYSTEM_ROLES = {
  SUPER_ADMIN: {
    name: 'SUPER_ADMIN',
    level: 1,
    color: '#f44336', // Red
    description: 'Acceso completo al sistema'
  },
  ADMIN: {
    name: 'ADMIN', 
    level: 2,
    color: '#ff9800', // Orange
    description: 'Administrador de empresa'
  },
  SUPERVISOR: {
    name: 'SUPERVISOR',
    level: 3, 
    color: '#2196f3', // Blue
    description: 'Supervisor de procesos'
  },
  USER: {
    name: 'USER',
    level: 4,
    color: '#4caf50', // Green  
    description: 'Usuario final'
  }
} as const;

// Permission validation rules
export interface PermissionRule {
  canManageUsers: (currentUserRole: string) => string[]; // Returns allowed roles to manage
  canEditUser: (currentUserRole: string, targetUserRole: string) => boolean;
  canDeleteUser: (currentUserRole: string, targetUserRole: string) => boolean;
  canAssignRole: (currentUserRole: string, targetRole: string) => boolean;
}

export const permissionRules: PermissionRule = {
  canManageUsers: (currentUserRole: string): string[] => {
    switch (currentUserRole) {
      case 'SUPER_ADMIN':
        return ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'USER'];
      case 'ADMIN':
        return ['SUPERVISOR', 'USER'];
      case 'SUPERVISOR':
        return ['USER'];
      default:
        return [];
    }
  },

  canEditUser: (currentUserRole: string, targetUserRole: string): boolean => {
    const allowedRoles = permissionRules.canManageUsers(currentUserRole);
    return allowedRoles.includes(targetUserRole);
  },

  canDeleteUser: (currentUserRole: string, targetUserRole: string): boolean => {
    // Only SUPER_ADMIN can delete other SUPER_ADMINs
    if (targetUserRole === 'SUPER_ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
      return false;
    }
    return permissionRules.canEditUser(currentUserRole, targetUserRole);
  },

  canAssignRole: (currentUserRole: string, targetRole: string): boolean => {
    const allowedRoles = permissionRules.canManageUsers(currentUserRole);
    return allowedRoles.includes(targetRole);
  }
};

// Default permissions for each module
export const DEFAULT_PERMISSIONS: Record<SystemModule, Permission[]> = {
  [SYSTEM_MODULES.DASHBOARD]: [
    {
      id: 'dashboard_view',
      name: 'Ver Dashboard', 
      description: 'Acceso al panel principal',
      module: 'dashboard',
      action: PERMISSION_ACTIONS.READ,
      resource: 'dashboard',
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  [SYSTEM_MODULES.USERS]: [
    {
      id: 'users_create',
      name: 'Crear Usuarios',
      description: 'Crear nuevos usuarios en el sistema',
      module: 'users',
      action: PERMISSION_ACTIONS.CREATE, 
      resource: 'users',
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'users_read',
      name: 'Ver Usuarios',
      description: 'Visualizar lista y detalles de usuarios',
      module: 'users',
      action: PERMISSION_ACTIONS.READ,
      resource: 'users', 
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'users_update',
      name: 'Editar Usuarios',
      description: 'Modificar información de usuarios existentes',
      module: 'users', 
      action: PERMISSION_ACTIONS.UPDATE,
      resource: 'users',
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'users_delete',
      name: 'Eliminar Usuarios',
      description: 'Eliminar usuarios del sistema',
      module: 'users',
      action: PERMISSION_ACTIONS.DELETE,
      resource: 'users',
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'users_manage',
      name: 'Gestión Completa de Usuarios',
      description: 'Acceso completo a la gestión de usuarios',
      module: 'users',
      action: PERMISSION_ACTIONS.MANAGE,
      resource: 'users',
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  [SYSTEM_MODULES.ROLES]: [
    {
      id: 'roles_create',
      name: 'Crear Roles',
      description: 'Crear nuevos roles en el sistema',
      module: 'roles',
      action: PERMISSION_ACTIONS.CREATE,
      resource: 'roles',
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'roles_read', 
      name: 'Ver Roles',
      description: 'Visualizar roles y sus permisos',
      module: 'roles',
      action: PERMISSION_ACTIONS.READ,
      resource: 'roles',
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'roles_update',
      name: 'Editar Roles',
      description: 'Modificar roles y asignar permisos',
      module: 'roles',
      action: PERMISSION_ACTIONS.UPDATE,
      resource: 'roles',
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'roles_delete',
      name: 'Eliminar Roles',
      description: 'Eliminar roles personalizados',
      module: 'roles',
      action: PERMISSION_ACTIONS.DELETE,
      resource: 'roles',
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  [SYSTEM_MODULES.PERMISSIONS]: [
    {
      id: 'permissions_assign',
      name: 'Asignar Permisos',
      description: 'Asignar permisos a roles y usuarios',
      module: 'permissions',
      action: PERMISSION_ACTIONS.ASSIGN,
      resource: 'permissions',
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  [SYSTEM_MODULES.COMPANIES]: [
    {
      id: 'companies_manage',
      name: 'Gestión de Empresas',
      description: 'Gestión completa de empresas',
      module: 'companies',
      action: PERMISSION_ACTIONS.MANAGE,
      resource: 'companies',
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  [SYSTEM_MODULES.HEADQUARTERS]: [
    {
      id: 'headquarters_manage',
      name: 'Gestión de Sedes',
      description: 'Gestión completa de sedes',
      module: 'headquarters',
      action: PERMISSION_ACTIONS.MANAGE,
      resource: 'headquarters',
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  [SYSTEM_MODULES.PROCESSES]: [
    {
      id: 'processes_manage',
      name: 'Gestión de Procesos',
      description: 'Gestión completa de procesos',
      module: 'processes',
      action: PERMISSION_ACTIONS.MANAGE,
      resource: 'processes',
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  [SYSTEM_MODULES.JOB_TITLES]: [
    {
      id: 'job_titles_manage',
      name: 'Gestión de Cargos',
      description: 'Gestión completa de cargos',
      module: 'job_titles',
      action: PERMISSION_ACTIONS.MANAGE,
      resource: 'job_titles',
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  [SYSTEM_MODULES.ASSETS]: [
    {
      id: 'assets_manage',
      name: 'Gestión de Activos',
      description: 'Gestión completa de activos',
      module: 'assets',
      action: PERMISSION_ACTIONS.MANAGE,
      resource: 'assets',
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  [SYSTEM_MODULES.REPORTS]: [
    {
      id: 'reports_view',
      name: 'Ver Reportes',
      description: 'Acceso a reportes del sistema',
      module: 'reports',
      action: PERMISSION_ACTIONS.READ,
      resource: 'reports',
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'reports_export',
      name: 'Exportar Reportes',
      description: 'Exportar reportes en diferentes formatos',
      module: 'reports',
      action: PERMISSION_ACTIONS.EXPORT,
      resource: 'reports',
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  [SYSTEM_MODULES.SETTINGS]: [
    {
      id: 'settings_manage',
      name: 'Configuración del Sistema',
      description: 'Acceso a configuraciones del sistema',
      module: 'settings',
      action: PERMISSION_ACTIONS.MANAGE,
      resource: 'settings',
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  [SYSTEM_MODULES.AUDIT]: [
    {
      id: 'audit_view',
      name: 'Ver Auditoría',
      description: 'Acceso a logs de auditoría del sistema',
      module: 'audit',
      action: PERMISSION_ACTIONS.READ,
      resource: 'audit',
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
};