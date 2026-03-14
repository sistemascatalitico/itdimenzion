import api from '../config/api';

const assetFilesService = {
  // ==================== MODEL IMAGES ====================
  
  /**
   * Listar imágenes de un modelo
   */
  getModelImages: (modelId: number) => {
    return api.get(`/asset-models/${modelId}/images`).then(r => r.data);
  },

  /**
   * Subir imagen a un modelo
   * @param modelId ID del modelo
   * @param file Archivo de imagen
   * @param title Título opcional
   * @param imageType Tipo de imagen (PHOTO, DIAGRAM, SCHEMATIC, OTHER)
   * @param order Orden de visualización
   */
  uploadModelImage: (modelId: number, file: File, title?: string, imageType: string = 'PHOTO', order: number = 0) => {
    const formData = new FormData();
    formData.append('image', file);
    if (title) formData.append('title', title);
    formData.append('imageType', imageType);
    formData.append('order', order.toString());
    
    return api.post(`/asset-models/${modelId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(r => r.data);
  },

  /**
   * Actualizar imagen de modelo
   */
  updateModelImage: (modelId: number, imageId: number, data: { title?: string; imageType?: string; order?: number }) => {
    return api.put(`/asset-models/${modelId}/images/${imageId}`, data).then(r => r.data);
  },

  /**
   * Eliminar imagen de modelo
   */
  deleteModelImage: (modelId: number, imageId: number) => {
    return api.delete(`/asset-models/${modelId}/images/${imageId}`).then(r => r.data);
  },

  // ==================== MODEL DOCUMENTS ====================
  
  /**
   * Listar documentos de un modelo
   */
  getModelDocuments: (modelId: number) => {
    return api.get(`/asset-models/${modelId}/documents`).then(r => r.data);
  },

  /**
   * Subir documento a un modelo
   * @param modelId ID del modelo
   * @param file Archivo (PDF o imagen)
   * @param title Título del documento
   * @param docType Tipo de documento (MANUAL, DATASHEET, WARRANTY, OTHER)
   */
  uploadModelDocument: (modelId: number, file: File, title: string, docType: string = 'MANUAL') => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('title', title);
    formData.append('docType', docType);
    
    return api.post(`/asset-models/${modelId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(r => r.data);
  },

  /**
   * Actualizar documento de modelo
   */
  updateModelDocument: (modelId: number, docId: number, data: { title?: string; docType?: string }) => {
    return api.put(`/asset-models/${modelId}/documents/${docId}`, data).then(r => r.data);
  },

  /**
   * Eliminar documento de modelo
   */
  deleteModelDocument: (modelId: number, docId: number) => {
    return api.delete(`/asset-models/${modelId}/documents/${docId}`).then(r => r.data);
  },

  // ==================== ASSET IMAGES ====================
  
  /**
   * Listar imágenes de un activo (solo las del activo, no del modelo)
   */
  getAssetImages: (assetId: number) => {
    return api.get(`/assets/${assetId}/images`).then(r => r.data);
  },

  /**
   * Subir imagen a un activo
   */
  uploadAssetImage: (assetId: number, file: File, title?: string, imageType: string = 'PHOTO', order: number = 0) => {
    const formData = new FormData();
    formData.append('image', file);
    if (title) formData.append('title', title);
    formData.append('imageType', imageType);
    formData.append('order', order.toString());
    
    return api.post(`/assets/${assetId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(r => r.data);
  },

  /**
   * Actualizar imagen de activo
   */
  updateAssetImage: (assetId: number, imageId: number, data: { title?: string; imageType?: string; order?: number }) => {
    return api.put(`/assets/${assetId}/images/${imageId}`, data).then(r => r.data);
  },

  /**
   * Eliminar imagen de activo
   */
  deleteAssetImage: (assetId: number, imageId: number) => {
    return api.delete(`/assets/${assetId}/images/${imageId}`).then(r => r.data);
  },

  // ==================== ASSET DOCUMENTS ====================
  
  /**
   * Listar documentos de un activo (solo los del activo, no del modelo)
   */
  getAssetDocuments: (assetId: number) => {
    return api.get(`/assets/${assetId}/documents`).then(r => r.data);
  },

  /**
   * Obtener documentos activos de un activo
   */
  getActiveAssetDocuments: (assetId: number) => {
    return api.get(`/assets/${assetId}/documents/active`).then(r => r.data);
  },

  /**
   * Subir documento a un activo
   */
  uploadAssetDocument: (
    assetId: number,
    file: File,
    docType: string,
    title: string,
    data?: {
      externalRef?: string;
      supplier?: string;
      amount?: number;
      documentDate?: string;
      commentary?: string;
      relatedUserId?: string;
      relatedCompanyId?: number;
      relatedDocumentId?: number;
    }
  ) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('docType', docType);
    formData.append('title', title);
    if (data) {
      if (data.externalRef) formData.append('externalRef', data.externalRef);
      if (data.supplier) formData.append('supplier', data.supplier);
      if (data.amount) formData.append('amount', data.amount.toString());
      if (data.documentDate) formData.append('documentDate', data.documentDate);
      if (data.commentary) formData.append('commentary', data.commentary);
      if (data.relatedUserId) formData.append('relatedUserId', data.relatedUserId);
      if (data.relatedCompanyId) formData.append('relatedCompanyId', data.relatedCompanyId.toString());
      if (data.relatedDocumentId) formData.append('relatedDocumentId', data.relatedDocumentId.toString());
    }
    
    return api.post(`/assets/${assetId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(r => r.data);
  },

  /**
   * Actualizar documento de activo
   */
  updateAssetDocument: (assetId: number, docId: number, data: any, file?: File) => {
    const formData = new FormData();
    if (file) formData.append('document', file);
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, typeof data[key] === 'object' ? JSON.stringify(data[key]) : String(data[key]));
      }
    });
    
    return api.put(`/assets/${assetId}/documents/${docId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(r => r.data);
  },

  /**
   * Eliminar documento de activo
   */
  deleteAssetDocument: (assetId: number, docId: number) => {
    return api.delete(`/assets/${assetId}/documents/${docId}`).then(r => r.data);
  },

  // ==================== RESOLVED DATA (MODEL + ASSET) ====================
  
  /**
   * Obtener imágenes resueltas (modelo + activo combinados)
   */
  getResolvedAssetImages: (assetId: number) => {
    return api.get(`/assets/${assetId}/images/resolved`).then(r => r.data);
  },

  /**
   * Obtener documentos resueltos (modelo + activo combinados)
   */
  getResolvedAssetDocuments: (assetId: number) => {
    return api.get(`/assets/${assetId}/documents/resolved`).then(r => r.data);
  },

  /**
   * Obtener todo resuelto (imágenes + documentos combinados)
   */
  getResolvedAssetData: (assetId: number) => {
    return api.get(`/assets/${assetId}/resolved`).then(r => r.data);
  },
};

export default assetFilesService;

