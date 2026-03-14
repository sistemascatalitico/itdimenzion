import api from '../config/api';

const assetCatalogService = {
  // manufacturers
  getManufacturers: (params?: Record<string, any>) => {
    const finalParams = {
      ...params,
      populate: params?.populate || 'categories' // Incluir categorías por defecto
    };
    return api.get('/asset-manufacturers', { params: finalParams }).then(r => r.data);
  },
  createManufacturer: (data: any) => api.post('/asset-manufacturers', data).then(r => r.data),
  updateManufacturer: (id: number, data: any) => api.put(`/asset-manufacturers/${id}`, data).then(r => r.data),
  deleteManufacturer: (id: string | number) => api.delete(`/asset-manufacturers/${id}`).then(r => r.data),

  // categories
  getCategories: () => api.get('/asset-categories').then(r => r.data),
  createCategory: (data: any) => api.post('/asset-categories', data).then(r => r.data),
  updateCategory: (id: number, data: any) => api.put(`/asset-categories/${id}`, data).then(r => r.data),

  // groups
  getGroups: (params?: Record<string, any>) => api.get('/asset-groups', { 
    params: { 
      ...params,
      populate: 'category' // Incluir relación category
    } 
  }).then(r => r.data),
  getGroupsByCategory: (categoryId: number) => api.get(`/asset-groups/category/${categoryId}`).then(r => r.data),
  createGroup: (data: any) => api.post('/asset-groups', data).then(r => r.data),
  updateGroup: (id: number, data: any) => api.put(`/asset-groups/${id}`, data).then(r => r.data),

  // types
  getTypes: (params?: Record<string, any>) => api.get('/asset-types', { 
    params: { 
      ...params,
      populate: params?.populate || 'group,category' // Incluir relación group y category por defecto
    } 
  }).then(r => r.data),
  createType: (data: any) => api.post('/asset-types', data).then(r => r.data),
  updateType: (id: number, data: any) => api.put(`/asset-types/${id}`, data).then(r => r.data),

  // models
  getModels: (params?: Record<string, any>) => api.get('/asset-models', { 
    params: { 
      ...params,
      // Incluir manufacturer y type con sus relaciones completas
      populate: params?.populate || 'manufacturer,type,type.group,type.group.category'
    } 
  }).then(r => r.data),
  createModel: (data: any) => api.post('/asset-models', data).then(r => r.data),
  updateModel: (id: number, data: any) => api.put(`/asset-models/${id}`, data).then(r => r.data),
};

export default assetCatalogService;


