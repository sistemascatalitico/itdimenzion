import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  ContentCopy as CloneIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useFormBuilderStore, Form, FormModuleType, FormStatus } from '../../stores/formBuilderStore';
import formBuilderService from '../../services/formBuilderService';
import FormEditor from './FormEditor';
import FormFieldsManager from './FormFieldsManager';
import FormBuilderModal from './FormBuilderModal';

interface FormListProps {
  onNavigate?: (path: string) => void;
}

const FormList: React.FC<FormListProps> = ({ onNavigate }) => {
  const {
    forms,
    isLoading,
    error,
    searchTerm,
    currentPage,
    itemsPerPage,
    totalItems,
    filters,
    setForms,
    setLoading,
    setError,
    setSearchTerm,
    setCurrentPage,
    setTotalItems,
    setFilters,
    deleteForm,
    clearError,
  } = useFormBuilderStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fieldsManagerOpen, setFieldsManagerOpen] = useState(false);
  const [formForFields, setFormForFields] = useState<Form | null>(null);
  const [advancedModalOpen, setAdvancedModalOpen] = useState(false);
  const [formForAdvancedEditor, setFormForAdvancedEditor] = useState<number | undefined>(undefined);

  const loadForms = useCallback(async () => {
    try {
      setLoading(true);
      clearError();

      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
        ...filters,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await formBuilderService.listForms(params);

      if (response.success) {
        setForms(response.data || []);
        setTotalItems(response.pagination?.total || 0);
      } else {
        setError('Error al cargar formularios');
        setForms([]);
      }
    } catch (error: any) {
      console.error('Error loading forms:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error al cargar formularios';
      setError(errorMessage);
      setForms([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, filters, setLoading, setForms, setTotalItems, setError, clearError]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const handleCreate = () => {
    setSelectedForm(null);
    setIsEditMode(false);
    setModalOpen(true);
  };

  const handleCreateAdvanced = () => {
    setFormForAdvancedEditor(undefined);
    setAdvancedModalOpen(true);
  };

  const handleCloseAdvancedModal = () => {
    setAdvancedModalOpen(false);
    setFormForAdvancedEditor(undefined);
    loadForms(); // Reload forms after closing
  };

  const handleEdit = (form: Form) => {
    setSelectedForm(form);
    setIsEditMode(true);
    setModalOpen(true);
  };

  const handleEditAdvanced = (form: Form) => {
    setFormForAdvancedEditor(form.id);
    setAdvancedModalOpen(true);
  };



  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este formulario?')) {
      return;
    }

    try {
      setLoading(true);
      await formBuilderService.deleteForm(id);
      deleteForm(id);
      setMessage({ type: 'success', text: 'Formulario eliminado correctamente' });
      loadForms();
    } catch (error: any) {
      console.error('Error deleting form:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || error.message || 'Error al eliminar formulario',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async (form: Form) => {
    if (!form.id) return;

    try {
      setLoading(true);
      const response = await formBuilderService.cloneForm(form.id, {
        name: `${form.name} (Copia)`,
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Formulario clonado correctamente' });
        loadForms();
      }
    } catch (error: any) {
      console.error('Error cloning form:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || error.message || 'Error al clonar formulario',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedForm(null);
    setIsEditMode(false);
  };

  const handleSave = () => {
    handleCloseModal();
    loadForms();
    setMessage({ type: 'success', text: 'Formulario guardado correctamente' });
  };

  const getStatusColor = (status: FormStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'DRAFT':
        return 'warning';
      case 'ARCHIVED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getModuleTypeLabel = (moduleType: FormModuleType) => {
    const labels: Record<FormModuleType, string> = {
      ASSETS: 'Activos',
      TICKETS: 'Tickets',
      CRM: 'CRM',
      HR: 'Recursos Humanos',
      SALES: 'Ventas',
      CUSTOM: 'Personalizado',
    };
    return labels[moduleType] || moduleType;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Form Builder
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateAdvanced}
          >
            Nuevo Formulario (Editor Avanzado)
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Nuevo Formulario (Clásico)
          </Button>
          <IconButton onClick={loadForms} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

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
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o descripción..."
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Módulo</InputLabel>
                <Select
                  value={filters.moduleType || ''}
                  onChange={(e) => setFilters({ moduleType: e.target.value as FormModuleType || undefined })}
                  label="Módulo"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="ASSETS">Activos</MenuItem>
                  <MenuItem value="TICKETS">Tickets</MenuItem>
                  <MenuItem value="CRM">CRM</MenuItem>
                  <MenuItem value="HR">Recursos Humanos</MenuItem>
                  <MenuItem value="SALES">Ventas</MenuItem>
                  <MenuItem value="CUSTOM">Personalizado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filters.status || ''}
                  onChange={(e) => setFilters({ status: e.target.value as FormStatus || undefined })}
                  label="Estado"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="ACTIVE">Activo</MenuItem>
                  <MenuItem value="DRAFT">Borrador</MenuItem>
                  <MenuItem value="ARCHIVED">Archivado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Plantilla</InputLabel>
                <Select
                  value={filters.isTemplate === undefined ? '' : filters.isTemplate ? 'true' : 'false'}
                  onChange={(e) => setFilters({ isTemplate: e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined })}
                  label="Plantilla"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Sí</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Módulo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Plantilla</TableCell>
              <TableCell>Versión</TableCell>
              <TableCell>Campos</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : forms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No hay formularios disponibles
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              forms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell>{form.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {form.name}
                    </Typography>
                    {form.description && (
                      <Typography variant="caption" color="text.secondary">
                        {form.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{getModuleTypeLabel(form.moduleType)}</TableCell>
                  <TableCell>
                    <Chip
                      label={form.status}
                      color={getStatusColor(form.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={form.isTemplate ? 'Sí' : 'No'}
                      color={form.isTemplate ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>v{form.version}</TableCell>
                  <TableCell>{form._count?.fields || 0}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Editar (Editor Avanzado)">
                        <IconButton size="small" color="primary" onClick={() => handleEditAdvanced(form)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar (Clásico)">
                        <IconButton size="small" onClick={() => handleEdit(form)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Gestionar Campos">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setFormForFields(form);
                            setFieldsManagerOpen(true);
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Clonar">
                        <IconButton size="small" onClick={() => handleClone(form)}>
                          <CloneIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => form.id && handleDelete(form.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Mostrando {forms.length} de {totalItems} formularios
        </Typography>
        <Box>
          <Button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Anterior
          </Button>
          <Button
            disabled={currentPage * itemsPerPage >= totalItems}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Siguiente
          </Button>
        </Box>
      </Box>

      {/* Modal de edición */}
      <FormEditor
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        initialData={selectedForm || undefined}
        isEditMode={isEditMode}
      />

      {/* Modal de gestión de campos */}
      <FormFieldsManager
        open={fieldsManagerOpen}
        onClose={() => {
          setFieldsManagerOpen(false);
          setFormForFields(null);
        }}
        form={formForFields}
      />

      {/* Modal del editor avanzado (fullscreen) */}
      <FormBuilderModal
        open={advancedModalOpen}
        onClose={() => {
          setAdvancedModalOpen(false);
          setFormForAdvancedEditor(undefined);
        }}
        formId={formForAdvancedEditor}
        onSave={(savedForm) => {
          setMessage({ type: 'success', text: 'Formulario guardado correctamente' });
          loadForms();
        }}
      />
    </Box>
  );
};

export default FormList;

