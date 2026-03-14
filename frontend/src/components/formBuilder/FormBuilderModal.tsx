import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Typography,
} from '@mui/material';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Form, FormField, FieldType, useFormBuilderStore } from '../../stores/formBuilderStore';
import formBuilderService from '../../services/formBuilderService';
import FormBuilderHeader from './FormBuilderHeader';
import FormBuilderSidebar from './FormBuilderSidebar';
import FormBuilderCanvas from './FormBuilderCanvas';

interface FormBuilderModalProps {
  open: boolean;
  onClose: () => void;
  formId?: number;
  onSave?: (form: Form) => void;
}

const FormBuilderModal: React.FC<FormBuilderModalProps> = ({
  open,
  onClose,
  formId,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'styles' | 'recommendations' | 'settings'>('content');
  const [currentForm, setCurrentForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const { setActiveDragId, setDragOverIndex } = useFormBuilderStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Paleta de tipos de campos disponibles (necesario para DragOverlay)
  const fieldTypes = [
    { type: 'TEXT', label: 'Texto', icon: '📝' },
    { type: 'TEXTAREA', label: 'Área de Texto', icon: '📄' },
    { type: 'NUMBER', label: 'Número', icon: '🔢' },
    { type: 'EMAIL', label: 'Email', icon: '📧' },
    { type: 'PHONE', label: 'Teléfono', icon: '📱' },
    { type: 'DATE', label: 'Fecha', icon: '📅' },
    { type: 'DATETIME', label: 'Fecha y Hora', icon: '🕐' },
    { type: 'CHECKBOX', label: 'Checkbox', icon: '☑️' },
    { type: 'RADIO', label: 'Radio', icon: '🔘' },
    { type: 'SELECT', label: 'Select', icon: '📋' },
    { type: 'MULTISELECT', label: 'Multi-Select', icon: '📋' },
    { type: 'FILE', label: 'Archivo', icon: '📎' },
    { type: 'USER_SELECT', label: 'Selector de Usuario', icon: '👤' },
    { type: 'ASSET_SELECT', label: 'Selector de Activo', icon: '💼' },
  ];

  const getActiveFieldType = () => {
    return fieldTypes.find((ft) => ft.type === activeFieldId);
  };

  // Cargar formulario y campos si estamos editando
  useEffect(() => {
    if (open && formId) {
      loadForm();
    } else if (open && !formId) {
      // Nuevo formulario
      setCurrentForm({
        id: 0,
        name: 'Nuevo Formulario',
        description: '',
        moduleType: 'ASSETS',
        status: 'DRAFT',
        isTemplate: false,
        companyId: 0,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Form);
      setFields([]);
    }
  }, [open, formId]);

  const loadForm = async () => {
    if (!formId) return;

    try {
      setLoading(true);
      setError(null);

      // Cargar formulario
      const formResponse = await formBuilderService.getForm(formId);
      if (formResponse.success && formResponse.data) {
        setCurrentForm(formResponse.data);
      }

      // Cargar campos del formulario
      const fieldsResponse = await formBuilderService.listFormFields(formId);
      if (fieldsResponse.success && fieldsResponse.data) {
        setFields(fieldsResponse.data);
      }
    } catch (err: any) {
      console.error('Error loading form:', err);
      setError(err.message || 'Error al cargar formulario');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = useCallback(async () => {
    if (!currentForm) return;

    try {
      setSaving(true);
      setError(null);

      let savedForm: Form;

      // Guardar o actualizar formulario
      if (formId) {
        const response = await formBuilderService.updateForm(formId, currentForm);
        savedForm = response.data || response;
      } else {
        const response = await formBuilderService.createForm(currentForm as any);
        savedForm = response.data || response;
      }

      // Guardar campos (si hay)
      if (savedForm.id && fields.length > 0) {
        // Guardar cada campo
        for (const field of fields) {
          if (field.id) {
            // Actualizar campo existente
            await formBuilderService.updateFormField(savedForm.id, field.id, field);
          } else {
            // Crear nuevo campo
            await formBuilderService.createFormField(savedForm.id, field);
          }
        }
      }

      onSave?.(savedForm);
      onClose();
    } catch (err: any) {
      console.error('Error saving form:', err);
      setError(err.message || 'Error al guardar formulario');
    } finally {
      setSaving(false);
    }
  }, [currentForm, fields, formId, onSave, onClose]);

  const handlePreview = useCallback(() => {
    // TODO: Implementar preview en modal separado
    alert('Vista previa próximamente');
  }, []);

  const handleUpdateForm = useCallback((updates: Partial<Form>) => {
    setCurrentForm(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const handleUpdateFields = useCallback((newFields: FormField[]) => {
    setFields(newFields);
  }, []);

  // --- DRAG AND DROP LOGIC ---

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveFieldId(id);
    setActiveDragId(id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setDragOverIndex(null);
      return;
    }

    // Si estamos sobre el canvas (drop zone)
    if (over.id === 'canvas-drop-zone') {
      // Si no hay campos, el índice es 0
      if (fields.length === 0) {
        setDragOverIndex(0);
        return;
      }
      // Si hay campos, el índice es el final
      setDragOverIndex(fields.length);
      return;
    }

    // Si estamos sobre un campo existente
    const overId = String(over.id);
    const overIndex = fields.findIndex((f) => String(f.id || `temp-${f.fieldKey}`) === overId);

    if (overIndex !== -1) {
      setDragOverIndex(overIndex);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveDragId(null);
    setDragOverIndex(null);
    setActiveFieldId(null);

    if (!over) return;

    // Lógica de inserción
    if (over.id === 'canvas-drop-zone' || fields.some(f => String(f.id || `temp-${f.fieldKey}`) === String(over.id))) {
      // Si es un nuevo campo desde la paleta
      const fieldType = fieldTypes.find((ft) => ft.type === active.id);
      if (fieldType) {
        let insertIndex = fields.length;
        if (over.id !== 'canvas-drop-zone') {
          const overIndex = fields.findIndex((f) => String(f.id || `temp-${f.fieldKey}`) === String(over.id));
          if (overIndex !== -1) insertIndex = overIndex;
        }

        handleAddField(fieldType.type as FieldType, insertIndex);
      } else if (active.id !== over.id) {
        // Reordenamiento
        const oldIndex = fields.findIndex((f) => String(f.id || `temp-${f.fieldKey}`) === String(active.id));
        const newIndex = fields.findIndex((f) => String(f.id || `temp-${f.fieldKey}`) === String(over.id));

        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(fields, oldIndex, newIndex);
          const updated = reordered.map((field, index) => ({
            ...field,
            displayOrder: index + 1,
          }));
          setFields(updated);
        }
      }
    }
  };

  const handleAddField = (fieldType: FieldType, index?: number) => {
    const newField: Partial<FormField> = {
      id: undefined,
      fieldKey: `field_${Date.now()}`,
      fieldLabel: `Nuevo campo ${fieldType.toLowerCase()}`,
      fieldType: fieldType,
      isRequired: false,
      isReadonly: false,
      isHidden: false,
      displayOrder: index !== undefined ? index + 1 : fields.length + 1,
      section: 'general',
      columnPosition: 'FULL',
      autoFill: false,
      autoFillMode: 'MANUAL',
      hasAutoNumbering: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let newFields = [...fields];
    if (index !== undefined && index >= 0 && index <= fields.length) {
      newFields.splice(index, 0, newField as FormField);
    } else {
      newFields.push(newField as FormField);
    }

    // Recalcular orden
    newFields = newFields.map((f, i) => ({ ...f, displayOrder: i + 1 }));
    setFields(newFields);
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: '#f5f8fa',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Header */}
            <FormBuilderHeader
              form={currentForm}
              onSave={handleSave}
              onPreview={handlePreview}
              onClose={onClose}
              saving={saving}
              onUpdateForm={handleUpdateForm}
            />

            {/* Error Alert */}
            {error && (
              <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
                {error}
              </Alert>
            )}

            {/* Body */}
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Sidebar */}
              <FormBuilderSidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                form={currentForm}
                fields={fields}
                onUpdateForm={handleUpdateForm}
                onUpdateFields={handleUpdateFields}
              />

              {/* Canvas */}
              <FormBuilderCanvas
                form={currentForm}
                fields={fields}
                onFieldsChange={handleUpdateFields}
                activeTab={activeTab}
              />
            </Box>

            {/* Overlay para drag */}
            <DragOverlay>
              {activeFieldId ? (
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    cursor: 'grabbing',
                    width: 300,
                    opacity: 0.9,
                    transform: 'rotate(3deg)',
                    zIndex: 9999, // Asegurar que esté por encima de todo
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6">{getActiveFieldType()?.icon}</Typography>
                    <Box>
                      <Typography variant="subtitle1">{getActiveFieldType()?.label}</Typography>
                      <Typography variant="caption" color="text.secondary">Soltar para agregar</Typography>
                    </Box>
                  </Box>
                </Paper>
              ) : null}
            </DragOverlay>
          </>
        )}
      </DndContext>
    </Dialog>
  );
};

export default FormBuilderModal;


