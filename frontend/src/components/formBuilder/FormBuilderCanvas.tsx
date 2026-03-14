import React, { useState } from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Form, FormField } from '../../stores/formBuilderStore';
import { useFormBuilderStore } from '../../stores/formBuilderStore';
import FieldPreview from './FieldPreview';
import SortableFieldItem from './SortableFieldItem';
import DropPlaceholder from './DropPlaceholder';
import QuickEditModal from './QuickEditModal';

interface FormBuilderCanvasProps {
  form: Form | null;
  fields: FormField[];
  onFieldsChange: (fields: FormField[]) => void;
  activeTab: string;
}

const FormBuilderCanvas: React.FC<FormBuilderCanvasProps> = ({
  form,
  fields,
  onFieldsChange,
  activeTab,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
  });

  const { dragOverIndex, activeDragId, updateField } = useFormBuilderStore();
  const [editingField, setEditingField] = useState<FormField | null>(null);

  const handleFieldClick = (field: FormField) => {
    setEditingField(field);
  };

  const handleSaveField = (updatedField: FormField) => {
    if (updatedField.id) {
      updateField(updatedField.id, updatedField);
      // También actualizamos la lista local si es necesario, 
      // aunque el store debería propagar el cambio si fields viene del store
      const newFields = fields.map(f => f.id === updatedField.id ? updatedField : f);
      onFieldsChange(newFields);
    }
    setEditingField(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'content':
        return (
          <Box
            ref={setNodeRef}
            sx={{
              flex: 1,
              minHeight: '100%',
              transition: 'background-color 0.2s',
              bgcolor: isOver && fields.length === 0 ? '#e3f2fd' : 'transparent', // Solo colorear si está vacío
            }}
          >
            <Paper
              elevation={2}
              sx={{
                maxWidth: 800,
                mx: 'auto',
                bgcolor: 'white',
                borderRadius: 2,
                p: 4,
                minHeight: 400,
                position: 'relative',
              }}
            >
              <Typography variant="h5" sx={{ mb: 1 }}>
                {form?.name || 'Nuevo Formulario'}
              </Typography>

              {form?.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {form.description}
                </Typography>
              )}

              <SortableContext
                items={fields.map(f => f.id || `temp-${f.fieldKey}`)}
                strategy={verticalListSortingStrategy}
              >
                {fields.length > 0 ? (
                  <Grid container spacing={2}>
                    {fields.map((field, index) => {
                      // Calcular el ancho del grid basado en columnPosition
                      let gridSize = 12; // Por defecto FULL

                      if (field.columnPosition === 'LEFT' || field.columnPosition === 'RIGHT') {
                        gridSize = 6;
                      }

                      return (
                        <React.Fragment key={field.id || index}>
                          {/* Placeholder antes del item si corresponde */}
                          {activeDragId && dragOverIndex === index && (
                            <Grid item xs={12}>
                              <DropPlaceholder isVisible={true} />
                            </Grid>
                          )}

                          <Grid
                            item
                            xs={12}
                            md={gridSize}
                          >
                            <SortableFieldItem
                              field={field}
                              onDelete={(id) => {
                                const newFields = fields.filter(f => f.id !== id);
                                onFieldsChange(newFields);
                              }}
                              onEdit={() => handleFieldClick(field)}
                            />
                          </Grid>
                        </React.Fragment>
                      );
                    })}

                    {/* Placeholder al final si corresponde */}
                    {activeDragId && dragOverIndex === fields.length && (
                      <Grid item xs={12}>
                        <DropPlaceholder isVisible={true} />
                      </Grid>
                    )}
                  </Grid>
                ) : (
                  <>
                    {activeDragId ? (
                      <DropPlaceholder isVisible={true} height={200} />
                    ) : (
                      <Box
                        sx={{
                          border: 2,
                          borderStyle: 'dashed',
                          borderColor: isOver ? 'primary.main' : 'grey.300',
                          borderRadius: 2,
                          p: 6,
                          textAlign: 'center',
                          bgcolor: isOver ? 'primary.50' : 'grey.50',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Typography variant="h6" color="text.secondary">
                          {isOver ? '⬇️ Suelta el campo aquí' : '📝 Arrastra campos desde la barra lateral'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          o haz clic en "Agregar"
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </SortableContext>
            </Paper>

            {/* Modal de Edición Rápida */}
            <QuickEditModal
              open={!!editingField}
              field={editingField}
              allFields={fields}
              onClose={() => setEditingField(null)}
              onSave={handleSaveField}
            />
          </Box>
        );
      case 'styles':
        return <Box sx={{ p: 3 }}>Configuración de estilos (Próximamente)</Box>;
      case 'settings':
        return <Box sx={{ p: 3 }}>Configuración general (Próximamente)</Box>;
      case 'recommendations':
        return <Box sx={{ p: 3 }}>Recomendaciones de IA (Próximamente)</Box>;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ flex: 1, bgcolor: '#f5f5f5', p: 3, overflow: 'auto' }}>
      {renderContent()}
    </Box>
  );
};

export default FormBuilderCanvas;
