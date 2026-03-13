import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Permission {
  id: number;
  name: string;
  description: string;
  resource: string;
  action: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

interface PermissionState {
  // Estado
  permissions: Permission[];
  roles: Role[];
  isLoading: boolean;
  error: string | null;
  
  // Filtros y paginación
  searchTerm: string;
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  resourceFilter: string;
  actionFilter: string;
  
  // Acciones de estado
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchTerm: (term: string) => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  setTotalItems: (total: number) => void;
  setResourceFilter: (resource: string) => void;
  setActionFilter: (action: string) => void;
  
  // Acciones de permisos
  setPermissions: (permissions: Permission[]) => void;
  addPermission: (permission: Permission) => void;
  updatePermission: (id: number, permission: Partial<Permission>) => void;
  deletePermission: (id: number) => void;
  togglePermissionStatus: (id: number) => void;
  
  // Acciones de roles
  setRoles: (roles: Role[]) => void;
  addRole: (role: Role) => void;
  updateRole: (id: number, role: Partial<Role>) => void;
  deleteRole: (id: number) => void;
  toggleRoleStatus: (id: number) => void;
  
  // Acciones de asignación de permisos
  assignPermissionToRole: (roleId: number, permissionId: number) => void;
  removePermissionFromRole: (roleId: number, permissionId: number) => void;
  updateRolePermissions: (roleId: number, permissionIds: number[]) => void;
  
  // Acciones de filtrado
  filterPermissions: () => Permission[];
  filterRoles: () => Role[];
  getPermissionsByResource: (resource: string) => Permission[];
  getPermissionsByAction: (action: string) => Permission[];
  getRolePermissions: (roleId: number) => Permission[];
  
  // Acciones de reset
  resetFilters: () => void;
  clearError: () => void;
}

export const usePermissionStore = create<PermissionState>()(
  devtools(
    (set, get) => ({
      // Estado inicial
      permissions: [],
      roles: [],
      isLoading: false,
      error: null,
      searchTerm: '',
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      resourceFilter: '',
      actionFilter: '',
      
      // Acciones de estado
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      setSearchTerm: (term: string) => set({ searchTerm: term, currentPage: 1 }),
      setCurrentPage: (page: number) => set({ currentPage: page }),
      setItemsPerPage: (items: number) => set({ itemsPerPage: items, currentPage: 1 }),
      setTotalItems: (total: number) => set({ totalItems: total }),
      setResourceFilter: (resource: string) => set({ resourceFilter: resource, currentPage: 1 }),
      setActionFilter: (action: string) => set({ actionFilter: action, currentPage: 1 }),
      
      // Acciones de permisos
      setPermissions: (permissions: Permission[]) => set({ permissions }),
      addPermission: (permission: Permission) => set((state) => ({
        permissions: [...state.permissions, permission],
        totalItems: state.totalItems + 1,
      })),
      updatePermission: (id: number, permission: Partial<Permission>) => set((state) => ({
        permissions: state.permissions.map(p => p.id === id ? { ...p, ...permission } : p),
      })),
      deletePermission: (id: number) => set((state) => ({
        permissions: state.permissions.filter(p => p.id !== id),
        totalItems: state.totalItems - 1,
      })),
      togglePermissionStatus: (id: number) => set((state) => ({
        permissions: state.permissions.map(p => 
          p.id === id ? { ...p, isActive: !p.isActive } : p
        ),
      })),
      
      // Acciones de roles
      setRoles: (roles: Role[]) => set({ roles }),
      addRole: (role: Role) => set((state) => ({
        roles: [...state.roles, role],
      })),
      updateRole: (id: number, role: Partial<Role>) => set((state) => ({
        roles: state.roles.map(r => r.id === id ? { ...r, ...role } : r),
      })),
      deleteRole: (id: number) => set((state) => ({
        roles: state.roles.filter(r => r.id !== id),
      })),
      toggleRoleStatus: (id: number) => set((state) => ({
        roles: state.roles.map(r => 
          r.id === id ? { ...r, isActive: !r.isActive } : r
        ),
      })),
      
      // Acciones de asignación de permisos
      assignPermissionToRole: (roleId: number, permissionId: number) => set((state) => ({
        roles: state.roles.map(role => {
          if (role.id === roleId) {
            const permission = state.permissions.find(p => p.id === permissionId);
            if (permission && !role.permissions.some(p => p.id === permissionId)) {
              return {
                ...role,
                permissions: [...role.permissions, permission]
              };
            }
          }
          return role;
        })
      })),
      
      removePermissionFromRole: (roleId: number, permissionId: number) => set((state) => ({
        roles: state.roles.map(role => {
          if (role.id === roleId) {
            return {
              ...role,
              permissions: role.permissions.filter(p => p.id !== permissionId)
            };
          }
          return role;
        })
      })),
      
      updateRolePermissions: (roleId: number, permissionIds: number[]) => set((state) => ({
        roles: state.roles.map(role => {
          if (role.id === roleId) {
            const permissions = state.permissions.filter(p => permissionIds.includes(p.id));
            return {
              ...role,
              permissions
            };
          }
          return role;
        })
      })),
      
      // Acciones de filtrado
      filterPermissions: () => {
        const { permissions, searchTerm, resourceFilter, actionFilter } = get();
        let filtered = permissions;
        
        // Filtro por búsqueda
        if (searchTerm) {
          filtered = filtered.filter(permission =>
            permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            permission.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
            permission.action.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        // Filtro por recurso
        if (resourceFilter) {
          filtered = filtered.filter(permission => permission.resource === resourceFilter);
        }
        
        // Filtro por acción
        if (actionFilter) {
          filtered = filtered.filter(permission => permission.action === actionFilter);
        }
        
        return filtered;
      },
      
      filterRoles: () => {
        const { roles, searchTerm } = get();
        let filtered = roles;
        
        // Filtro por búsqueda
        if (searchTerm) {
          filtered = filtered.filter(role =>
            role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            role.description.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        return filtered;
      },
      
      getPermissionsByResource: (resource: string) => {
        const { permissions } = get();
        return permissions.filter(p => p.resource === resource);
      },
      
      getPermissionsByAction: (action: string) => {
        const { permissions } = get();
        return permissions.filter(p => p.action === action);
      },
      
      getRolePermissions: (roleId: number) => {
        const { roles } = get();
        const role = roles.find(r => r.id === roleId);
        return role ? role.permissions : [];
      },
      
      // Acciones de reset
      resetFilters: () => set({
        searchTerm: '',
        currentPage: 1,
        resourceFilter: '',
        actionFilter: '',
      }),
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'permission-store',
    }
  )
);
