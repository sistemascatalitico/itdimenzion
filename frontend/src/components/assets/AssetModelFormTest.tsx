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
import ModalHeader from '../common/ModalHeader';

interface AssetModelFormTestProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: any;
  isBulkEdit?: boolean;
  selectedIds?: string[];
}

const AssetModelFormTest: React.FC<AssetModelFormTestProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  isBulkEdit = false,
  selectedIds = [],
}) => {
  // Estados para los datos del formulario
  const [formData, setFormData] = useState({
    manufacturerId: '',
    categoryId: '', // Solo para UI
    groupId: '', // Solo para UI
    typeId: '',
    name: '',
    description: '',
    partNumber: '',
    status: 'ACTIVE',
  });

  // Estados para las listas de opciones
  const [categories, setCategories] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [manufacturers, setManufacturers] = useState<any[]>([]);

  // Estados de UI
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos iniciales
  useEffect(() => {
    if (open) {
      console.log('🎬 Modal abierto, initialData:', initialData);
      loadCategories();
      loadManufacturers(); // Cargar TODOS los fabricantes al abrir
      
      if (initialData) {
        // Modo edición
        const typeData = initialData.type;
        const categoryId = typeData?.group?.category?.id?.toString() || '';
        const groupId = typeData?.group?.id?.toString() || '';
        const typeId = typeData?.id?.toString() || '';
        
        console.log('📝 Extrayendo IDs:', { categoryId, groupId, typeId });
        
        // Cargar en cascada
        if (categoryId) {
          loadGroups(categoryId);
        }
        if (groupId) {
          loadTypes(groupId);
        }
        
        // Establecer formData
        setFormData({
          manufacturerId: initialData.manufacturerId?.toString() || '',
          categoryId: categoryId,
          groupId: groupId,
          typeId: typeId,
          name: initialData.name || '',
          description: initialData.description || '',
          partNumber: initialData.partNumber || '',
          status: initialData.status || 'ACTIVE',
        });
      } else {
        // Modo creación - resetear
        setFormData({
          manufacturerId: '',
          categoryId: '',
          groupId: '',
          typeId: '',
          name: '',
          description: '',
          partNumber: '',
          status: 'ACTIVE',
        });
      }
      
      setErrors({});
    }
  }, [open, initialData]);

  // Funciones para cargar datos
  const loadCategories = async () => {
    try {
      const response = await assetCatalogService.getCategories();
      setCategories(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadGroups = async (categoryId: string) => {
    try {
      const response = await assetCatalogService.getGroups({ categoryId });
      setGroups(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadTypes = async (groupId: string) => {
    try {
      const response = await assetCatalogService.getTypes({ groupId });
      setTypes(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error loading types:', error);
    }
  };

  const loadManufacturers = async () => {
    try {
      const response = await assetCatalogService.getManufacturers();
      console.log('🏭 Fabricantes cargados:', response.length);
      setManufacturers(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error loading manufacturers:', error);
    }
  };

  // Handler para cambios en los campos
  const handleChange = (field: string, value: any) => {
    console.log(`✏️ handleChange: ${field} = ${value}`);
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Lógica en cascada
    if (field === 'categoryId') {
      setFormData(prev => ({ ...prev, groupId: '', typeId: '' }));
      setGroups([]);
      setTypes([]);
      if (value) {
        loadGroups(value);
      }
    }
    
    if (field === 'groupId') {
      setFormData(prev => ({ ...prev, typeId: '' }));
      setTypes([]);
      if (value) {
        loadTypes(value);
      }
    }
  };

  // Validación
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    // En bulk edit, los campos son opcionales
    if (!isBulkEdit) {
      if (!formData.name) newErrors.name = 'Nombre es requerido';
      if (!formData.manufacturerId) newErrors.manufacturerId = 'Fabricante es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Guardar
  const handleSave = async () => {
    if (!validate()) return;
    
    setSaving(true);
    
    try {
      if (isBulkEdit) {
        // Edición múltiple
        console.log('💾 Guardando edición múltiple para', selectedIds.length, 'modelos');
        
        // Solo enviar campos que han cambiado
        const payload: any = {};
        if (formData.manufacturerId) payload.manufacturerId = Number(formData.manufacturerId);
        if (formData.typeId) payload.typeId = Number(formData.typeId);
        if (formData.description) payload.description = formData.description;
        if (formData.partNumber) payload.partNumber = formData.partNumber;
        if (formData.status) payload.status = formData.status;
        
        console.log('📦 Payload bulk edit:', payload);
        
        // Actualizar cada modelo
        for (const id of selectedIds) {
          await assetCatalogService.updateModel(Number(id), payload);
        }
      } else {
        // Edición/creación individual
        const payload = {
          manufacturerId: Number(formData.manufacturerId),
          typeId: formData.typeId ? Number(formData.typeId) : undefined,
          name: formData.name,
          description: formData.description,
          partNumber: formData.partNumber,
          status: formData.status,
        };
        
        console.log('💾 Guardando:', payload);
        
        if (initialData?.id) {
          // Actualizar
          await assetCatalogService.updateModel(Number(initialData.id), payload);
        } else {
          // Crear
          await assetCatalogService.createModel(payload);
        }
      }
      
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error guardando:', error);
      setErrors({ submit: error.response?.data?.error || 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <ModalHeader
        title={isBulkEdit ? `Editar ${selectedIds.length} Modelos (TEST)` : (initialData ? 'Editar Modelo (TEST)' : 'Crear Modelo (TEST)')}
        onClose={onClose}
        gradientColor="orange"
      />
      
      <DialogContent dividers sx={{ p: 3 }}>
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>{errors.submit}</Alert>
        )}
        
        {/* Alerta para bulk edit */}
        {isBulkEdit && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>📝 Editando {selectedIds.length} modelos</strong><br />
            Los campos que completes se aplicarán a todos los modelos seleccionados. Los campos vacíos no se modificarán.
          </Alert>
        )}
        
        {/* Alerta si no tiene tipo */}
        {!isBulkEdit && initialData && !formData.typeId && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>⚠️ Este modelo no tiene un tipo asignado.</strong><br />
            Selecciona: Categoría → Grupo → Tipo
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* Fila 1: Categoría | Grupo */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.categoryId}>
              <InputLabel>Categoría {isBulkEdit && '(opcional)'}</InputLabel>
              <Select
                value={formData.categoryId || ''}
                label={`Categoría ${isBulkEdit ? '(opcional)' : ''}`}
                onChange={(e) => handleChange('categoryId', e.target.value)}
              >
                {isBulkEdit ? <MenuItem value="">No cambiar</MenuItem> : <MenuItem value="">Ninguna</MenuItem>}
                {categories.map((cat: any) => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.groupId} disabled={!formData.categoryId}>
              <InputLabel>Grupo {isBulkEdit && '(opcional)'}</InputLabel>
              <Select
                value={formData.groupId || ''}
                label={`Grupo ${isBulkEdit ? '(opcional)' : ''}`}
                onChange={(e) => handleChange('groupId', e.target.value)}
              >
                {isBulkEdit ? <MenuItem value="">No cambiar</MenuItem> : <MenuItem value="">Ninguno</MenuItem>}
                {groups.map((group: any) => (
                  <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Fila 2: Tipo | Fabricante */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.typeId} disabled={!formData.groupId}>
              <InputLabel>Tipo {isBulkEdit && '(opcional)'}</InputLabel>
              <Select
                value={formData.typeId || ''}
                label={`Tipo ${isBulkEdit ? '(opcional)' : ''}`}
                onChange={(e) => handleChange('typeId', e.target.value)}
              >
                {isBulkEdit ? <MenuItem value="">No cambiar</MenuItem> : <MenuItem value="">Ninguno</MenuItem>}
                {types.map((type: any) => (
                  <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.manufacturerId}>
              <InputLabel>{isBulkEdit ? 'Fabricante (opcional)' : 'Fabricante *'}</InputLabel>
              <Select
                value={formData.manufacturerId || ''}
                label={isBulkEdit ? 'Fabricante (opcional)' : 'Fabricante *'}
                onChange={(e) => handleChange('manufacturerId', e.target.value)}
              >
                {isBulkEdit ? <MenuItem value="">No cambiar</MenuItem> : <MenuItem value="">Selecciona un fabricante</MenuItem>}
                {manufacturers.map((mfr: any) => (
                  <MenuItem key={mfr.id} value={mfr.id}>{mfr.name}</MenuItem>
                ))}
              </Select>
              {errors.manufacturerId && (
                <div style={{ color: 'red', fontSize: '0.75rem', marginTop: '3px' }}>
                  {errors.manufacturerId}
                </div>
              )}
            </FormControl>
          </Grid>
          
          {/* Fila 3: Nombre | Número de Parte - Nombre solo en modo individual */}
          {!isBulkEdit && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre *"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
          )}
          
          <Grid item xs={12} md={isBulkEdit ? 12 : 6}>
            <TextField
              fullWidth
              label={isBulkEdit ? "Número de Parte (opcional)" : "Número de Parte"}
              value={formData.partNumber}
              onChange={(e) => handleChange('partNumber', e.target.value)}
            />
          </Grid>
          
          {/* Fila 4: Descripción */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label={isBulkEdit ? "Descripción (opcional)" : "Descripción"}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </Grid>
          
          {/* Fila 5: Estado */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Estado {isBulkEdit && '(opcional)'}</InputLabel>
              <Select
                value={formData.status}
                label={`Estado ${isBulkEdit ? '(opcional)' : ''}`}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                {isBulkEdit && <MenuItem value="">No cambiar</MenuItem>}
                <MenuItem value="ACTIVE">Activo</MenuItem>
                <MenuItem value="INACTIVE">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={saving}
          sx={{
            background: 'linear-gradient(45deg, #FF6B35 30%, #F7931E 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #E55A2B 30%, #E8820A 90%)'
            }
          }}
        >
          {saving ? 'Guardando...' : (isBulkEdit ? 'Modificar' : (initialData ? 'Actualizar' : 'Crear'))}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssetModelFormTest;

