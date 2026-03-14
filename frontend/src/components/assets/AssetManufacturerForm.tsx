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
  Chip,
  Box,
  OutlinedInput,
  Alert,
  Avatar,
  Tabs,
  Tab,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Image as ImageIcon,
  Link as LinkIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import assetCatalogService from '../../services/assetCatalogService';
import api from '../../config/api';
import ModalHeader from '../common/ModalHeader';
import AssetCategoryForm from './AssetCategoryForm';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

interface Manufacturer {
  id?: string;
  name: string;
  description?: string;
  website?: string;
  logo?: string; // URL o base64 del logo
  status?: string;
  categoryIds?: number[];
  categories?: any[];
}

interface AssetManufacturerFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: Manufacturer | null;
  selectedManufacturers?: Manufacturer[];
  isBulkEdit?: boolean;
}

const AssetManufacturerForm: React.FC<AssetManufacturerFormProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  selectedManufacturers,
  isBulkEdit = false,
}) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState<Partial<Manufacturer>>({
    name: '',
    description: '',
    website: '',
    logo: '',
    status: 'ACTIVE',
    categoryIds: [],
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoTab, setLogoTab] = useState(0); // 0: URL, 1: Upload
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
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
    
    if (isBulkEdit && selectedManufacturers && selectedManufacturers.length > 0) {
      // En modo bulk edit, inicializar con valores comunes si todos tienen el mismo
      const firstManufacturer = selectedManufacturers[0];
      const allSameStatus = selectedManufacturers.every(m => (m.status || 'ACTIVE') === (firstManufacturer.status || 'ACTIVE'));
      
      // En bulk edit no se puede editar logo
      setFormData({
        name: '', // No se edita en bulk edit
        description: '',
        website: '',
        logo: '',
        status: allSameStatus ? (firstManufacturer.status || 'ACTIVE') : 'ACTIVE',
        categoryIds: [],
      });
      setLogoPreview('');
      setLogoFile(null);
      setLogoTab(0);
    } else if (initialData) {
      // Si tenemos categorías en initialData, extraer los IDs
      const categoryIds = initialData.categories 
        ? initialData.categories.map((c: any) => typeof c === 'object' ? c.id : c)
        : initialData.categoryIds || [];
      
      const logo = initialData.logo || '';
      
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        website: initialData.website || '',
        logo: logo,
        status: initialData.status || 'ACTIVE',
        categoryIds: Array.isArray(categoryIds) ? categoryIds.map(id => Number(id)) : [],
      });
      
      // Si hay logo, mostrar preview
      if (logo) {
        if (logo.startsWith('data:') || logo.startsWith('http://') || logo.startsWith('https://')) {
          setLogoPreview(logo);
          setLogoTab(logo.startsWith('data:') ? 1 : 0);
        } else {
          setLogoPreview('');
        }
      } else {
        setLogoPreview('');
      }
      setLogoFile(null);
    } else {
      setFormData({
        name: '',
        description: '',
        website: '',
        logo: '',
        status: 'ACTIVE',
        categoryIds: [],
      });
      setLogoPreview('');
      setLogoFile(null);
      setLogoTab(0);
    }
    setErrors({});
  }, [open, isBulkEdit, initialData?.id, selectedManufacturers?.map(m => m.id).join(',')]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, logo: 'Formato no válido. Use PNG, JPEG o SVG' }));
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, logo: 'El archivo es muy grande. Máximo 2MB' }));
      return;
    }

    setLogoFile(file);
    setErrors(prev => ({ ...prev, logo: '' }));

    // Convertir a base64 para preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setLogoPreview(base64String);
      setFormData(prev => ({ ...prev, logo: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUrlChange = (url: string) => {
    setLogoFile(null);
    setFormData(prev => ({ ...prev, logo: url }));
    setLogoPreview(url);
    if (url && !/^https?:\/\/.+/.test(url)) {
      setErrors(prev => ({ ...prev, logo: 'URL inválida' }));
    } else {
      setErrors(prev => ({ ...prev, logo: '' }));
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setFormData(prev => ({ ...prev, logo: '' }));
    setErrors(prev => ({ ...prev, logo: '' }));
  };

  const handleLogoTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setLogoTab(newValue);
    // Si cambia de pestaña, limpiar el método anterior
    if (newValue === 0) {
      // Cambió a URL, limpiar archivo
      setLogoFile(null);
      if (formData.logo?.startsWith('data:')) {
        setFormData(prev => ({ ...prev, logo: '' }));
        setLogoPreview('');
      }
    } else {
      // Cambió a Upload, limpiar URL
      if (formData.logo?.startsWith('http')) {
        setFormData(prev => ({ ...prev, logo: '' }));
        setLogoPreview('');
      }
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!isBulkEdit && !formData.name) newErrors.name = 'Nombre es requerido';
    if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website)) {
      newErrors.website = 'URL inválida (debe empezar con http:// o https://)';
    }
    if (!isBulkEdit && formData.logo && logoTab === 1 && !formData.logo.startsWith('data:')) {
      newErrors.logo = 'Debe seleccionar un archivo de imagen';
    }
    if (!isBulkEdit && formData.logo && logoTab === 0 && !/^https?:\/\/.+/.test(formData.logo)) {
      newErrors.logo = 'URL inválida';
    }
    // En bulk edit, debe especificar al menos un campo para actualizar
    if (isBulkEdit) {
      const hasAnyValue = formData.description || formData.website || formData.status || (formData.categoryIds && formData.categoryIds.length > 0);
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

      if (isBulkEdit && selectedManufacturers && selectedManufacturers.length > 0) {
        // Modo bulk edit: actualizar todos los fabricantes seleccionados
        const payload: any = {};
        
        // Solo incluir campos que se quieren actualizar (si tienen valores)
        if (formData.description) payload.description = formData.description;
        if (formData.website) payload.website = formData.website;
        if (formData.status) payload.status = formData.status;
        if (formData.categoryIds && formData.categoryIds.length > 0) {
          payload.categoryIds = formData.categoryIds;
        }

        // Actualizar cada fabricante
        await Promise.all(
          selectedManufacturers.map(m => api.put(`/asset-manufacturers/${m.id}`, payload))
        );
      } else {
        const payload = {
          name: formData.name,
          description: formData.description,
          website: formData.website,
          logo: formData.logo || null,
          status: formData.status || 'ACTIVE',
          categoryIds: formData.categoryIds || [],
        };

        if (initialData?.id) {
          await api.put(`/asset-manufacturers/${initialData.id}`, payload);
        } else {
          await assetCatalogService.createManufacturer(payload);
        }
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving manufacturer:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error al guardar fabricante';
      setErrors({ submit: errorMessage });
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
            ? `Editar ${selectedManufacturers?.length || 0} Fabricantes` 
            : initialData 
              ? 'Editar Fabricante' 
              : 'Crear Fabricante'
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

        {isBulkEdit && selectedManufacturers && selectedManufacturers.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Editando {selectedManufacturers.length} fabricante(s):</strong> {selectedManufacturers.map(m => m.name).join(', ')}
            <br />
            <small>Los campos "Nombre" y "Logo" no se pueden modificar en edición masiva.</small>
          </Alert>
        )}

        <Grid container spacing={3}>
          {!isBulkEdit && (
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
          )}

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={isBulkEdit ? "Website (opcional)" : "Website"}
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              error={!!errors.website}
              helperText={errors.website || 'Ej: https://www.example.com'}
              sx={fieldStyles}
            />
          </Grid>

          {!isBulkEdit && (
            <Grid item xs={12}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Logo del Fabricante
                </Typography>
              <Tabs value={logoTab} onChange={handleLogoTabChange} sx={{ mb: 2, minHeight: 40 }}>
                <Tab icon={<LinkIcon />} iconPosition="start" label="URL" />
                <Tab icon={<ImageIcon />} iconPosition="start" label="Subir Imagen" />
              </Tabs>
              
              {logoTab === 0 ? (
                <Box>
                  <TextField
                    fullWidth
                    label="URL del Logo"
                    placeholder="https://ejemplo.com/logo.png"
                    value={formData.logo?.startsWith('http') ? formData.logo : ''}
                    onChange={(e) => handleLogoUrlChange(e.target.value)}
                    error={!!errors.logo}
                    helperText={errors.logo || 'Ingrese la URL completa del logo (PNG, SVG, JPEG)'}
                    sx={fieldStyles}
                  />
                  {logoPreview && logoPreview.startsWith('http') && (
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={logoPreview}
                        alt="Logo preview"
                        sx={{ width: 64, height: 64, border: '2px solid #FF6B6B' }}
                      />
                      <Button
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={handleRemoveLogo}
                        color="error"
                        variant="outlined"
                      >
                        Eliminar
                      </Button>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box>
                  <input
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    style={{ display: 'none' }}
                    id="logo-upload"
                    type="file"
                    onChange={handleLogoFileChange}
                  />
                  <label htmlFor="logo-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      startIcon={<ImageIcon />}
                      sx={{
                        borderColor: '#FF6B6B',
                        color: '#FF6B6B',
                        mb: 2,
                        '&:hover': {
                          borderColor: '#FF5252',
                          backgroundColor: 'rgba(255, 107, 107, 0.04)',
                        },
                      }}
                    >
                      Seleccionar Imagen (PNG, SVG, JPEG - Máx. 2MB)
                    </Button>
                  </label>
                  {errors.logo && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
                      {errors.logo}
                    </Typography>
                  )}
                  {logoPreview && logoPreview.startsWith('data:') && (
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={logoPreview}
                        alt="Logo preview"
                        sx={{ width: 64, height: 64, border: '2px solid #FF6B6B' }}
                      />
                      <Box>
                        <Typography variant="body2">{logoFile?.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {(logoFile?.size || 0) / 1024} KB
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={handleRemoveLogo}
                        color="error"
                        variant="outlined"
                      >
                        Eliminar
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={isBulkEdit ? "Descripción (opcional)" : "Descripción"}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              multiline
              rows={3}
              sx={fieldStyles}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <FormControl fullWidth sx={formControlStyles}>
                <InputLabel>{isBulkEdit ? "Categorías Disponibles (opcional)" : "Categorías Disponibles"}</InputLabel>
                <Select
                  multiple
                  value={formData.categoryIds || []}
                  onChange={(e) => handleChange('categoryIds', e.target.value)}
                  input={<OutlinedInput label={isBulkEdit ? "Categorías Disponibles (opcional)" : "Categorías Disponibles"} />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as number[]).map((value) => {
                        const category = categories.find(c => c.id === value);
                        return (
                          <Chip
                            key={value}
                            label={category ? (category.label || category.name) : value}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                  MenuProps={MenuProps}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.label || category.name}
                    </MenuItem>
                  ))}
                </Select>
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                  {isBulkEdit 
                    ? 'Seleccione las categorías para actualizar en los fabricantes seleccionados'
                    : 'Seleccione las categorías donde este fabricante estará disponible'}
                </div>
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
        initialData={null}
      />
    </Dialog>
  );
};

export default AssetManufacturerForm;

