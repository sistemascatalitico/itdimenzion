import api from '../config/api';

export interface Company {
  id: number;
  name: string;
  taxDocumentType: string;
  taxDocumentNumber: string;
  country: string;
  state: string;
  city: string;
  addressLine1?: string;
  addressLine2?: string;
  phone?: string;
  email?: string;
  website?: string;
  commentary?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface CompanyListResponse {
  success: boolean;
  data: Company[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const companyService = {
  // Obtener todas las empresas
  async getAll(): Promise<Company[]> {
    try {
      console.log('🔄 companyService: Obteniendo empresas desde API...');
      const response = await api.get<CompanyListResponse>('/companies');
      console.log('✅ companyService: Respuesta de API:', response.data);
      // Normalizar IDs a números para asegurar compatibilidad con Set<number>
      const companies = (response.data.data || []).map(company => ({
        ...company,
        id: Number(company.id)
      }));
      console.log('✅ companyService: IDs normalizados como numbers');
      return companies;
    } catch (error) {
      console.error('❌ companyService: Error fetching companies:', error);
      throw error;
    }
  },

  // Obtener empresa por ID
  async getById(id: number): Promise<Company> {
    try {
      const response = await api.get<{ success: boolean; data: Company }>(`/companies/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching company:', error);
      throw error;
    }
  },

  // Buscar empresas por nombre
  async searchByName(name: string): Promise<Company[]> {
    try {
      const response = await api.get<CompanyListResponse>('/companies', {
        params: { search: name }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error searching companies:', error);
      throw error;
    }
  }
};
