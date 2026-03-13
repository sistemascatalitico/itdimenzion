import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Company {
  id: number;
  name: string;
  nit: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Headquarters {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  companyId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Process {
  id: number;
  name: string;
  description?: string;
  companyId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface JobTitle {
  id: number;
  name: string;
  description?: string;
  companyId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CompanyState {
  // Estado
  companies: Company[];
  headquarters: Headquarters[];
  processes: Process[];
  jobTitles: JobTitle[];
  isLoading: boolean;
  error: string | null;
  
  // Filtros y paginación
  searchTerm: string;
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  
  // Acciones de estado
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchTerm: (term: string) => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  setTotalItems: (total: number) => void;
  
  // Acciones de datos
  setCompanies: (companies: Company[]) => void;
  addCompany: (company: Company) => void;
  updateCompany: (id: number, company: Partial<Company>) => void;
  deleteCompany: (id: number) => void;
  
  setHeadquarters: (headquarters: Headquarters[]) => void;
  addHeadquarters: (headquarters: Headquarters) => void;
  updateHeadquarters: (id: number, headquarters: Partial<Headquarters>) => void;
  deleteHeadquarters: (id: number) => void;
  
  setProcesses: (processes: Process[]) => void;
  addProcess: (process: Process) => void;
  updateProcess: (id: number, process: Partial<Process>) => void;
  deleteProcess: (id: number) => void;
  
  setJobTitles: (jobTitles: JobTitle[]) => void;
  addJobTitle: (jobTitle: JobTitle) => void;
  updateJobTitle: (id: number, jobTitle: Partial<JobTitle>) => void;
  deleteJobTitle: (id: number) => void;
  
  // Acciones de filtrado
  filterCompanies: () => Company[];
  filterHeadquarters: () => Headquarters[];
  filterProcesses: () => Process[];
  filterJobTitles: () => JobTitle[];
  
  // Acciones de reset
  resetFilters: () => void;
  clearError: () => void;
}

export const useCompanyStore = create<CompanyState>()(
  devtools(
    (set, get) => ({
      // Estado inicial
      companies: [],
      headquarters: [],
      processes: [],
      jobTitles: [],
      isLoading: false,
      error: null,
      searchTerm: '',
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      
      // Acciones de estado
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      setSearchTerm: (term: string) => set({ searchTerm: term, currentPage: 1 }),
      setCurrentPage: (page: number) => set({ currentPage: page }),
      setItemsPerPage: (items: number) => set({ itemsPerPage: items, currentPage: 1 }),
      setTotalItems: (total: number) => set({ totalItems: total }),
      
      // Acciones de empresas
      setCompanies: (companies: Company[]) => set({ companies }),
      addCompany: (company: Company) => set((state) => ({
        companies: [...state.companies, company],
        totalItems: state.totalItems + 1,
      })),
      updateCompany: (id: number, company: Partial<Company>) => set((state) => ({
        companies: state.companies.map(c => c.id === id ? { ...c, ...company } : c),
      })),
      deleteCompany: (id: number) => set((state) => ({
        companies: state.companies.filter(c => c.id !== id),
        totalItems: state.totalItems - 1,
      })),
      
      // Acciones de sedes
      setHeadquarters: (headquarters: Headquarters[]) => set({ headquarters }),
      addHeadquarters: (headquarters: Headquarters) => set((state) => ({
        headquarters: [...state.headquarters, headquarters],
      })),
      updateHeadquarters: (id: number, headquarters: Partial<Headquarters>) => set((state) => ({
        headquarters: state.headquarters.map(h => h.id === id ? { ...h, ...headquarters } : h),
      })),
      deleteHeadquarters: (id: number) => set((state) => ({
        headquarters: state.headquarters.filter(h => h.id !== id),
      })),
      
      // Acciones de procesos
      setProcesses: (processes: Process[]) => set({ processes }),
      addProcess: (process: Process) => set((state) => ({
        processes: [...state.processes, process],
      })),
      updateProcess: (id: number, process: Partial<Process>) => set((state) => ({
        processes: state.processes.map(p => p.id === id ? { ...p, ...process } : p),
      })),
      deleteProcess: (id: number) => set((state) => ({
        processes: state.processes.filter(p => p.id !== id),
      })),
      
      // Acciones de cargos
      setJobTitles: (jobTitles: JobTitle[]) => set({ jobTitles }),
      addJobTitle: (jobTitle: JobTitle) => set((state) => ({
        jobTitles: [...state.jobTitles, jobTitle],
      })),
      updateJobTitle: (id: number, jobTitle: Partial<JobTitle>) => set((state) => ({
        jobTitles: state.jobTitles.map(j => j.id === id ? { ...j, ...jobTitle } : j),
      })),
      deleteJobTitle: (id: number) => set((state) => ({
        jobTitles: state.jobTitles.filter(j => j.id !== id),
      })),
      
      // Acciones de filtrado
      filterCompanies: () => {
        const { companies, searchTerm } = get();
        if (!searchTerm) return companies;
        
        return companies.filter(company =>
          company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.nit.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      },
      
      filterHeadquarters: () => {
        const { headquarters, searchTerm } = get();
        if (!searchTerm) return headquarters;
        
        return headquarters.filter(h =>
          h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          h.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          h.city.toLowerCase().includes(searchTerm.toLowerCase())
        );
      },
      
      filterProcesses: () => {
        const { processes, searchTerm } = get();
        if (!searchTerm) return processes;
        
        return processes.filter(p =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      },
      
      filterJobTitles: () => {
        const { jobTitles, searchTerm } = get();
        if (!searchTerm) return jobTitles;
        
        return jobTitles.filter(j =>
          j.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (j.description && j.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      },
      
      // Acciones de reset
      resetFilters: () => set({
        searchTerm: '',
        currentPage: 1,
      }),
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'company-store',
    }
  )
);
