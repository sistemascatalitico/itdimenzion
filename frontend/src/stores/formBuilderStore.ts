import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// =========================
// TYPES
// =========================

export type FormModuleType = 'ASSETS' | 'TICKETS' | 'CRM' | 'HR' | 'SALES' | 'CUSTOM';
export type FormStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
export type FieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'NUMBER'
  | 'EMAIL'
  | 'PHONE'
  | 'DATE'
  | 'DATETIME'
  | 'CHECKBOX'
  | 'RADIO'
  | 'SELECT'
  | 'MULTISELECT'
  | 'FILE'
  | 'USER_SELECT'
  | 'COMPANY_SELECT'
  | 'LOCATION_SELECT'
  | 'DEPARTMENT_SELECT'
  | 'ASSET_SELECT'
  | 'PROCESS_SELECT'
  | 'JOB_TITLE_SELECT';
export type AutoFillMode = 'AUTO' | 'MANUAL' | 'AUTO_WITH_OVERRIDE';
export type ColumnPosition = 'FULL' | 'LEFT' | 'RIGHT';

export interface NumberingConfig {
  prefix?: string;
  suffix?: string;
  startNumber?: number;
  minLength?: number;
  resetFrequency?: 'YEARLY' | 'MONTHLY' | 'NEVER';
  scope?: 'GLOBAL' | 'ASSET_TYPE' | 'COMPANY';
}

export interface FormField {
  id?: number;
  formId: number;
  fieldKey: string;
  fieldLabel: string;
  fieldType: FieldType;
  isRequired: boolean;
  isReadonly: boolean;
  isHidden: boolean;
  defaultValue?: string | null;
  placeholder?: string | null;
  helpText?: string | null;
  options?: any; // JSON
  validationRules?: any; // JSON
  autoFill?: string | null;
  autoFillSource?: string | null;
  autoFillMode?: AutoFillMode | null;
  hasAutoNumbering: boolean;
  numberingConfig?: NumberingConfig | null;
  section?: string | null;
  displayOrder: number;
  columnPosition: ColumnPosition;
  conditionalLogic?: any; // JSON
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface Form {
  id?: number;
  name: string;
  description?: string | null;
  moduleType: FormModuleType;
  companyId: number;
  assetTypeId?: number | null;
  assetCategoryId?: number | null;
  assetGroupId?: number | null;
  isTemplate: boolean;
  status: FormStatus;
  version: number;
  clonedFrom?: number | null;
  usageCount: number;
  stepsConfig?: any; // JSON (FASE 6)
  stylesConfig?: any; // JSON (FASE 6)
  submissionConfig?: any; // JSON (FASE 6)
  securityConfig?: any; // JSON (FASE 6)
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
  // Relations
  company?: { id: number; name: string };
  creator?: { documentNumber: string; username: string; email: string };
  assetType?: { id: number; name: string; label: string };
  fields?: FormField[];
  _count?: {
    fields: number;
    submissions: number;
  };
}

interface FormBuilderState {
  // Estado
  forms: Form[];
  currentForm: Form | null;
  currentFields: FormField[];
  isLoading: boolean;
  error: string | null;

  // Filtros y paginación
  searchTerm: string;
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  filters: {
    companyId?: number;
    moduleType?: FormModuleType;
    status?: FormStatus;
    isTemplate?: boolean;
    assetTypeId?: number;
  };

  // Estado de Drag & Drop (UI)
  activeDragId: string | null; // ID del campo o tipo que se está arrastrando
  dragOverIndex: number | null; // Índice donde se soltará el campo

  // Acciones de estado
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchTerm: (term: string) => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  setTotalItems: (total: number) => void;
  setFilters: (filters: Partial<FormBuilderState['filters']>) => void;

  // Acciones de Drag & Drop
  setActiveDragId: (id: string | null) => void;
  setDragOverIndex: (index: number | null) => void;

  // Acciones de formularios
  setForms: (forms: Form[]) => void;
  addForm: (form: Form) => void;
  updateForm: (id: number, form: Partial<Form>) => void;
  deleteForm: (id: number) => void;
  setCurrentForm: (form: Form | null) => void;
  clearCurrentForm: () => void;

  // Acciones de campos
  setCurrentFields: (fields: FormField[]) => void;
  addField: (field: FormField) => void;
  updateField: (id: number, field: Partial<FormField>) => void;
  deleteField: (id: number) => void;
  reorderFields: (fieldOrders: { id: number; displayOrder: number }[]) => void;

  // Acciones de filtrado
  filterForms: () => Form[];

  // Acciones de reset
  resetFilters: () => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  forms: [],
  currentForm: null,
  currentFields: [],
  isLoading: false,
  error: null,
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: 50,
  totalItems: 0,
  filters: {},
  activeDragId: null,
  dragOverIndex: null,
};

export const useFormBuilderStore = create<FormBuilderState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Acciones de estado
      // Acciones de estado
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      setSearchTerm: (term: string) => set({ searchTerm: term, currentPage: 1 }),
      setCurrentPage: (page: number) => set({ currentPage: page }),
      setItemsPerPage: (items: number) => set({ itemsPerPage: items }),
      setTotalItems: (total: number) => set({ totalItems: total }),
      setFilters: (filters: Partial<FormBuilderState['filters']>) => set((state) => ({ filters: { ...state.filters, ...filters } })),

      // Acciones de Drag & Drop
      setActiveDragId: (id: string | null) => set({ activeDragId: id }),
      setDragOverIndex: (index: number | null) => set({ dragOverIndex: index }),

      // Acciones de formularios
      setForms: (forms: Form[]) => set({ forms }),
      addForm: (form: Form) => set((state) => ({
        forms: [...state.forms, form],
        totalItems: state.totalItems + 1
      })),
      updateForm: (id: number, form: Partial<Form>) => set((state) => ({
        forms: state.forms.map(f => f.id === id ? { ...f, ...form } : f),
        currentForm: state.currentForm?.id === id ? { ...state.currentForm, ...form } : state.currentForm,
      })),
      deleteForm: (id: number) => set((state) => ({
        forms: state.forms.filter(f => f.id !== id),
        totalItems: state.totalItems - 1,
        currentForm: state.currentForm?.id === id ? null : state.currentForm,
      })),
      setCurrentForm: (form: Form | null) => set({
        currentForm: form,
        currentFields: form?.fields || [],
      }),
      clearCurrentForm: () => set({ currentForm: null, currentFields: [] }),

      // Acciones de campos
      setCurrentFields: (fields: FormField[]) => set({ currentFields: fields }),
      addField: (field: FormField) => set((state) => ({
        currentFields: [...state.currentFields, field],
        currentForm: state.currentForm ? {
          ...state.currentForm,
          fields: [...(state.currentForm.fields || []), field],
        } : state.currentForm,
      })),
      updateField: (id: number, field: Partial<FormField>) => set((state) => ({
        currentFields: state.currentFields.map(f => f.id === id ? { ...f, ...field } : f),
        currentForm: state.currentForm ? {
          ...state.currentForm,
          fields: (state.currentForm.fields || []).map(f => f.id === id ? { ...f, ...field } : f),
        } : state.currentForm,
      })),
      deleteField: (id: number) => set((state) => ({
        currentFields: state.currentFields.filter(f => f.id !== id),
        currentForm: state.currentForm ? {
          ...state.currentForm,
          fields: (state.currentForm.fields || []).filter(f => f.id !== id),
        } : state.currentForm,
      })),
      reorderFields: (fieldOrders: { id: number; displayOrder: number }[]) => {
        const { currentFields } = get();
        const reordered = fieldOrders.map(({ id, displayOrder }) => {
          const field = currentFields.find(f => f.id === id);
          return field ? { ...field, displayOrder } : null;
        }).filter(Boolean) as FormField[];

        set({ currentFields: reordered });
      },

      // Acciones de filtrado
      filterForms: () => {
        const { forms, searchTerm, filters } = get();
        let filtered = forms;

        // Aplicar filtros
        if (filters.companyId) {
          filtered = filtered.filter(f => f.companyId === filters.companyId);
        }
        if (filters.moduleType) {
          filtered = filtered.filter(f => f.moduleType === filters.moduleType);
        }
        if (filters.status) {
          filtered = filtered.filter(f => f.status === filters.status);
        }
        if (filters.isTemplate !== undefined) {
          filtered = filtered.filter(f => f.isTemplate === filters.isTemplate);
        }
        if (filters.assetTypeId) {
          filtered = filtered.filter(f => f.assetTypeId === filters.assetTypeId);
        }

        // Aplicar búsqueda
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filtered = filtered.filter(form =>
            form.name.toLowerCase().includes(term) ||
            (form.description && form.description.toLowerCase().includes(term))
          );
        }

        return filtered;
      },

      // Acciones de reset
      resetFilters: () => set({
        searchTerm: '',
        currentPage: 1,
        filters: {},
      }),
      clearError: () => set({ error: null }),
      reset: () => set(initialState),
    }),
    {
      name: 'form-builder-store',
    }
  )
);

