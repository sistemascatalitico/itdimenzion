import React, { useEffect, useMemo, useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Grid, 
  TextField, 
  Divider, 
  Chip, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  IconButton,
  Box,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import { Add as AddIcon, PlaylistAddCheck as FormIcon } from '@mui/icons-material';
import assetCatalogService from '../../services/assetCatalogService';
import customFieldService from '../../services/customFieldService';
import assetService from '../../services/assetService';
import formBuilderService from '../../services/formBuilderService';
import AssetCategoryForm from './AssetCategoryForm';
import AssetGroupForm from './AssetGroupForm';
import AssetTypeForm from './AssetTypeForm';
import AssetModelForm from './AssetModelForm';
import FormRenderer from '../formBuilder/FormRenderer';
import ModalHeader from '../common/ModalHeader';
import { useAuth } from '../../hooks/useAuth';

type AssetFormProps = {
  open: boolean;
  onClose: () => void;
};

const AssetForm: React.FC<AssetFormProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [groupId, setGroupId] = useState<number | ''>('');
  const [typeId, setTypeId] = useState<number | ''>('');
  const [modelId, setModelId] = useState<number | ''>('');
  const [resolvedFields, setResolvedFields] = useState<any[]>([]);
  const [baseValues, setBaseValues] = useState<{ assetCode?: string; serialNumber?: string }>({});
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [typeFormOpen, setTypeFormOpen] = useState(false);
  const [modelFormOpen, setModelFormOpen] = useState(false);
  
  // Form Builder integration
  const [assetTypeForm, setAssetTypeForm] = useState<any>(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    assetCatalogService.getCategories().then((r) => setCategories(r.data || r));
  }, [open]);

  useEffect(() => {
    if (!categoryId) { setGroups([]); setGroupId(''); return; }
    assetCatalogService.getGroups({ categoryId }).then((r) => setGroups(r.data || r));
  }, [categoryId]);

  useEffect(() => {
    if (!groupId) { setTypes([]); setTypeId(''); return; }
    assetCatalogService.getTypes({ groupId }).then((r) => setTypes(r.data || r));
  }, [groupId]);

  useEffect(() => {
    if (!typeId) { 
      setModels([]); 
      setModelId(''); 
      setResolvedFields([]); 
      setAssetTypeForm(null);
      return; 
    }
    
    assetCatalogService.getModels({ typeId }).then((r) => setModels(r.data || r));
    
    // Intentar cargar formulario del Form Builder
    setLoadingForm(true);
    setFormError(null);
    formBuilderService.getFormByAssetType(Number(typeId))
      .then((response) => {
        console.log('✅ Formulario Form Builder cargado:', response.data);
        setAssetTypeForm(response.data);
        setResolvedFields([]); // Limpiar campos legacy
      })
      .catch((error) => {
        console.log('⚠️ No hay formulario Form Builder, usando campos legacy');
        // Si no hay formulario, usar el sistema legacy
        customFieldService.getResolvedFieldsForType(Number(typeId))
          .then((r) => setResolvedFields(r.data || r || []));
        setAssetTypeForm(null);
      })
      .finally(() => {
        setLoadingForm(false);
      });
  }, [typeId]);

  const handleChangeDynamic = (key: string, value: any) => {
    setDynamicValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const payload = {
        assetCode: baseValues.assetCode,
        serialNumber: baseValues.serialNumber,
        categoryId: categoryId || undefined,
        groupId: groupId || undefined,
        typeId: typeId || undefined,
        modelId: modelId || undefined,
      } as any;
      
      // Si hay formulario del Form Builder, agregar datos
      if (assetTypeForm) {
        payload.formId = assetTypeForm.id;
        payload.formData = dynamicValues;
        payload.formVersion = assetTypeForm.version;
      }
      
      const created = await assetService.create(payload);
      const assetId = created?.data?.id || created?.id;
      
      // Si no hay Form Builder, usar sistema legacy
      if (assetId && !assetTypeForm && Object.keys(dynamicValues).length > 0) {
        await customFieldService.upsertAssetFieldValues(assetId, { values: dynamicValues });
      }
      
      onClose();
    } catch (e) {
      console.error('Error creating asset:', e);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = (formData: Record<string, any>) => {
    console.log('📝 Form Builder data received:', formData);
    setDynamicValues(formData);
  };

  const handleFinalSubmit = async () => {
    if (assetTypeForm) {
      // Si hay formulario, usar los datos del FormRenderer directamente
      await handleSubmit();
    } else {
      // Si no hay formulario, usar el submit normal
      await handleSubmit();
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
      disableEnforceFocus
      PaperProps={{
        sx: {
          borderRadius: 1,
          maxHeight: '90vh',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <ModalHeader
        title="Nuevo Activo"
        onClose={onClose}
        gradientColor="orange"
      />
      <DialogContent dividers sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth 
              label="Código" 
              value={baseValues.assetCode || ''} 
              onChange={(e) => setBaseValues(v => ({ ...v, assetCode: e.target.value }))} 
              sx={fieldStyles}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth 
              label="Serial" 
              value={baseValues.serialNumber || ''} 
              onChange={(e) => setBaseValues(v => ({ ...v, serialNumber: e.target.value }))} 
              sx={fieldStyles}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <FormControl fullWidth sx={formControlStyles}>
                <InputLabel>Categoría</InputLabel>
                <Select label="Categoría" value={categoryId} onChange={(e) => setCategoryId(e.target.value as any)}>
                  {categories.map((c: any) => (<MenuItem key={c.id} value={c.id}>{c.label || c.name}</MenuItem>))}
                </Select>
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
              <FormControl fullWidth sx={formControlStyles} disabled={!categoryId}>
                <InputLabel>Grupo</InputLabel>
                <Select 
                  label="Grupo" 
                  value={groupId} 
                  onChange={(e) => setGroupId(e.target.value as any)} 
                  disabled={!categoryId}
                >
                  {groups.map((g: any) => (<MenuItem key={g.id} value={g.id}>{g.label || g.name}</MenuItem>))}
                </Select>
              </FormControl>
              <IconButton
                size="small"
                onClick={() => setGroupFormOpen(true)}
                disabled={!categoryId}
                sx={{
                  mt: 1.5,
                  color: categoryId ? '#FF6B6B' : '#ccc',
                  border: `1px solid ${categoryId ? '#FF6B6B' : '#ccc'}`,
                  '&:hover': { 
                    backgroundColor: categoryId ? 'rgba(255, 107, 107, 0.08)' : 'transparent',
                    borderColor: categoryId ? '#FF5252' : '#ccc',
                  },
                }}
                title={categoryId ? "Crear nuevo grupo" : "Primero seleccione una categoría"}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <FormControl fullWidth sx={formControlStyles} disabled={!groupId}>
                <InputLabel>Tipo</InputLabel>
                <Select 
                  label="Tipo" 
                  value={typeId} 
                  onChange={(e) => setTypeId(e.target.value as any)} 
                  disabled={!groupId}
                >
                  {types.map((t: any) => (<MenuItem key={t.id} value={t.id}>{t.label || t.name}</MenuItem>))}
                </Select>
              </FormControl>
              <IconButton
                size="small"
                onClick={() => setTypeFormOpen(true)}
                disabled={!groupId}
                sx={{
                  mt: 1.5,
                  color: groupId ? '#FF6B6B' : '#ccc',
                  border: `1px solid ${groupId ? '#FF6B6B' : '#ccc'}`,
                  '&:hover': { 
                    backgroundColor: groupId ? 'rgba(255, 107, 107, 0.08)' : 'transparent',
                    borderColor: groupId ? '#FF5252' : '#ccc',
                  },
                }}
                title={groupId ? "Crear nuevo tipo" : "Primero seleccione un grupo"}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <FormControl fullWidth sx={formControlStyles} disabled={!typeId}>
                <InputLabel>Modelo</InputLabel>
                <Select 
                  label="Modelo" 
                  value={modelId} 
                  onChange={(e) => setModelId(e.target.value as any)} 
                  disabled={!typeId}
                >
                  {models.map((m: any) => (<MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>))}
                </Select>
              </FormControl>
              <IconButton
                size="small"
                onClick={() => setModelFormOpen(true)}
                disabled={!typeId}
                sx={{
                  mt: 1.5,
                  color: typeId ? '#FF6B6B' : '#ccc',
                  border: `1px solid ${typeId ? '#FF6B6B' : '#ccc'}`,
                  '&:hover': { 
                    backgroundColor: typeId ? 'rgba(255, 107, 107, 0.08)' : 'transparent',
                    borderColor: typeId ? '#FF5252' : '#ccc',
                  },
                }}
                title={typeId ? "Crear nuevo modelo" : "Primero seleccione un tipo"}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>

          {/* Mostrar Form Builder o campos legacy */}
          {loadingForm && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
                <CircularProgress size={20} />
                <Typography>Cargando formulario dinámico...</Typography>
              </Box>
            </Grid>
          )}

          {!loadingForm && assetTypeForm && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Chip 
                  icon={<FormIcon />} 
                  label={`Formulario: ${assetTypeForm.name}`} 
                  color="primary"
                />
              </Divider>
              <Alert severity="info" sx={{ mb: 2 }}>
                Este tipo de activo usa un formulario dinámico del Form Builder.
              </Alert>
            </Grid>
          )}

          {!loadingForm && !assetTypeForm && resolvedFields.length > 0 && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}><Chip label="Campos Dinámicos (Legacy)" /></Divider>
              </Grid>

              {/* Render dinámico básico: como TextField genérico */}
              {resolvedFields.map((f: any) => {
                const key = f.key || f.slug || String(f.id);
                return (
                  <Grid item xs={12} md={6} key={key}>
                    <TextField
                      fullWidth
                      label={f.label || f.displayName || key}
                      value={dynamicValues[key] || ''}
                      onChange={(e) => handleChangeDynamic(key, e.target.value)}
                    />
                  </Grid>
                );
              })}
            </>
          )}
        </Grid>

        {/* Form Builder Renderer */}
        {!loadingForm && assetTypeForm && (
          <Box sx={{ mt: 3 }}>
            <FormRenderer
              form={assetTypeForm}
              onSubmit={handleFormSubmit}
              companyId={user?.company?.id ? Number(user.company.id) : undefined}
              assetTypeId={Number(typeId)}
              showActions={false}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={submitting}
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
          onClick={handleFinalSubmit} 
          variant="contained" 
          disabled={submitting}
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
          {submitting ? 'Creando...' : 'Crear'}
        </Button>
      </DialogActions>

      {/* Modales anidados */}
      <AssetCategoryForm
        open={categoryFormOpen}
        onClose={() => setCategoryFormOpen(false)}
        onSave={() => {
          setCategoryFormOpen(false);
          assetCatalogService.getCategories().then((r) => setCategories(r.data || r));
        }}
      />

      <AssetGroupForm
        open={groupFormOpen}
        onClose={() => setGroupFormOpen(false)}
        initialData={categoryId ? { categoryId: categoryId.toString() } as any : null}
        onSave={() => {
          setGroupFormOpen(false);
          if (categoryId) {
            assetCatalogService.getGroups({ categoryId }).then((r) => setGroups(r.data || r));
          }
        }}
      />

      <AssetTypeForm
        open={typeFormOpen}
        onClose={() => setTypeFormOpen(false)}
        initialData={groupId ? { groupId: groupId.toString(), categoryId: categoryId.toString() } as any : null}
        onSave={() => {
          setTypeFormOpen(false);
          if (groupId) {
            assetCatalogService.getTypes({ groupId }).then((r) => setTypes(r.data || r));
          }
        }}
      />

      <AssetModelForm
        open={modelFormOpen}
        onClose={() => setModelFormOpen(false)}
        initialData={typeId ? { typeId: typeId.toString(), categoryId: categoryId.toString(), groupId: groupId.toString() } as any : null}
        onSave={() => {
          setModelFormOpen(false);
          if (typeId) {
            assetCatalogService.getModels({ typeId }).then((r) => setModels(r.data || r));
          }
        }}
      />
    </Dialog>
  );
};

export default AssetForm;


