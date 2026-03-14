import api from '../config/api';

export interface Supplier {
  id: number;
  name: string;
  taxDocumentType?: string | null;
  taxDocumentNumber?: string | null;
  country: string;
  state: string;
  city: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  contactName?: string | null;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  companyId: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  company?: {
    id: number;
    name: string;
  };
}

export interface SupplierFormData {
  name: string;
  taxDocumentType?: string;
  taxDocumentNumber?: string;
  country: string;
  state: string;
  city: string;
  addressLine1?: string;
  addressLine2?: string;
  phone?: string;
  email?: string;
  contactName?: string;
  commentary?: string;
  companyId?: number;
}

export interface ListSuppliersParams {
  companyId?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  search?: string;
  page?: number;
  limit?: number;
}

class SupplierService {
  /**
   * Listar proveedores
   */
  async listSuppliers(params?: ListSuppliersParams): Promise<{ data: Supplier[]; pagination?: any }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.companyId) {
        queryParams.append('companyId', params.companyId.toString());
      }
      
      if (params?.status) {
        queryParams.append('status', params.status);
      }
      
      if (params?.search) {
        queryParams.append('search', params.search);
      }
      
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }

      const response = await api.get(`/suppliers?${queryParams.toString()}`);
      
      // Manejar diferentes estructuras de respuesta
      if (response.data.data) {
        return response.data;
      }
      
      return { data: Array.isArray(response.data) ? response.data : [] };
    } catch (error: any) {
      console.error('Error listing suppliers:', error);
      if (error.response?.status === 404) {
        // Endpoint no existe aún, retornar array vacío
        console.warn('Suppliers endpoint not found, returning empty array');
        return { data: [] };
      }
      throw error;
    }
  }

  /**
   * Obtener proveedor por ID
   */
  async getSupplier(id: number): Promise<Supplier> {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  }

  /**
   * Crear nuevo proveedor
   */
  async createSupplier(data: SupplierFormData): Promise<Supplier> {
    const response = await api.post('/suppliers', data);
    return response.data;
  }

  /**
   * Actualizar proveedor
   */
  async updateSupplier(id: number, data: Partial<SupplierFormData>): Promise<Supplier> {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
  }

  /**
   * Eliminar/Desactivar proveedor
   */
  async deleteSupplier(id: number): Promise<void> {
    await api.delete(`/suppliers/${id}`);
  }
}

export const supplierService = new SupplierService();
export default supplierService;






















