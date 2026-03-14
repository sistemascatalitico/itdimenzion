import api from '../config/api';
import { Form, FormField, FormModuleType, FormStatus } from '../stores/formBuilderStore';

interface ListFormsParams {
  companyId?: number;
  moduleType?: FormModuleType;
  status?: FormStatus;
  isTemplate?: boolean;
  assetTypeId?: number;
  search?: string;
  page?: number;
  limit?: number;
}

interface CreateFormData {
  name: string;
  description?: string;
  moduleType: FormModuleType;
  companyId: number;
  assetTypeId?: number;
  assetCategoryId?: number;
  assetGroupId?: number;
  isTemplate?: boolean;
  status?: FormStatus;
  clonedFromId?: number;
  stepsConfig?: any;
  stylesConfig?: any;
  submissionConfig?: any;
  securityConfig?: any;
}

interface UpdateFormData {
  name?: string;
  description?: string;
  status?: FormStatus;
  isTemplate?: boolean;
  stepsConfig?: any;
  stylesConfig?: any;
  submissionConfig?: any;
  securityConfig?: any;
  assetTypeId?: number | null;
}

interface CreateFieldData {
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  isRequired?: boolean;
  isReadonly?: boolean;
  isHidden?: boolean;
  defaultValue?: string;
  placeholder?: string;
  helpText?: string;
  options?: any;
  validationRules?: any;
  autoFill?: string;
  autoFillSource?: string;
  autoFillMode?: string;
  hasAutoNumbering?: boolean;
  numberingConfig?: any;
  section?: string;
  displayOrder?: number;
  columnPosition?: string;
  conditionalLogic?: any;
}

interface UpdateFieldData {
  fieldLabel?: string;
  fieldType?: string;
  isRequired?: boolean;
  isReadonly?: boolean;
  isHidden?: boolean;
  defaultValue?: string;
  placeholder?: string;
  helpText?: string;
  options?: any;
  validationRules?: any;
  autoFill?: string;
  autoFillSource?: string;
  autoFillMode?: string;
  hasAutoNumbering?: boolean;
  numberingConfig?: any;
  section?: string;
  displayOrder?: number;
  columnPosition?: string;
  conditionalLogic?: any;
}

interface ReorderFieldsData {
  fieldOrders: { id: number; displayOrder: number }[];
}

const formBuilderService = {
  // =========================
  // FORMS
  // =========================

  /**
   * Listar formularios
   */
  listForms: (params?: ListFormsParams) => {
    return api.get('/forms', { params }).then(r => r.data);
  },

  /**
   * Obtener un formulario por ID
   */
  getForm: (id: number) => {
    return api.get(`/forms/${id}`).then(r => r.data);
  },

  /**
   * Obtener formulario por AssetType
   */
  getFormByAssetType: (assetTypeId: number) => {
    return api.get(`/forms/asset-type/${assetTypeId}`).then(r => r.data);
  },

  /**
   * Crear un nuevo formulario
   */
  createForm: (data: CreateFormData) => {
    return api.post('/forms', data).then(r => r.data);
  },

  /**
   * Actualizar un formulario
   */
  updateForm: (id: number, data: UpdateFormData) => {
    return api.put(`/forms/${id}`, data).then(r => r.data);
  },

  /**
   * Eliminar un formulario (soft delete)
   */
  deleteForm: (id: number) => {
    return api.delete(`/forms/${id}`).then(r => r.data);
  },

  /**
   * Clonar un formulario
   */
  cloneForm: (id: number, data?: { name?: string; description?: string; assetTypeId?: number; companyId?: number }) => {
    return api.post(`/forms/${id}/clone`, data || {}).then(r => r.data);
  },

  // =========================
  // FORM FIELDS
  // =========================

  /**
   * Listar campos de un formulario
   */
  listFormFields: (formId: number) => {
    return api.get(`/forms/${formId}/fields`).then(r => r.data);
  },

  /**
   * Obtener un campo por ID
   */
  getFormField: (formId: number, fieldId: number) => {
    return api.get(`/forms/${formId}/fields/${fieldId}`).then(r => r.data);
  },

  /**
   * Crear un nuevo campo
   */
  createFormField: (formId: number, data: CreateFieldData) => {
    return api.post(`/forms/${formId}/fields`, data).then(r => r.data);
  },

  /**
   * Actualizar un campo
   */
  updateFormField: (formId: number, fieldId: number, data: UpdateFieldData) => {
    return api.put(`/forms/${formId}/fields/${fieldId}`, data).then(r => r.data);
  },

  /**
   * Eliminar un campo (soft delete)
   */
  deleteFormField: (formId: number, fieldId: number) => {
    return api.delete(`/forms/${formId}/fields/${fieldId}`).then(r => r.data);
  },

  /**
   * Reordenar campos de un formulario
   */
  reorderFormFields: (formId: number, data: ReorderFieldsData) => {
    return api.put(`/forms/${formId}/fields/reorder`, data).then(r => r.data);
  },

  // =========================
  // FIELD NUMBERING
  // =========================

  /**
   * Generar siguiente número incremental para un campo
   */
  generateFieldNumber: (
    formId: number,
    fieldId: number,
    params?: {
      companyId?: number;
      assetTypeId?: number;
    }
  ) => {
    return api.post(`/forms/${formId}/fields/${fieldId}/generate-number`, params || {}).then(r => r.data);
  },
};

export default formBuilderService;

