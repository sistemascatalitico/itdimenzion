import React, { useEffect, useState, useRef } from 'react';
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
  InputAdornment,
  Box,
  Alert,
  Avatar,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Link as LinkIcon, Image as ImageIcon, Delete as DeleteIcon } from '@mui/icons-material';
import assetCatalogService from '../../services/assetCatalogService';
import api from '../../config/api';
import ModalHeader from '../common/ModalHeader';
import AssetManufacturerForm from './AssetManufacturerForm';
import AssetTypeForm from './AssetTypeForm';
import AssetCategoryForm from './AssetCategoryForm';
import AssetGroupForm from './AssetGroupForm';
import ImageUploader from './ImageUploader';
import DocumentUploader from './DocumentUploader';

interface AssetModel {
  id?: string;
  manufacturerId: string;
  categoryId?: string;
  groupId?: string;
  typeId?: string;
  name: string;
  description?: string;
  partNumber?: string;
  status?: string;
  referenceImage?: string;
  manufacturer?: {
    id: string;
    name: string;
    logo?: string;
  };
}

interface AssetModelFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: AssetModel | null;
  selectedModels?: AssetModel[];
  isBulkEdit?: boolean;
}

const AssetModelForm: React.FC<AssetModelFormProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  selectedModels = [],
  isBulkEdit = false,
}) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [formData, setFormData] = useState<Partial<AssetModel>>({
    manufacturerId: '',
    categoryId: '', // Solo para UI (selección en cascada), NO se guarda en BD
    groupId: '', // Solo para UI (selección en cascada), NO se guarda en BD
    typeId: '', // SÍ se guarda en BD
    name: '',
    description: '',
    partNumber: '',
    status: 'ACTIVE',
    referenceImage: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [typeFormOpen, setTypeFormOpen] = useState(false);
  const [manufacturerFormOpen, setManufacturerFormOpen] = useState(false);
  const [filesTab, setFilesTab] = useState(0); // 0: imágenes, 1: documentos
  const [referenceImageTab, setReferenceImageTab] = useState(0); // 0: URL, 1: Subir
  const [selectedManufacturer, setSelectedManufacturer] = useState<any>(null);
  const [lockedFromContext, setLockedFromContext] = useState<{
    categoryId: boolean;
    groupId: boolean;
    typeId: boolean;
  }>({ categoryId: false, groupId: false, typeId: false });

  const loadCategories = async () => {
    try {
      const r = await assetCatalogService.getCategories();
      const data = r.data || r;
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
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

  const loadTypes = async (groupId?: string, selectTypeId?: string) => {
    if (!groupId) {
      setTypes([]);
      return;
    }
    try {
      const r = await assetCatalogService.getTypes({ groupId });
      const data = r.data || r;
      const typesArray = Array.isArray(data) ? data : [];
      setTypes(typesArray);

      if (selectTypeId) {
        const typeIdStr = selectTypeId.toString();
        const typeExists = typesArray.some((t: any) => String(t.id) === typeIdStr);
        if (typeExists) {
          setFormData(prev => ({ ...prev, typeId: typeIdStr }));
        }
      }
    } catch (error) {
      console.error('Error loading types:', error);
      setTypes([]);
    }
  };

  const loadManufacturers = async (categoryId?: string) => {
    try {
      const params: Record<string, any> = {};
      if (categoryId) {
        params.category = categoryId;
      }
      const r = await assetCatalogService.getManufacturers(params);
      const data = r.data || r;
      const manufacturersArray = Array.isArray(data) ? data : [];
      setManufacturers(manufacturersArray);
      return manufacturersArray;
    } catch (error) {
      console.error('Error loading manufacturers:', error);
      return [];
    }
  };

  // Ref para rastrear si el formulario ya fue inicializado
  const formInitializedRef = useRef(false);

  useEffect(() => {
    // Solo inicializar cuando el modal se abre, no cada vez que cambia initialData
    if (open && !formInitializedRef.current) {
      loadCategories();
      
      if (isBulkEdit && selectedModels.length > 0) {
        // Modo edición múltiple
        console.log('📝 Modo BULK EDIT - selectedModels:', selectedModels.length);
        
        // Detectar campos comunes
        const commonData: any = {
          manufacturerId: '',
          categoryId: '',
          groupId: '',
          typeId: '',
          description: '',
          partNumber: '',
          status: 'ACTIVE',
          referenceImage: '',
        };
        
        // Verificar si todos tienen el mismo tipo
        const types = selectedModels.map(m => (m as any).type).filter(Boolean);
        if (types.length > 0) {
          const firstType = types[0];
          const allSameType = types.every(t => t.id === firstType.id);
          
          if (allSameType) {
            commonData.typeId = firstType.id?.toString() || '';
            commonData.categoryId = firstType.group?.category?.id?.toString() || '';
            commonData.groupId = firstType.group?.id?.toString() || '';
            
            // Cargar en cascada
            if (commonData.categoryId) {
              loadGroups(commonData.categoryId);
            }
            if (commonData.groupId) {
              // Pasar typeId para que se seleccione automáticamente después de cargar
              loadTypes(commonData.groupId, commonData.typeId);
            }
          }
        }
        
        // Verificar si todos tienen el mismo fabricante
        const manufacturers = selectedModels.map(m => m.manufacturerId).filter(Boolean);
        if (manufacturers.length > 0) {
          const allSameManufacturer = manufacturers.every(mId => mId === manufacturers[0]);
          if (allSameManufacturer) {
            commonData.manufacturerId = manufacturers[0].toString();
            const mfr = selectedModels.find(m => m.manufacturerId === manufacturers[0]);
            if (mfr && (mfr as any).manufacturer) {
              setSelectedManufacturer((mfr as any).manufacturer);
            }
          }
        }
        
        // Verificar si todos tienen el mismo estado
        const statuses = selectedModels.map(m => m.status).filter(Boolean);
        if (statuses.length > 0 && statuses.every(s => s === statuses[0])) {
          commonData.status = statuses[0];
        }
        
        setFormData(commonData);
        loadManufacturers(commonData.categoryId || undefined);
        
      } else if (initialData) {
        const typeData = (initialData as any).type;
        let categoryId = '';
        let groupId = '';
        let typeId = '';
        const isEdit = !!initialData.id;
        
        if (typeData) {
          categoryId = typeData?.group?.category?.id?.toString() || '';
          groupId = typeData?.group?.id?.toString() || '';
          typeId = typeData?.id?.toString() || '';
        } else {
          categoryId = (initialData as any).categoryId?.toString() || '';
          groupId = (initialData as any).groupId?.toString() || '';
          typeId = (initialData as any).typeId?.toString() || '';
        }
        
        console.log('📝 Extrayendo IDs:', { categoryId, groupId, typeId, isEdit });
        
        if (!isEdit) {
          setLockedFromContext({
            categoryId: !!categoryId,
            groupId: !!groupId,
            typeId: !!typeId,
          });
        } else {
          setLockedFromContext({ categoryId: false, groupId: false, typeId: false });
        }
        
        setFormData({
          manufacturerId: (initialData as any).manufacturerId?.toString() || '',
          categoryId: categoryId,
          groupId: groupId,
          typeId: typeId,
          name: initialData.name || '',
          description: initialData.description || '',
          partNumber: initialData.partNumber || '',
          status: initialData.status || 'ACTIVE',
          referenceImage: (initialData as any).referenceImage || '',
        });
        
        loadManufacturers(categoryId || undefined);
        
        if (categoryId) {
          loadGroups(categoryId);
        }
        if (groupId) {
          loadTypes(groupId, typeId);
        }
        
        if ((initialData as any).manufacturer) {
          setSelectedManufacturer((initialData as any).manufacturer);
        }
      } else {
        setFormData({
          manufacturerId: '',
          categoryId: '',
          groupId: '',
          typeId: '',
          name: '',
          description: '',
          partNumber: '',
          status: 'ACTIVE',
          referenceImage: '',
        });
        setSelectedManufacturer(null);
        loadManufacturers();
      }
      
      setErrors({});
      formInitializedRef.current = true;
    }
    
    if (!open) {
      formInitializedRef.current = false;
      setLockedFromContext({ categoryId: false, groupId: false, typeId: false });
    }
  }, [open]); // Solo depender de 'open', no de initialData


  const handleChange = (field: string, value: any) => {
    console.log(`✏️ handleChange: ${field} = ${value}`);
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    if (field === 'categoryId') {
      setFormData(prev => ({ ...prev, groupId: '', typeId: '', manufacturerId: '' }));
      setGroups([]);
      setTypes([]);
      setManufacturers([]);
      setSelectedManufacturer(null);
      if (value) {
        loadGroups(value);
        loadManufacturers(value);
      }
    }
    
    if (field === 'groupId') {
      setFormData(prev => ({ ...prev, typeId: '' }));
      setTypes([]);
      if (value) {
        loadTypes(value);
      }
    }
    
    // Si cambia el manufacturerId, actualizar selectedManufacturer
    if (field === 'manufacturerId' && value) {
      const found = manufacturers.find((m: any) => {
        const mId = m.id?.toString() || String(m.id);
        return mId === value.toString();
      });
      setSelectedManufacturer(found || null);
    }
  };

  const handleReferenceImageUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, referenceImage: url }));
  };

  const handleReferenceImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({ ...prev, referenceImage: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReferenceImage = () => {
    setFormData(prev => ({ ...prev, referenceImage: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!isBulkEdit) {
      if (!formData.name) newErrors.name = 'Nombre es requerido';
      if (!formData.categoryId) newErrors.categoryId = 'Categoría es requerida';
      if (!formData.typeId) newErrors.typeId = 'Tipo es requerido';
      if (!formData.manufacturerId) newErrors.manufacturerId = 'Fabricante es requerido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);

      if (isBulkEdit && selectedModels.length > 0) {
        // Edición masiva: actualizar solo los campos que han cambiado
        const updatePromises = selectedModels.map(async (model) => {
          const updatePayload: any = {};
          
          // Solo incluir campos que han cambiado o que tienen valor (no vacíos)
          // IMPORTANTE: categoryId y groupId NO se guardan en BD (solo son para UI)
          if (formData.manufacturerId && formData.manufacturerId !== '') updatePayload.manufacturerId = Number(formData.manufacturerId);
          if (formData.typeId && formData.typeId !== '') updatePayload.typeId = Number(formData.typeId);
          if (formData.description !== undefined && formData.description !== '') updatePayload.description = formData.description;
          if (formData.partNumber !== undefined && formData.partNumber !== '') updatePayload.partNumber = formData.partNumber;
          if (formData.status) updatePayload.status = formData.status;
          if (formData.referenceImage !== undefined) {
            updatePayload.referenceImage = formData.referenceImage || null;
          }
          
          if (Object.keys(updatePayload).length > 0 && model.id) {
            await api.put(`/asset-models/${model.id}`, updatePayload);
          }
        });
        
        await Promise.all(updatePromises);
      } else {
        // Edición/creación individual
        // IMPORTANTE: categoryId y groupId NO se envían (solo existen en UI para selección en cascada)
        const payload = {
          manufacturerId: formData.manufacturerId ? Number(formData.manufacturerId) : undefined,
          typeId: formData.typeId ? Number(formData.typeId) : undefined,
          name: formData.name,
          description: formData.description,
          partNumber: formData.partNumber,
          status: formData.status || 'ACTIVE',
          referenceImage: formData.referenceImage || undefined,
        };

        let savedModelId: number | null = null;
        
        if (initialData?.id) {
          await api.put(`/asset-models/${initialData.id}`, payload);
          savedModelId = Number(initialData.id);
        } else {
          const response = await api.post('/asset-models', payload);
          savedModelId = response.data?.id ? Number(response.data.id) : null;
        }

        // Actualizar formData con el ID para que los uploaders funcionen
        if (savedModelId) {
          setFormData(prev => ({ ...prev, id: savedModelId?.toString() }));
        }
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving model:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error al guardar modelo';
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
        title={isBulkEdit ? `Editar ${selectedModels.length} Modelos` : (initialData ? 'Editar Modelo' : 'Crear Modelo')}
        onClose={onClose}
        gradientColor="orange"
      />

      <DialogContent dividers sx={{ p: 3 }}>
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.submit}
          </Alert>
        )}
        
        {isBulkEdit && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Estás editando {selectedModels.length} modelo(s). Solo los campos que modifiques se actualizarán en todos los modelos seleccionados.
          </Alert>
        )}
        
        {/* Alertas para datos faltantes */}
        {initialData && !formData.typeId && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>⚠️ Este modelo no tiene un tipo asignado.</strong><br />
            Para asignar un tipo, debes seguir estos pasos en orden:
            <ol style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
              <li>Selecciona una <strong>Categoría</strong> (ej: Hardware)</li>
              <li>Selecciona un <strong>Grupo</strong> dentro de la categoría (ej: Computers)</li>
              <li>Selecciona un <strong>Tipo</strong> dentro del grupo (ej: Portátil Corporativo)</li>
            </ol>
            <div style={{ marginTop: '8px', fontSize: '0.9em', color: '#666' }}>
              💡 Tip: Si el tipo que necesitas no existe, puedes crearlo con el botón + después de seleccionar el grupo.
            </div>
          </Alert>
        )}
        
        {initialData && !formData.manufacturerId && manufacturers.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            ⚠️ El fabricante de este modelo no está disponible o fue eliminado. Por favor, selecciona un fabricante.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* FILA 1: Categoría (izquierda) y Grupo (derecha) */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <FormControl fullWidth sx={formControlStyles} error={!!errors.categoryId}>
                <InputLabel>Categoría *</InputLabel>
                <Select
                  label="Categoría *"
                  value={formData.categoryId || ''}
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                  required
                  disabled={lockedFromContext.categoryId}
                >
                  <MenuItem value="">Seleccione una categoría</MenuItem>
                  {formData.categoryId && categories.length === 0 && (
                    <MenuItem value={formData.categoryId}>Cargando...</MenuItem>
                  )}
                  {categories.map((c: any) => (
                    <MenuItem key={c.id} value={String(c.id)}>{c.label || c.name}</MenuItem>
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
              <FormControl fullWidth sx={formControlStyles} disabled={!formData.categoryId || lockedFromContext.groupId}>
                <InputLabel>Grupo</InputLabel>
                <Select
                  label="Grupo"
                  value={formData.groupId || ''}
                  onChange={(e) => handleChange('groupId', e.target.value)}
                  disabled={!formData.categoryId || lockedFromContext.groupId}
                >
                  <MenuItem value="">Ninguno</MenuItem>
                  {formData.groupId && groups.length === 0 && (
                    <MenuItem value={formData.groupId}>Cargando...</MenuItem>
                  )}
                  {groups.map((g: any) => (
                    <MenuItem key={g.id} value={String(g.id)}>{g.label || g.name}</MenuItem>
                  ))}
                </Select>
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

          {/* FILA 2: Tipo (izquierda) y Fabricante (derecha) */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <FormControl fullWidth sx={formControlStyles} error={!!errors.typeId}>
                <InputLabel>Tipo {!isBulkEdit && '*'}</InputLabel>
                <Select
                  label={`Tipo ${!isBulkEdit ? '*' : ''}`}
                  value={formData.typeId || ''}
                  onChange={(e) => handleChange('typeId', e.target.value)}
                  disabled={!formData.groupId || lockedFromContext.typeId}
                >
                  {!isBulkEdit && <MenuItem value="" disabled>Selecciona un tipo</MenuItem>}
                  {isBulkEdit && <MenuItem value="">No cambiar</MenuItem>}
                  {/* Fallback: si typeId está seleccionado pero la lista aún no cargó, mostrar un item temporal */}
                  {formData.typeId && types.length === 0 && (
                    <MenuItem value={formData.typeId}>Cargando...</MenuItem>
                  )}
                  {types.map((t: any) => (
                    <MenuItem key={t.id} value={String(t.id)}>
                      {t.label || t.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.typeId && (
                  <div style={{ color: 'red', fontSize: '0.75rem', marginTop: '3px' }}>
                    {errors.typeId}
                  </div>
                )}
              </FormControl>
              <IconButton
                size="small"
                onClick={() => setTypeFormOpen(true)}
                disabled={!formData.groupId}
                sx={{
                  mt: 1.5,
                  color: formData.groupId ? '#FF6B6B' : '#ccc',
                  border: `1px solid ${formData.groupId ? '#FF6B6B' : '#ccc'}`,
                  '&:hover': formData.groupId ? { 
                    backgroundColor: 'rgba(255, 107, 107, 0.08)',
                    borderColor: '#FF5252',
                  } : {},
                }}
                title={formData.groupId ? "Crear nuevo tipo" : "Selecciona un grupo primero"}
              >
                <AddIcon />
              </IconButton>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <FormControl fullWidth sx={formControlStyles} error={!!errors.manufacturerId}>
                <InputLabel>{isBulkEdit ? 'Fabricante (opcional)' : 'Fabricante *'}</InputLabel>
                <Select
                  label={isBulkEdit ? 'Fabricante (opcional)' : 'Fabricante *'}
                  value={formData.manufacturerId ? String(formData.manufacturerId) : ''}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log('🎯 onChange Fabricante - nuevo valor:', newValue, 'tipo:', typeof newValue);
                    handleChange('manufacturerId', newValue);
                  }}
                >
                  {/* Siempre tener un MenuItem vacío para evitar error de MUI */}
                  {!isBulkEdit && <MenuItem value="" disabled>Selecciona un fabricante</MenuItem>}
                  {isBulkEdit && <MenuItem value="">No cambiar</MenuItem>}
                  
                  {manufacturers.length === 0 && !isBulkEdit && (
                    <MenuItem value="" disabled>
                      Cargando fabricantes...
                    </MenuItem>
                  )}
                  
                  {/* Mostrar el fabricante seleccionado si existe, aunque no esté en la lista filtrada */}
                  {selectedManufacturer && !manufacturers.some((m: any) => String(m.id) === String(selectedManufacturer.id)) && (
                    <MenuItem value={String(selectedManufacturer.id)}>
                      {selectedManufacturer.name} (actual)
                    </MenuItem>
                  )}
                  
                  {manufacturers.map((m: any) => {
                    const mId = String(m.id);
                    return (
                      <MenuItem key={m.id} value={mId}>{m.name}</MenuItem>
                    );
                  })}
                </Select>
                {errors.manufacturerId && (
                  <div style={{ color: 'red', fontSize: '0.75rem', marginTop: '3px' }}>
                    {errors.manufacturerId}
                  </div>
                )}
                {formData.categoryId && manufacturers.length === 0 && !errors.manufacturerId && (
                  <div style={{ fontSize: '0.75rem', marginTop: '3px', color: '#666' }}>
                    Puede crear un nuevo fabricante con el botón +
                  </div>
                )}
              </FormControl>
              <IconButton
                size="small"
                onClick={() => setManufacturerFormOpen(true)}
                sx={{
                  mt: 1.5,
                  color: '#FF6B6B',
                  border: '1px solid #FF6B6B',
                  '&:hover': { 
                    backgroundColor: 'rgba(255, 107, 107, 0.08)',
                    borderColor: '#FF5252',
                  },
                }}
                title="Crear nuevo fabricante"
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
            {/* Mostrar logo del fabricante si está seleccionado */}
            {selectedManufacturer && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  src={selectedManufacturer.logo || undefined}
                  alt={selectedManufacturer.name}
                  sx={{
                    width: 48,
                    height: 48,
                    border: '2px solid #FF6B6B',
                    bgcolor: 'rgba(255, 107, 107, 0.1)',
                  }}
                >
                  {!selectedManufacturer.logo && selectedManufacturer.name.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="body2" color="textSecondary">
                  Logo de {selectedManufacturer.name}
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Nombre y Número de Parte */}
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
              label="Número de Parte"
              value={formData.partNumber}
              onChange={(e) => handleChange('partNumber', e.target.value)}
              sx={fieldStyles}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              multiline
              rows={3}
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

          {/* Imagen de Referencia */}
          {!isBulkEdit && (
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Imagen de Referencia
                </Typography>
                <Tabs value={referenceImageTab} onChange={(_, newValue) => setReferenceImageTab(newValue)} sx={{ mb: 2, minHeight: 40 }}>
                  <Tab icon={<LinkIcon />} iconPosition="start" label="URL" />
                  <Tab icon={<ImageIcon />} iconPosition="start" label="Subir Imagen" />
                </Tabs>
                
                {referenceImageTab === 0 ? (
                  <Box>
                    <TextField
                      fullWidth
                      label="URL de la Imagen"
                      placeholder="https://ejemplo.com/imagen.png"
                      value={formData.referenceImage?.startsWith('http') ? formData.referenceImage : ''}
                      onChange={(e) => handleReferenceImageUrlChange(e.target.value)}
                      sx={fieldStyles}
                    />
                    {formData.referenceImage && formData.referenceImage.startsWith('http') && (
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={formData.referenceImage}
                          alt="Imagen de referencia"
                          sx={{ width: 64, height: 64, border: '2px solid #4CAF50' }}
                        />
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={handleRemoveReferenceImage}
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
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="reference-image-upload"
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleReferenceImageUpload(file);
                      }}
                    />
                    <label htmlFor="reference-image-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<ImageIcon />}
                        fullWidth
                        sx={fieldStyles}
                      >
                        Seleccionar Imagen
                      </Button>
                    </label>
                    {formData.referenceImage && formData.referenceImage.startsWith('data:') && (
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={formData.referenceImage}
                          alt="Imagen de referencia"
                          sx={{ width: 64, height: 64, border: '2px solid #4CAF50' }}
                        />
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={handleRemoveReferenceImage}
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
        </Grid>

        {/* Sección de Imágenes y Documentos - Mostrar si el modelo ya existe o después de guardar */}
        {(initialData?.id || formData.id) && (
          <Box sx={{ mt: 4, borderTop: '1px solid #e0e0e0', pt: 3 }}>
            <Tabs value={filesTab} onChange={(_, newValue) => setFilesTab(newValue)} sx={{ mb: 3 }}>
              <Tab label="Imágenes" />
              <Tab label="Documentos" />
            </Tabs>

            {filesTab === 0 && (
              <ImageUploader
                entityType="model"
                entityId={Number(initialData?.id || formData.id)}
              />
            )}

            {filesTab === 1 && (
              <DocumentUploader
                entityType="model"
                entityId={Number(initialData?.id || formData.id)}
              />
            )}
          </Box>
        )}
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
          {saving ? 'Guardando...' : (isBulkEdit ? 'Modificar' : (initialData ? 'Actualizar' : 'Crear'))}
        </Button>
      </DialogActions>

      {/* Modales anidados */}
      <AssetCategoryForm
        open={categoryFormOpen}
        onClose={() => setCategoryFormOpen(false)}
        onSave={() => {
          setCategoryFormOpen(false);
          loadCategories();
        }}
      />

      <AssetGroupForm
        open={groupFormOpen}
        onClose={() => setGroupFormOpen(false)}
        initialData={formData.categoryId ? { categoryId: formData.categoryId } as any : null}
        onSave={() => {
          setGroupFormOpen(false);
          if (formData.categoryId) {
            // Recargar grupos de la categoría seleccionada
            loadGroups(formData.categoryId);
          }
        }}
      />

      <AssetTypeForm
        open={typeFormOpen}
        onClose={() => setTypeFormOpen(false)}
        initialData={formData.groupId ? { groupId: formData.groupId, categoryId: formData.categoryId } as any : null}
        onSave={() => {
          setTypeFormOpen(false);
          if (formData.groupId) {
            loadTypes(formData.groupId);
          }
        }}
      />

      <AssetManufacturerForm
        open={manufacturerFormOpen}
        onClose={() => setManufacturerFormOpen(false)}
        onSave={() => {
          setManufacturerFormOpen(false);
          loadManufacturers(formData.categoryId || undefined);
        }}
        initialData={formData.categoryId ? { categoryIds: [Number(formData.categoryId)] } as any : null}
      />
    </Dialog>
  );
};

export default AssetModelForm;

