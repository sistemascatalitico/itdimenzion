import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  role: string;
  headquartersId: number;
  jobTitleId?: number;
  processId?: number;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

interface UserState {
  // Estado
  users: User[];
  isLoading: boolean;
  error: string | null;
  
  // Filtros y paginación
  searchTerm: string;
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  roleFilter: string;
  statusFilter: string;
  
  // Acciones de estado
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchTerm: (term: string) => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  setTotalItems: (total: number) => void;
  setRoleFilter: (role: string) => void;
  setStatusFilter: (status: string) => void;
  
  // Acciones de datos
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (id: number, user: Partial<User>) => void;
  deleteUser: (id: number) => void;
  toggleUserStatus: (id: number) => void;
  
  // Acciones de filtrado
  filterUsers: () => User[];
  getUsersByRole: (role: string) => User[];
  getActiveUsers: () => User[];
  getInactiveUsers: () => User[];
  
  // Acciones de reset
  resetFilters: () => void;
  clearError: () => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      // Estado inicial
      users: [],
      isLoading: false,
      error: null,
      searchTerm: '',
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      roleFilter: '',
      statusFilter: '',
      
      // Acciones de estado
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      setSearchTerm: (term: string) => set({ searchTerm: term, currentPage: 1 }),
      setCurrentPage: (page: number) => set({ currentPage: page }),
      setItemsPerPage: (items: number) => set({ itemsPerPage: items, currentPage: 1 }),
      setTotalItems: (total: number) => set({ totalItems: total }),
      setRoleFilter: (role: string) => set({ roleFilter: role, currentPage: 1 }),
      setStatusFilter: (status: string) => set({ statusFilter: status, currentPage: 1 }),
      
      // Acciones de datos
      setUsers: (users: User[]) => set({ users }),
      addUser: (user: User) => set((state) => ({
        users: [...state.users, user],
        totalItems: state.totalItems + 1,
      })),
      updateUser: (id: number, user: Partial<User>) => set((state) => ({
        users: state.users.map(u => u.id === id ? { ...u, ...user } : u),
      })),
      deleteUser: (id: number) => set((state) => ({
        users: state.users.filter(u => u.id !== id),
        totalItems: state.totalItems - 1,
      })),
      toggleUserStatus: (id: number) => set((state) => ({
        users: state.users.map(u => 
          u.id === id ? { ...u, isActive: !u.isActive } : u
        ),
      })),
      
      // Acciones de filtrado
      filterUsers: () => {
        const { users, searchTerm, roleFilter, statusFilter } = get();
        let filtered = users;
        
        // Filtro por búsqueda
        if (searchTerm) {
          filtered = filtered.filter(user =>
            user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.documentNumber.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        // Filtro por rol
        if (roleFilter) {
          filtered = filtered.filter(user => user.role === roleFilter);
        }
        
        // Filtro por estado
        if (statusFilter) {
          if (statusFilter === 'active') {
            filtered = filtered.filter(user => user.isActive);
          } else if (statusFilter === 'inactive') {
            filtered = filtered.filter(user => !user.isActive);
          }
        }
        
        return filtered;
      },
      
      getUsersByRole: (role: string) => {
        const { users } = get();
        return users.filter(user => user.role === role);
      },
      
      getActiveUsers: () => {
        const { users } = get();
        return users.filter(user => user.isActive);
      },
      
      getInactiveUsers: () => {
        const { users } = get();
        return users.filter(user => !user.isActive);
      },
      
      // Acciones de reset
      resetFilters: () => set({
        searchTerm: '',
        currentPage: 1,
        roleFilter: '',
        statusFilter: '',
      }),
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'user-store',
    }
  )
);
