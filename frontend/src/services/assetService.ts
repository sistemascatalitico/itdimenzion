import api from '../config/api';

export interface AssetPayload {
  name?: string;
  assetCode?: string;
  serialNumber?: string | null;
  companyId?: number;
  headquartersId?: number;
  modelId?: number;
  groupId?: number;
  typeId?: number | null;
  categoryId?: number;
  purchaseDate?: string | null;
  purchaseValue?: number | null;
  location?: string | null;
  commentary?: string | null;
  assignedUserId?: string | null;
  processId?: number | null;
  jobTitleId?: number | null;
  costCenter?: string;
  status?: string;
  condition?: string;
  supplierId?: number | null;
  invoiceNumber?: string | null;
  // ✨ Campos dinámicos
  dynamicFields?: Record<string, any>;
  formData?: any;
}

const assetService = {
  list: (params?: Record<string, any>) => api.get('/assets', { params }).then(r => r.data),
  getById: (id: number) => api.get(`/assets/${id}`).then(r => r.data),
  create: (data: AssetPayload) => api.post('/assets', data).then(r => r.data),
  update: (id: number, data: AssetPayload) => api.put(`/assets/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/assets/${id}`).then(r => r.data),
  // Filtros por relaciones
  getByCategory: (categoryId: number) => api.get('/assets', { params: { categoryId } }).then(r => r.data),
  getByGroup: (groupId: number) => api.get('/assets', { params: { groupId } }).then(r => r.data),
  getByType: (typeId: number) => api.get('/assets', { params: { typeId } }).then(r => r.data),
  getByManufacturer: (manufacturerId: number) => api.get('/assets', { params: { manufacturerId } }).then(r => r.data),
  getByModel: (modelId: number) => api.get('/assets', { params: { modelId } }).then(r => r.data),
  // documentos
  listDocuments: (id: number) => api.get(`/assets/${id}/documents`).then(r => r.data),
  addDocument: (id: number, data: any) => api.post(`/assets/${id}/documents`, data).then(r => r.data),
  // asignaciones
  assign: (id: number, data: any) => api.post(`/assets/${id}/assign`, data).then(r => r.data),
  unassign: (id: number, data?: any) => api.post(`/assets/${id}/unassign`, data).then(r => r.data),
  // transferencias / préstamos
  transfer: (id: number, data: any) => api.post(`/assets/${id}/transfer`, data).then(r => r.data),
  loan: (id: number, data: any) => api.post(`/assets/${id}/loan`, data).then(r => r.data),
  loanReturn: (id: number, data?: any) => api.post(`/assets/${id}/loan/return`, data).then(r => r.data),
};

export default assetService;


