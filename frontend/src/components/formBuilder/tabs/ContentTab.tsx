import React from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Box,
  Typography,
  Button,
  Alert,
  Divider,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Form, FormField } from '../../../stores/formBuilderStore';
import DraggableFieldType from '../DraggableFieldType';
import SortableFieldItem from '../SortableFieldItem';

interface ContentTabProps {
  form: Form | null;
  fields: FormField[];
  onUpdateFields: (fields: FormField[]) => void;
}

const ContentTab: React.FC<ContentTabProps> = ({ form, fields, onUpdateFields }) => {
  // Paleta de tipos de campos disponibles
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

  const handleEditField = (field: FormField) => {
    // La edición se maneja en el canvas ahora, pero dejamos esto por si acaso
    console.log('Edit field:', field);
  };

  const handleDeleteField = (fieldId: number) => {
    if (window.confirm('¿Está seguro de eliminar este campo?')) {
      onUpdateFields(fields.filter((f) => f.id !== fieldId));
    }
  };

  return (
    <Box>
      {/* Botón Agregar Paso (futuro) */}
      <Button
        fullWidth
        variant="outlined"
        startIcon={<AddIcon />}
        sx={{ mb: 3 }}
        disabled
      >
        Agregar otro paso (próximamente)
      </Button>

      {/* Paleta de Campos */}
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        📝 Paleta de Campos
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        Arrastra un campo al canvas para agregarlo
      </Typography>

      <Box sx={{ mb: 3 }}>
        {fieldTypes.map((fieldType) => (
          <DraggableFieldType key={fieldType.type} fieldType={fieldType} />
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Campos Agregados */}
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        📦 Campos Agregados ({fields.length})
      </Typography>

      {fields.length > 0 ? (
        <SortableContext items={fields.map((f) => String(f.id || `temp-${f.fieldKey}`))} strategy={verticalListSortingStrategy}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {fields.map((field, index) => (
              <SortableFieldItem
                key={field.id || index}
                field={field}
                index={index}
                onEdit={() => handleEditField(field)}
                onDelete={() => field.id && handleDeleteField(field.id)}
              />
            ))}
          </Box>
        </SortableContext>
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>
          Arrastra campos desde la paleta o usa el canvas para agregar campos
        </Alert>
      )}
    </Box>
  );
};

export default ContentTab;


