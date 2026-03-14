import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { FormField, Form } from '../../stores/formBuilderStore';
import formBuilderService from '../../services/formBuilderService';
import FieldEditor from './FieldEditor';

interface FormFieldsManagerProps {
  open: boolean;
  onClose: () => void;
  form: Form | null;
}

const FormFieldsManager: React.FC<FormFieldsManagerProps> = ({
  open,
  onClose,
  form,
}) => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldEditorOpen, setFieldEditorOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (open && form?.id) {
      loadFields();
    }
  }, [open, form]);

  const loadFields = async () => {
    if (!form?.id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await formBuilderService.listFormFields(form.id);
      
      if (response.success) {
        setFields(response.data || []);
      } else {
        setError('Error al cargar campos');
      }
    } catch (error: any) {
      console.error('Error loading fields:', error);
      setError(error.response?.data?.error || error.message || 'Error al cargar campos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateField = () => {
    setSelectedField(null);
    setIsEditMode(false);
    setFieldEditorOpen(true);
  };

  const handleEditField = (field: FormField) => {
    setSelectedField(field);
    setIsEditMode(true);
    setFieldEditorOpen(true);
  };

  const handleDeleteField = async (fieldId: number) => {
    if (!form?.id) return;
    if (!window.confirm('¿Está seguro de eliminar este campo?')) {
      return;
    }

    try {
      setLoading(true);
      await formBuilderService.deleteFormField(form.id, fieldId);
      setMessage({ type: 'success', text: 'Campo eliminado correctamente' });
      loadFields();
    } catch (error: any) {
      console.error('Error deleting field:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || error.message || 'Error al eliminar campo',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldSave = () => {
    setFieldEditorOpen(false);
    setSelectedField(null);
    setIsEditMode(false);
    loadFields();
    setMessage({ type: 'success', text: 'Campo guardado correctamente' });
  };

  const getFieldTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      TEXT: 'Texto',
      TEXTAREA: 'Área de texto',
      NUMBER: 'Número',
      EMAIL: 'Email',
      PHONE: 'Teléfono',
      DATE: 'Fecha',
      DATETIME: 'Fecha y hora',
      CHECKBOX: 'Casilla',
      RADIO: 'Radio',
      SELECT: 'Selección',
      MULTISELECT: 'Múltiple',
      FILE: 'Archivo',
      USER_SELECT: 'Usuario',
      COMPANY_SELECT: 'Empresa',
      LOCATION_SELECT: 'Ubicación',
      DEPARTMENT_SELECT: 'Departamento',
      ASSET_SELECT: 'Activo',
      PROCESS_SELECT: 'Proceso',
      JOB_TITLE_SELECT: 'Cargo',
    };
    return labels[type] || type;
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Campos del Formulario: {form?.name}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateField}
              size="small"
            >
              Nuevo Campo
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {message && (
            <Alert
              severity={message.type}
              onClose={() => setMessage(null)}
              sx={{ mb: 2 }}
            >
              {message.text}
            </Alert>
          )}

          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : fields.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No hay campos en este formulario. Crea el primer campo.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="50">Orden</TableCell>
                    <TableCell>Clave</TableCell>
                    <TableCell>Etiqueta</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Sección</TableCell>
                    <TableCell>Opciones</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fields.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <DragIcon fontSize="small" color="action" />
                        {field.displayOrder}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {field.fieldKey}
                        </Typography>
                      </TableCell>
                      <TableCell>{field.fieldLabel}</TableCell>
                      <TableCell>
                        <Chip label={getFieldTypeLabel(field.fieldType)} size="small" />
                      </TableCell>
                      <TableCell>{field.section || '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {field.isRequired && (
                            <Chip label="Requerido" size="small" color="error" />
                          )}
                          {field.isReadonly && (
                            <Chip label="Solo lectura" size="small" color="warning" />
                          )}
                          {field.isHidden && (
                            <Chip label="Oculto" size="small" color="default" />
                          )}
                          {field.hasAutoNumbering && (
                            <Chip label="Numeración" size="small" color="primary" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleEditField(field)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => field.id && handleDeleteField(field.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {form?.id && (
        <FieldEditor
          open={fieldEditorOpen}
          onClose={() => {
            setFieldEditorOpen(false);
            setSelectedField(null);
            setIsEditMode(false);
          }}
          onSave={handleFieldSave}
          formId={form.id}
          initialData={selectedField || undefined}
          isEditMode={isEditMode}
        />
      )}
    </>
  );
};

export default FormFieldsManager;

