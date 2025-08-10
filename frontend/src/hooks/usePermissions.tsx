import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Permission, 
  Role, 
  Module, 
  permissionRules, 
  SYSTEM_ROLES,
  DEFAULT_PERMISSIONS,
  SYSTEM_MODULES 
} from '../types/permissions';

interface UsePermissionsReturn {
  // Permission checks
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasModuleAccess: (module: string) => boolean;
  
  // User management permissions
  canManageUser: (targetUserRole: string) => boolean;
  canEditUser: (targetUserRole: string) => boolean;
  canDeleteUser: (targetUserRole: string) => boolean;
  canAssignRole: (targetRole: string) => boolean;
  getManagedRoles: () => string[];
  
  // Role management
  canCreateRole: () => boolean;
  canEditRole: (role: Role) => boolean;
  canDeleteRole: (role: Role) => boolean;
  canCloneRole: (role: Role) => boolean;
  
  // Data and state
  userPermissions: Permission[];
  availableModules: Module[];
  availableRoles: Role[];
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshPermissions: () => Promise<void>;
  checkDocumentUniqueness: (documentNumber: string, excludeUser?: string) => Promise<boolean>;
  checkEmailUniqueness: (email: string, excludeUser?: string) => Promise<boolean>;
  checkUsernameUniqueness: (username: string, excludeUser?: string) => Promise<boolean>;
}

export const usePermissions = (): UsePermissionsReturn => {
  const { user } = useAuth();
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize default data
  useEffect(() => {
    initializePermissions();
  }, [user]);

  const initializePermissions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get user permissions based on role (for now, using defaults)
      const rolePermissions = getUserPermissionsByRole(user.role);
      setUserPermissions(rolePermissions);
      
      // Initialize modules
      const modules = getAvailableModules();
      setAvailableModules(modules);
      
      // Initialize roles based on user's level
      const roles = getAvailableRoles(user.role);
      setAvailableRoles(roles);
      
      setError(null);
    } catch (err) {
      setError('Error loading permissions');
      console.error('Permission loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUserPermissionsByRole = (userRole: string): Permission[] => {
    const allPermissions: Permission[] = [];
    
    switch (userRole) {
      case 'SUPER_ADMIN':
        // Super admin gets all permissions
        Object.values(DEFAULT_PERMISSIONS).forEach(modulePerms => {
          allPermissions.push(...modulePerms);
        });
        break;
        
      case 'ADMIN':
        // Admin gets most permissions except system settings
        Object.entries(DEFAULT_PERMISSIONS).forEach(([module, permissions]) => {
          if (module !== SYSTEM_MODULES.SETTINGS && module !== SYSTEM_MODULES.AUDIT) {
            allPermissions.push(...permissions);
          }
        });
        break;
        
      case 'SUPERVISOR':
        // Supervisor gets basic permissions
        allPermissions.push(
          ...DEFAULT_PERMISSIONS[SYSTEM_MODULES.DASHBOARD],
          ...DEFAULT_PERMISSIONS[SYSTEM_MODULES.USERS].filter(p => p.action === 'read'),
          ...DEFAULT_PERMISSIONS[SYSTEM_MODULES.REPORTS]
        );
        break;
        
      case 'USER':
        // Basic user permissions
        allPermissions.push(
          ...DEFAULT_PERMISSIONS[SYSTEM_MODULES.DASHBOARD],
          ...DEFAULT_PERMISSIONS[SYSTEM_MODULES.REPORTS].filter(p => p.action === 'read')
        );
        break;
    }
    
    return allPermissions;
  };

  const getAvailableModules = (): Module[] => {
    return [
      {
        id: SYSTEM_MODULES.DASHBOARD,
        name: 'Dashboard',
        description: 'Panel principal del sistema',
        icon: 'dashboard',
        path: '/dashboard',
        isActive: true,
        order: 1,
        permissions: DEFAULT_PERMISSIONS[SYSTEM_MODULES.DASHBOARD]
      },
      {
        id: SYSTEM_MODULES.USERS,
        name: 'Usuarios',
        description: 'Gestión de usuarios del sistema',
        icon: 'people',
        path: '/users',
        isActive: true,
        order: 2,
        permissions: DEFAULT_PERMISSIONS[SYSTEM_MODULES.USERS]
      },
      {
        id: SYSTEM_MODULES.ROLES,
        name: 'Roles',
        description: 'Gestión de roles y permisos',
        icon: 'admin_panel_settings',
        path: '/roles',
        isActive: true,
        order: 3,
        permissions: DEFAULT_PERMISSIONS[SYSTEM_MODULES.ROLES]
      },
      {
        id: SYSTEM_MODULES.COMPANIES,
        name: 'Empresas',
        description: 'Gestión de empresas',
        icon: 'business',
        path: '/companies',
        isActive: true,
        order: 4,
        permissions: DEFAULT_PERMISSIONS[SYSTEM_MODULES.COMPANIES]
      },
      {
        id: SYSTEM_MODULES.HEADQUARTERS,
        name: 'Sedes',
        description: 'Gestión de sedes',
        icon: 'location_city',
        path: '/headquarters',
        isActive: true,
        order: 5,
        permissions: DEFAULT_PERMISSIONS[SYSTEM_MODULES.HEADQUARTERS]
      },
      {
        id: SYSTEM_MODULES.PROCESSES,
        name: 'Procesos',
        description: 'Gestión de procesos',
        icon: 'account_tree',
        path: '/processes',
        isActive: true,
        order: 6,
        permissions: DEFAULT_PERMISSIONS[SYSTEM_MODULES.PROCESSES]
      },
      {
        id: SYSTEM_MODULES.JOB_TITLES,
        name: 'Cargos',
        description: 'Gestión de cargos',
        icon: 'work',
        path: '/job-titles',
        isActive: true,
        order: 7,
        permissions: DEFAULT_PERMISSIONS[SYSTEM_MODULES.JOB_TITLES]
      },
      {
        id: SYSTEM_MODULES.ASSETS,
        name: 'Activos',
        description: 'Gestión de activos',
        icon: 'inventory_2',
        path: '/assets',
        isActive: true,
        order: 8,
        permissions: DEFAULT_PERMISSIONS[SYSTEM_MODULES.ASSETS]
      },
      {
        id: SYSTEM_MODULES.REPORTS,
        name: 'Reportes',
        description: 'Reportes del sistema',
        icon: 'assessment',
        path: '/reports',
        isActive: true,
        order: 9,
        permissions: DEFAULT_PERMISSIONS[SYSTEM_MODULES.REPORTS]
      },
      {
        id: SYSTEM_MODULES.SETTINGS,
        name: 'Configuración',
        description: 'Configuración del sistema',
        icon: 'settings',
        path: '/settings',
        isActive: true,
        order: 10,
        permissions: DEFAULT_PERMISSIONS[SYSTEM_MODULES.SETTINGS]
      },
      {
        id: SYSTEM_MODULES.AUDIT,
        name: 'Auditoría',
        description: 'Logs de auditoría',
        icon: 'history',
        path: '/audit',
        isActive: true,
        order: 11,
        permissions: DEFAULT_PERMISSIONS[SYSTEM_MODULES.AUDIT]
      }
    ];
  };

  const getAvailableRoles = (currentUserRole: string): Role[] => {
    const roles: Role[] = [];
    const currentLevel = SYSTEM_ROLES[currentUserRole as keyof typeof SYSTEM_ROLES]?.level || 4;
    
    // Add system roles based on user's level
    Object.values(SYSTEM_ROLES).forEach(systemRole => {
      if (systemRole.level >= currentLevel || currentUserRole === 'SUPER_ADMIN') {
        roles.push({
          id: systemRole.name,
          name: systemRole.name,
          description: systemRole.description,
          color: systemRole.color,
          level: systemRole.level,
          isSystem: true,
          permissions: getUserPermissionsByRole(systemRole.name),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });
    
    // TODO: Add custom roles from database
    
    return roles;
  };

  // Permission checking functions
  const hasPermission = useCallback((permission: string): boolean => {
    return userPermissions.some(p => p.id === permission);
  }, [userPermissions]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasModuleAccess = useCallback((module: string): boolean => {
    return userPermissions.some(p => p.module === module);
  }, [userPermissions]);

  // User management permissions
  const canManageUser = useCallback((targetUserRole: string): boolean => {
    if (!user) return false;
    return permissionRules.canEditUser(user.role, targetUserRole);
  }, [user]);

  const canEditUser = useCallback((targetUserRole: string): boolean => {
    return canManageUser(targetUserRole) && hasPermission('users_update');
  }, [canManageUser, hasPermission]);

  const canDeleteUser = useCallback((targetUserRole: string): boolean => {
    if (!user) return false;
    return permissionRules.canDeleteUser(user.role, targetUserRole) && hasPermission('users_delete');
  }, [user, hasPermission]);

  const canAssignRole = useCallback((targetRole: string): boolean => {
    if (!user) return false;
    return permissionRules.canAssignRole(user.role, targetRole);
  }, [user]);

  const getManagedRoles = useCallback((): string[] => {
    if (!user) return [];
    return permissionRules.canManageUsers(user.role);
  }, [user]);

  // Role management permissions
  const canCreateRole = useCallback((): boolean => {
    return hasPermission('roles_create');
  }, [hasPermission]);

  const canEditRole = useCallback((role: Role): boolean => {
    if (role.isSystem) return false; // System roles cannot be edited
    return hasPermission('roles_update');
  }, [hasPermission]);

  const canDeleteRole = useCallback((role: Role): boolean => {
    if (role.isSystem) return false; // System roles cannot be deleted
    return hasPermission('roles_delete');
  }, [hasPermission]);

  const canCloneRole = useCallback((role: Role): boolean => {
    return hasPermission('roles_create');
  }, [hasPermission]);

  // Utility functions
  const refreshPermissions = useCallback(async (): Promise<void> => {
    await initializePermissions();
  }, []);

  const checkDocumentUniqueness = useCallback(async (
    documentNumber: string, 
    excludeUser?: string
  ): Promise<boolean> => {
    try {
      // TODO: Implement actual API call
      const response = await fetch(`/api/users/check-document?documentNumber=${documentNumber}&exclude=${excludeUser || ''}`);
      const data = await response.json();
      return data.isUnique;
    } catch (error) {
      console.error('Error checking document uniqueness:', error);
      return false;
    }
  }, []);

  const checkEmailUniqueness = useCallback(async (
    email: string,
    excludeUser?: string
  ): Promise<boolean> => {
    try {
      // TODO: Implement actual API call
      const response = await fetch(`/api/users/check-email?email=${email}&exclude=${excludeUser || ''}`);
      const data = await response.json();
      return data.isUnique;
    } catch (error) {
      console.error('Error checking email uniqueness:', error);
      return false;
    }
  }, []);

  const checkUsernameUniqueness = useCallback(async (
    username: string,
    excludeUser?: string  
  ): Promise<boolean> => {
    try {
      // TODO: Implement actual API call
      const response = await fetch(`/api/users/check-username?username=${username}&exclude=${excludeUser || ''}`);
      const data = await response.json();
      return data.isUnique;
    } catch (error) {
      console.error('Error checking username uniqueness:', error);
      return false;
    }
  }, []);

  return {
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasModuleAccess,
    
    // User management permissions
    canManageUser,
    canEditUser,
    canDeleteUser,
    canAssignRole,
    getManagedRoles,
    
    // Role management
    canCreateRole,
    canEditRole,
    canDeleteRole,
    canCloneRole,
    
    // Data and state
    userPermissions,
    availableModules,
    availableRoles,
    loading,
    error,
    
    // Actions
    refreshPermissions,
    checkDocumentUniqueness,
    checkEmailUniqueness,
    checkUsernameUniqueness
  };
};