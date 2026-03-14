import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Box,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import assetCatalogService from '../../services/assetCatalogService';
import api from '../../config/api';
import ModalHeader from '../common/ModalHeader';
import AssetGroupForm from './AssetGroupForm';
import AssetCategoryForm from './AssetCategoryForm';

interface AssetType {
  id?: string;
  categoryId?: string;
  groupId: string;
  name: string;
  label?: string; // Label para mostrar (si está vacío, usar name)
  description?: string; // Cambiado de 'code' a 'description'
  status?: string;
}

interface AssetTypeFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: AssetType | null;
  selectedTypes?: AssetType[];
  isBulkEdit?: boolean;
}

const AssetTypeForm: React.FC<AssetTypeFormProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  selectedTypes = [],
  isBulkEdit = false,
}) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [formData, setFormData] = useState<Partial<AssetType>>({
    categoryId: '',
    groupId: '',
    name: '',
    label: '',
    description: '',
    status: 'ACTIVE',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [groupFormOpen, setGroupFormOpen] = useState(false);

  const loadCategories = () => {
    assetCatalogService.getCategories().then(r => {
      const data = r.data || r;
      setCategories(Array.isArray(data) ? data : []);
    });
  };

  const loadGroups = (categoryId?: string) => {
    if (!categoryId) {
      setGroups([]);
      return;
    }
    assetCatalogService.getGroups({ categoryId }).then(r => {
      const data = r.data || r;
      setGroups(Array.isArray(data) ? data : []);
    });
  };

  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  useEffect(() => {
    if (formData.categoryId) {
      loadGroups(formData.categoryId);
    } else {
      setGroups([]);
      setFormData(prev => ({ ...prev, groupId: '' }));
    }
  }, [formData.categoryId]);

  useEffect(() => {
    if (!open) return; // Solo ejecutar cuando el modal está abierto
    
    if (isBulkEdit && selectedTypes.length > 0) {
      // En modo bulk edit, inicializar con valores comunes si todos tienen el mismo
      const firstType = selectedTypes[0];
      const initialCategoryId = (firstType as any).categoryId || 
                                 (firstType as any).category?.id ||
                                 (firstType as any).group?.category?.id ||
                                 (firstType as any).group?.categoryId;
      const initialGroupId = firstType.groupId || '';
      
      const allSameCategory = selectedTypes.every(t => {
        const tCategoryId = (t as any).categoryId || 
                           (t as any).category?.id ||
                           (t as any).group?.category?.id ||
                           (t as any).group?.categoryId;
        return tCategoryId?.toString() === initialCategoryId?.toString();
      });
      const allSameGroup = selectedTypes.every(t => t.groupId?.toString() === initialGroupId?.toString());
      const allSameStatus = selectedTypes.every(t => (t.status || 'ACTIVE') === (firstType.status || 'ACTIVE'));
      
      setFormData({
        categoryId: allSameCategory ? (initialCategoryId?.toString() || '') : '',
        groupId: allSameGroup ? (initialGroupId?.toString() || '') : '',
        name: '', // No se edita en bulk edit
        label: '',
        description: '',
        status: allSameStatus ? (firstType.status || 'ACTIVE') : 'ACTIVE',
      });
      
      if (allSameCategory && initialCategoryId) {
        loadGroups(initialCategoryId.toString());
      }
    } else if (initialData) {
      // Prioridad: usar categoryId directo si existe, sino buscar desde group
      const initialCategoryId = (initialData as any).categoryId || 
                                 (initialData as any).category?.id ||
                                 (initialData as any).group?.category?.id ||
                                 (initialData as any).group?.categoryId;
      const initialGroupId = initialData.groupId || '';
      
      if (initialCategoryId) {
        // Si tenemos categoryId, usarlo directamente y cargar grupos
        setFormData({
          categoryId: initialCategoryId.toString(),
          groupId: initialGroupId.toString(),
          name: initialData.name || '',
          label: initialData.label || '',
          description: initialData.description || (initialData as any).code || '',
          status: initialData.status || 'ACTIVE',
        });
        loadGroups(initialCategoryId.toString());
      } else if (initialGroupId) {
        // Si no hay categoryId pero hay groupId, buscar desde el grupo
        assetCatalogService.getGroups().then(r => {
          const groupsData = r.data || r || [];
          const selectedGroup = Array.isArray(groupsData) 
            ? groupsData.find((g: any) => g.id.toString() === initialGroupId.toString())
            : null;
          
          if (selectedGroup?.categoryId) {
            setFormData({
              categoryId: selectedGroup.categoryId.toString(),
              groupId: initialGroupId.toString(),
              name: initialData.name || '',
              label: initialData.label || '',
              description: initialData.description || (initialData as any).code || '',
              status: initialData.status || 'ACTIVE',
            });
            loadGroups(selectedGroup.categoryId.toString());
          } else {
            setFormData({
              categoryId: '',
              groupId: initialGroupId.toString(),
              name: initialData.name || '',
              label: initialData.label || '',
              description: initialData.description || (initialData as any).code || '',
              status: initialData.status || 'ACTIVE',
            });
          }
        });
      } else {
        setFormData({
          categoryId: '',
          groupId: '',
          name: initialData.name || '',
          label: initialData.label || '',
          description: initialData.description || (initialData as any).code || '',
          status: initialData.status || 'ACTIVE',
        });
      }
    } else {
      setFormData({
        categoryId: '',
        groupId: '',
        name: '',
        label: '',
        description: '',
        status: 'ACTIVE',
      });
    }
    setErrors({});
  }, [open, isBulkEdit, initialData?.id, selectedTypes?.map(t => t.id).join(',')]);

  const handleChange = (field: string, value: any) => {
    // Si se cambia la categoría, limpiar el grupo seleccionado
    if (field === 'categoryId') {
      setFormData(prev => ({ 
        ...prev, 
        [field]: value,
        groupId: '' // Limpiar grupo cuando cambia la categoría
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!isBulkEdit && !formData.name) newErrors.name = 'Nombre es requerido';
    if (!isBulkEdit && !formData.categoryId) newErrors.categoryId = 'Categoría es requerida';
    if (!isBulkEdit && !formData.groupId) newErrors.groupId = 'Grupo es requerido';
    // En bulk edit, no se requiere ningún campo específico, solo que al menos uno tenga valor
    if (isBulkEdit) {
      const hasAnyValue = formData.categoryId || formData.groupId || formData.label || formData.description || formData.status;
      if (!hasAnyValue) {
        newErrors.submit = 'Debe especificar al menos un campo para actualizar';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);

      if (isBulkEdit && selectedTypes.length > 0) {
        // Modo bulk edit: actualizar todos los tipos seleccionados
        const payload: any = {};
        
        // Solo incluir campos que se quieren actualizar (si tienen valores)
        if (formData.categoryId && formData.categoryId !== '') {
          payload.categoryId = Number(formData.categoryId);
        }
        if (formData.groupId && formData.groupId !== '') {
          payload.groupId = Number(formData.groupId);
        }
        if (formData.label !== undefined && formData.label !== '') {
          payload.label = formData.label || null;
        }
        if (formData.description !== undefined && formData.description !== '') {
          payload.description = formData.description || null;
        }
        if (formData.status) {
          payload.status = formData.status;
        }
        
        // No incluir name en bulk edit
        
        // Si hay campos para actualizar, aplicar a todos los tipos
        if (Object.keys(payload).length > 0) {
          const updatePromises = selectedTypes.map(async (type) => {
            return api.put(`/asset-types/${type.id}`, payload);
          });
          await Promise.all(updatePromises);
        } else {
          // Si no hay campos para actualizar, mostrar error
          setErrors({ submit: 'Debe especificar al menos un campo para actualizar' });
          setSaving(false);
          return;
        }
      } else {
        // Modo normal: editar un solo tipo o crear uno nuevo
        const payload = {
          categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
          groupId: formData.groupId ? Number(formData.groupId) : undefined,
          name: formData.name,
          label: formData.label || null,
          description: formData.description || null,
          status: formData.status || 'ACTIVE',
        };

        if (initialData?.id) {
          await api.put(`/asset-types/${initialData.id}`, payload);
        } else {
          await api.post('/asset-types', payload);
        }
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving type:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error al guardar tipo';
      setErrors({ submit: errorMessage });
      // Mostrar alerta también
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      }
    } finally {
      setSaving(false);
    }
  };

  const fieldStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1,
      '&:hover fieldset': { borderColor: '#FF6B6B' },
      '&.Mui-focused fieldset': { borderColor: '#FF6B6B', borderWidth: 2 },
    },
  };

  const formControlStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1,
      '&:hover fieldset': { borderColor: '#FF6B6B' },
      '&.Mui-focused fieldset': { borderColor: '#FF6B6B', borderWidth: 2 },
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1,
          maxHeight: '90vh',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <ModalHeader
        title={
          isBulkEdit 
            ? `Editar ${selectedTypes.length} Tipos` 
            : initialData 
              ? 'Editar Tipo' 
              : 'Crear Tipo'
        }
        onClose={onClose}
        gradientColor="orange"
      />

      <DialogContent dividers sx={{ p: 3 }}>
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.submit}
          </Alert>
        )}

        {isBulkEdit && selectedTypes.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Editando {selectedTypes.length} tipo(s):</strong> {selectedTypes.map(t => t.label || t.name).join(', ')}
            <br />
            <small>El campo "Nombre (Inglés)" no se puede modificar en edición masiva.</small>
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <FormControl fullWidth sx={formControlStyles} error={!!errors.categoryId}>
                <InputLabel>{isBulkEdit ? 'Categoría (opcional)' : 'Categoría *'}</InputLabel>
                <Select
                  label={isBulkEdit ? 'Categoría (opcional)' : 'Categoría *'}
                  value={categories.find((c: any) => c.id.toString() === formData.categoryId?.toString()) ? formData.categoryId?.toString() || '' : ''}
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                >
                  {categories.map((c: any) => (
                    <MenuItem key={c.id} value={c.id.toString()}>{c.label || c.name}</MenuItem>
                  ))}
                </Select>
                {errors.categoryId && (
                  <div style={{ color: 'red', fontSize: '0.75rem', marginTop: '3px' }}>
                    {errors.categoryId}
                  </div>
                )}
              </FormControl>
              <IconButton
                size="small"
                onClick={() => setCategoryFormOpen(true)}
                sx={{
                  mt: 1.5,
                  color: '#FF6B6B',
                  border: '1px solid #FF6B6B',
                  '&:hover': { 
                    backgroundColor: 'rgba(255, 107, 107, 0.08)',
                    borderColor: '#FF5252',
                  },
                }}
                title="Crear nueva categoría"
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <FormControl fullWidth sx={formControlStyles} error={!!errors.groupId} disabled={!formData.categoryId}>
                <InputLabel>{isBulkEdit ? 'Grupo (opcional)' : 'Grupo *'}</InputLabel>
                <Select
                  label={isBulkEdit ? 'Grupo (opcional)' : 'Grupo *'}
                  value={groups.find((g: any) => g.id.toString() === formData.groupId?.toString()) ? formData.groupId?.toString() || '' : ''}
                  onChange={(e) => handleChange('groupId', e.target.value)}
                  disabled={!formData.categoryId}
                >
                  {groups.map((g: any) => (
                    <MenuItem key={g.id} value={g.id.toString()}>{g.label || g.name}</MenuItem>
                  ))}
                </Select>
                {errors.groupId && (
                  <div style={{ color: 'red', fontSize: '0.75rem', marginTop: '3px' }}>
                    {errors.groupId}
                  </div>
                )}
              </FormControl>
              <IconButton
                size="small"
                onClick={() => setGroupFormOpen(true)}
                disabled={!formData.categoryId}
                sx={{
                  mt: 1.5,
                  color: formData.categoryId ? '#FF6B6B' : '#ccc',
                  border: `1px solid ${formData.categoryId ? '#FF6B6B' : '#ccc'}`,
                  '&:hover': { 
                    backgroundColor: formData.categoryId ? 'rgba(255, 107, 107, 0.08)' : 'transparent',
                    borderColor: formData.categoryId ? '#FF5252' : '#ccc',
                  },
                }}
                title={formData.categoryId ? "Crear nuevo grupo" : "Primero seleccione una categoría"}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>

          {!isBulkEdit && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre (Inglés) *"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name || "Nombre técnico en inglés para uso interno"}
                sx={fieldStyles}
              />
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Etiqueta (Español)"
              value={formData.label}
              onChange={(e) => handleChange('label', e.target.value)}
              helperText="Nombre visible para usuarios. Si está vacío, se usará el nombre técnico."
              sx={fieldStyles}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Descripción"
              value={formData.description}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 500) {
                  handleChange('description', value);
                }
              }}
              helperText={`Descripción del tipo de activo (${formData.description?.length || 0}/500 caracteres)`}
              multiline
              rows={2}
              inputProps={{ maxLength: 500 }}
              sx={fieldStyles}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={formControlStyles}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={formData.status || 'ACTIVE'}
                onChange={(e) => handleChange('status', e.target.value)}
                label="Estado"
              >
                <MenuItem value="ACTIVE">Activo</MenuItem>
                <MenuItem value="INACTIVE">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: '#FF6B6B',
            color: '#FF6B6B',
            borderRadius: 1,
            '&:hover': {
              borderColor: '#FF5252',
              backgroundColor: 'rgba(255, 107, 107, 0.04)',
            },
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          sx={{
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)',
            color: 'white',
            px: 4,
            py: 1.5,
            borderRadius: 1,
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(135deg, #FF5252 0%, #FF7043 100%)',
            },
            '&:disabled': {
              background: 'rgba(0, 0, 0, 0.12)',
            },
          }}
        >
          {saving ? 'Guardando...' : isBulkEdit ? 'Modificar' : initialData ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>

      {/* Modal anidado para crear Categoría */}
      <AssetCategoryForm
        open={categoryFormOpen}
        onClose={() => setCategoryFormOpen(false)}
        onSave={() => {
          setCategoryFormOpen(false);
          loadCategories();
        }}
      />

      {/* Modal anidado para crear Grupo */}
      <AssetGroupForm
        open={groupFormOpen}
        onClose={() => setGroupFormOpen(false)}
        initialData={formData.categoryId ? { categoryId: formData.categoryId } as any : null}
        onSave={() => {
          setGroupFormOpen(false);
          if (formData.categoryId) {
            loadGroups(formData.categoryId);
          }
        }}
      />
    </Dialog>
  );
};

export default AssetTypeForm;

