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
  FormControlLabel,
  Switch,
  IconButton,
  Box,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import assetCatalogService from '../../services/assetCatalogService';
import api from '../../config/api';
import ModalHeader from '../common/ModalHeader';
import AssetCategoryForm from './AssetCategoryForm';

interface Group {
  id?: string;
  categoryId: string;
  name: string;
  label?: string; // Label para mostrar (si está vacío, usar name)
  description?: string;
  status?: string;
  isSystem?: boolean;
}

interface AssetGroupFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: Group | null;
  selectedGroups?: Group[];
  isBulkEdit?: boolean;
}

const AssetGroupForm: React.FC<AssetGroupFormProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  selectedGroups = [],
  isBulkEdit = false,
}) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState<Partial<Group>>({
    categoryId: '',
    name: '',
    label: '',
    description: '',
    status: 'ACTIVE',
    isSystem: false,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);

  const loadCategories = () => {
    assetCatalogService.getCategories().then(r => {
      const data = r.data || r;
      setCategories(Array.isArray(data) ? data : []);
    });
  };

  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return; // Solo ejecutar cuando el modal está abierto
    
    if (isBulkEdit && selectedGroups.length > 0) {
      // En modo bulk edit, inicializar con valores vacíos o valores comunes si todos tienen el mismo
      const firstGroup = selectedGroups[0];
      const allSameCategory = selectedGroups.every(g => g.categoryId === firstGroup.categoryId);
      const allSameStatus = selectedGroups.every(g => (g.status || 'ACTIVE') === (firstGroup.status || 'ACTIVE'));
      
      setFormData({
        categoryId: allSameCategory ? (firstGroup.categoryId?.toString() || '') : '',
        name: '', // No se edita en bulk edit
        label: '',
        description: '',
        status: allSameStatus ? (firstGroup.status || 'ACTIVE') : 'ACTIVE',
        isSystem: false, // No se puede cambiar en bulk edit
      });
    } else if (initialData) {
      setFormData({
        categoryId: initialData.categoryId?.toString() || '',
        name: initialData.name || '',
        label: initialData.label || '',
        description: initialData.description || '',
        status: initialData.status || 'ACTIVE',
        isSystem: initialData.isSystem || false,
      });
    } else {
      setFormData({
        categoryId: '',
        name: '',
        label: '',
        description: '',
        status: 'ACTIVE',
        isSystem: false,
      });
    }
    setErrors({});
  }, [open, isBulkEdit, initialData?.id, selectedGroups?.map(g => g.id).join(',')]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!isBulkEdit && !formData.name) newErrors.name = 'Nombre es requerido';
    if (isBulkEdit && formData.categoryId && !formData.categoryId) {
      // Si se especifica una categoría en bulk edit, debe ser válida
      // Pero no es requerida si no se quiere cambiar
    } else if (!isBulkEdit && !formData.categoryId) {
      newErrors.categoryId = 'Categoría es requerida';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);

      if (isBulkEdit && selectedGroups.length > 0) {
        // Modo bulk edit: actualizar todos los grupos seleccionados
        const payload: any = {};
        
        // Solo incluir campos que se quieren actualizar (si tienen valores)
        if (formData.categoryId && formData.categoryId !== '') {
          payload.categoryId = Number(formData.categoryId);
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
        
        // No incluir name ni isSystem en bulk edit
        
        // Si hay campos para actualizar, aplicar a todos los grupos
        if (Object.keys(payload).length > 0) {
          const updatePromises = selectedGroups.map(async (group) => {
            return api.put(`/asset-groups/${group.id}`, payload);
          });
          await Promise.all(updatePromises);
        } else {
          // Si no hay campos para actualizar, mostrar error
          setErrors({ submit: 'Debe especificar al menos un campo para actualizar' });
          setSaving(false);
          return;
        }
      } else {
        // Modo normal: editar un solo grupo o crear uno nuevo
        const payload = {
          categoryId: Number(formData.categoryId),
          name: formData.name,
          label: formData.label || null,
          description: formData.description,
          status: formData.status || 'ACTIVE',
          isSystem: formData.isSystem || false,
        };

        if (initialData?.id) {
          await api.put(`/asset-groups/${initialData.id}`, payload);
        } else {
          await assetCatalogService.createGroup(payload);
        }
      }

      onSave();
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.error || 'Error al guardar grupo(s)' });
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
            ? `Editar ${selectedGroups.length} Grupos` 
            : initialData 
              ? 'Editar Grupo' 
              : 'Crear Grupo'
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

        {isBulkEdit && selectedGroups.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Editando {selectedGroups.length} grupo(s):</strong> {selectedGroups.map(g => g.label || g.name).join(', ')}
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
                  disabled={!!initialData?.isSystem}
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
                disabled={!!initialData?.isSystem}
                sx={{
                  mt: 1.5,
                  color: initialData?.isSystem ? '#ccc' : '#FF6B6B',
                  border: `1px solid ${initialData?.isSystem ? '#ccc' : '#FF6B6B'}`,
                  '&:hover': { 
                    backgroundColor: initialData?.isSystem ? 'transparent' : 'rgba(255, 107, 107, 0.08)',
                    borderColor: initialData?.isSystem ? '#ccc' : '#FF5252',
                  },
                }}
                title={initialData?.isSystem ? "No se puede modificar categoría de grupos del sistema" : "Crear nueva categoría"}
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
                disabled={!!initialData?.isSystem}
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
              disabled={!!initialData?.isSystem}
              sx={fieldStyles}
            />
          </Grid>

          <Grid item xs={12}>
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
              helperText={`Descripción del grupo (${formData.description?.length || 0}/500 caracteres)`}
              multiline
              rows={3}
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

          {!isBulkEdit && (
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isSystem || false}
                    onChange={(e) => handleChange('isSystem', e.target.checked)}
                    disabled={!!initialData?.isSystem}
                  />
                }
                label="Grupo del Sistema"
              />
            </Grid>
          )}
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
    </Dialog>
  );
};

export default AssetGroupForm;


