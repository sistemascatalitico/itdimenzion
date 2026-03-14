import api from '../config/api';

export interface Process {
  id: number;
  name: string;
  companyId: number;
  commentary?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  company?: {
    id: number;
    name: string;
  };
}

export interface ProcessListResponse {
  success: boolean;
  data: Process[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const processService = {
  // Obtener todos los procesos
  async getAll(): Promise<Process[]> {
    try {
      console.log('🔄 processService: Obteniendo procesos desde API...');
      const response = await api.get<ProcessListResponse>('/processes');
      // Normalizar IDs a números para asegurar compatibilidad con Set<number>
      const processes = (response.data.data || []).map(process => ({
        ...process,
        id: Number(process.id),
        companyId: Number(process.companyId),
        company: process.company ? { ...process.company, id: Number(process.company.id) } : undefined
      }));
      console.log('✅ processService: IDs normalizados como numbers');
      return processes;
    } catch (error) {
      console.error('❌ processService: Error fetching processes:', error);
      throw error;
    }
  },

  // Obtener procesos por empresa
  async getByCompany(companyId: number): Promise<Process[]> {
    try {
      console.debug('🔄 processService: Obteniendo procesos para empresa:', companyId);
      const response = await api.get<ProcessListResponse>(`/processes/company/${companyId}`);
      console.debug('✅ processService: Procesos obtenidos:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('❌ processService: Error fetching processes by company:', error);
      throw error;
    }
  },

  // Obtener proceso por ID
  async getById(id: number): Promise<Process> {
    try {
      const response = await api.get<{ success: boolean; data: Process }>(`/processes/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching process:', error);
      throw error;
    }
  },

  // Buscar procesos por nombre
  async searchByName(name: string): Promise<Process[]> {
    try {
      const response = await api.get<ProcessListResponse>('/processes', {
        params: { search: name }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error searching processes:', error);
      throw error;
    }
  }
};
