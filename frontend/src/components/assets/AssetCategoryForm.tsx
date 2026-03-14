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
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import assetCatalogService from '../../services/assetCatalogService';
import api from '../../config/api';
import ModalHeader from '../common/ModalHeader';

interface Category {
  id?: string;
  name: string;
  label?: string;
  description?: string;
  status?: string;
  isPersistent?: boolean;
}

interface AssetCategoryFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: Category | null;
}

const AssetCategoryForm: React.FC<AssetCategoryFormProps> = ({
  open,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    label: '',
    description: '',
    status: 'ACTIVE',
    isPersistent: false,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        label: initialData.label || initialData.name || '',
        description: initialData.description || '',
        status: initialData.status || 'ACTIVE',
        isPersistent: initialData.isPersistent || false,
      });
    } else {
      setFormData({
        name: '',
        label: '',
        description: '',
        status: 'ACTIVE',
        isPersistent: false,
      });
    }
    setErrors({});
  }, [initialData, open]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'name' && !initialData) {
      // Auto-generar label desde name si no hay initialData
      setFormData(prev => ({ ...prev, label: value.toLowerCase().replace(/\s+/g, '_') }));
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Nombre es requerido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);

      const payload = {
        name: formData.name,
        label: formData.label || formData.name?.toLowerCase().replace(/\s+/g, '_'),
        description: formData.description,
        status: formData.status || 'ACTIVE',
        isPersistent: formData.isPersistent || false,
      };

      if (initialData?.id) {
        await api.put(`/asset-categories/${initialData.id}`, payload);
      } else {
        await assetCatalogService.createCategory(payload);
      }

      onSave();
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.error || 'Error al guardar categoría' });
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
        title={initialData ? 'Editar Categoría' : 'Crear Categoría'}
        onClose={onClose}
        gradientColor="orange"
      />

      <DialogContent dividers sx={{ p: 3 }}>
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.submit}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre *"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              sx={fieldStyles}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Etiqueta"
              value={formData.label}
              onChange={(e) => handleChange('label', e.target.value)}
              helperText="Identificador único (se genera automáticamente desde el nombre)"
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
              helperText={`Descripción de la categoría (${formData.description?.length || 0}/500 caracteres)`}
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

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPersistent || false}
                  onChange={(e) => handleChange('isPersistent', e.target.checked)}
                />
              }
              label="Persistente"
            />
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
          {saving ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssetCategoryForm;


