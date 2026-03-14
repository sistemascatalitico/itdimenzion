import api from '../config/api';

export interface JobTitle {
  id: number;
  name: string;
  processId: number;
  companyId: number;
  commentary?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  process?: {
    id: number;
    name: string;
  };
  company?: {
    id: number;
    name: string;
  };
}

export interface JobTitleListResponse {
  success: boolean;
  data: JobTitle[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const jobTitleService = {
  // Obtener todos los cargos
  async getAll(): Promise<JobTitle[]> {
    try {
      console.log('🔄 jobTitleService: Obteniendo cargos desde API...');
      const response = await api.get<JobTitleListResponse>('/job-titles');
      // Normalizar IDs a números para asegurar compatibilidad con Set<number>
      const jobTitles = (response.data.data || []).map(jobTitle => ({
        ...jobTitle,
        id: Number(jobTitle.id),
        processId: Number(jobTitle.processId),
        companyId: Number(jobTitle.companyId),
        process: jobTitle.process ? { ...jobTitle.process, id: Number(jobTitle.process.id) } : undefined,
        company: jobTitle.company ? { ...jobTitle.company, id: Number(jobTitle.company.id) } : undefined
      }));
      console.log('✅ jobTitleService: IDs normalizados como numbers');
      return jobTitles;
    } catch (error) {
      console.error('❌ jobTitleService: Error fetching job titles:', error);
      throw error;
    }
  },

  // Obtener cargos por proceso
  async getByProcess(processId: number): Promise<JobTitle[]> {
    try {
      console.log('🔄 jobTitleService: Obteniendo cargos para proceso:', processId);
      const response = await api.get<JobTitleListResponse>(`/job-titles/process/${processId}`);
      console.log('✅ jobTitleService: Cargos obtenidos:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('❌ jobTitleService: Error fetching job titles by process:', error);
      throw error;
    }
  },

  // Obtener cargos por empresa
  async getByCompany(companyId: number): Promise<JobTitle[]> {
    try {
      console.log('🔄 jobTitleService: Obteniendo cargos para empresa:', companyId);
      const response = await api.get<JobTitleListResponse>(`/job-titles/company/${companyId}`);
      console.log('✅ jobTitleService: Cargos obtenidos:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('❌ jobTitleService: Error fetching job titles by company:', error);
      throw error;
    }
  },

  // Obtener cargo por ID
  async getById(id: number): Promise<JobTitle> {
    try {
      const response = await api.get<{ success: boolean; data: JobTitle }>(`/job-titles/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching job title:', error);
      throw error;
    }
  },

  // Buscar cargos por nombre
  async searchByName(name: string): Promise<JobTitle[]> {
    try {
      const response = await api.get<JobTitleListResponse>('/job-titles', {
        params: { search: name }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error searching job titles:', error);
      throw error;
    }
  }
};
