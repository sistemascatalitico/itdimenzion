import api from '../config/api';

const customFieldService = {
  getFields: () =>
    api.get('/custom-fields').then(r => r.data),

  createField: (data: any) =>
    api.post('/custom-fields', data).then(r => r.data),

  updateField: (id: number, data: any) =>
    api.put(`/custom-fields/${id}`, data).then(r => r.data),

  deleteField: (id: number) =>
    api.delete(`/custom-fields/${id}`).then(r => r.data),

  getFieldOptions: (fieldId: number) =>
    api.get(`/custom-fields/${fieldId}/options`).then(r => r.data),

  addOption: (fieldId: number, data: any) =>
    api.post(`/custom-fields/${fieldId}/options`, data).then(r => r.data),

  updateOption: (optionId: number, data: any) =>
    api.put(`/custom-field-options/${optionId}`, data).then(r => r.data),

  deleteOption: (optionId: number) =>
    api.delete(`/custom-field-options/${optionId}`).then(r => r.data),

  getBindings: (params?: { scope?: string; scopeId?: number }) =>
    api.get('/custom-field-bindings', { params }).then(r => r.data),

  createBinding: (data: any) =>
    api.post('/custom-field-bindings', data).then(r => r.data),

  updateBinding: (id: number, data: any) =>
    api.put(`/custom-field-bindings/${id}`, data).then(r => r.data),

  deleteBinding: (id: number) =>
    api.delete(`/custom-field-bindings/${id}`).then(r => r.data),

  getResolvedFieldsForType: (typeId: number) =>
    api.get(`/asset-types/${typeId}/resolved-fields`).then(r => r.data),

  upsertAssetFieldValues: (assetId: number, data: any) =>
    api.post(`/assets/${assetId}/custom-field-values`, data).then(r => r.data),

  getFieldsForAssetType: (assetTypeId: number, modelId?: number) =>
    api.get(`/asset-types/${assetTypeId}/fields`, { params: modelId ? { modelId } : undefined }).then(r => r.data),

  invokeReusableField: (assetTypeId: number, fieldId: number, config?: {
    isRequired?: boolean;
    section?: string;
    displayOrder?: number;
  }) =>
    api.post(`/asset-types/${assetTypeId}/fields/invoke`, {
      fieldId,
      ...config,
    }).then(r => r.data),
};

export default customFieldService;
