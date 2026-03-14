import api from '../config/api';

export interface Headquarters {
  id: number;
  name: string;
  companyId: number;
  country: string;
  state: string;
  city: string;
  addressLine1?: string;
  addressLine2?: string;
  phone?: string;
  email?: string;
  commentary?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  company?: {
    id: number;
    name: string;
  };
}

export interface HeadquartersListResponse {
  success: boolean;
  data: Headquarters[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const headquartersService = {
  // Obtener todas las sedes
  async getAll(): Promise<Headquarters[]> {
    try {
      console.log('🔄 headquartersService: Obteniendo sedes desde API...');
      const response = await api.get<HeadquartersListResponse>('/headquarters');
      // Normalizar IDs a números para asegurar compatibilidad con Set<number>
      const headquarters = (response.data.data || []).map(hq => ({
        ...hq,
        id: Number(hq.id),
        companyId: Number(hq.companyId),
        company: hq.company ? { ...hq.company, id: Number(hq.company.id) } : undefined
      }));
      console.log('✅ headquartersService: IDs normalizados como numbers');
      return headquarters;
    } catch (error) {
      console.error('❌ headquartersService: Error fetching headquarters:', error);
      throw error;
    }
  },

  // Obtener sedes por empresa
  async getByCompany(companyId: number): Promise<Headquarters[]> {
    try {
      console.log('🔄 headquartersService: Obteniendo sedes para empresa:', companyId);
      const response = await api.get<HeadquartersListResponse>(`/headquarters/company/${companyId}`);
      console.log('✅ headquartersService: Sedes obtenidas:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('❌ headquartersService: Error fetching headquarters by company:', error);
      throw error;
    }
  },

  // Obtener sede por ID
  async getById(id: number): Promise<Headquarters> {
    try {
      const response = await api.get<{ success: boolean; data: Headquarters }>(`/headquarters/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching headquarters:', error);
      throw error;
    }
  },

  // Buscar sedes por nombre
  async searchByName(name: string): Promise<Headquarters[]> {
    try {
      const response = await api.get<HeadquartersListResponse>('/headquarters', {
        params: { search: name }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error searching headquarters:', error);
      throw error;
    }
  }
};
