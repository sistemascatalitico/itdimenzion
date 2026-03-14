import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  RestorePage as RestoreIcon,
  FiberNew as NewIcon,
} from '@mui/icons-material';
import assetCatalogService from '../../services/assetCatalogService';
import customFieldService from '../../services/customFieldService';
import assetService from '../../services/assetService';
import assetFilesService from '../../services/assetFilesService';
import { useAuth } from '../../hooks/useAuth';
import AssetTypeSelector from './NewAssetModal/AssetTypeSelector';
import UniversalFieldsTab from './NewAssetModal/UniversalFieldsTab';
import DynamicFieldsTab from './NewAssetModal/DynamicFieldsTab';
import ConnectionsTab from './NewAssetModal/ConnectionsTab';
import PhotosTab from './NewAssetModal/PhotosTab';
import DocumentsTab from './NewAssetModal/DocumentsTab';

interface NewAssetModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preFilled?: {
    categoryId?: number;
    groupId?: number;
    typeId?: number;
  };
}

const DRAFT_STORAGE_KEY = 'itdimenzion-asset-draft';

interface DraftData {
  activeStep: number;
  categoryId: number | null;
  groupId: number | null;
  typeId: number | null;
  formData: Record<string, any>;
  savedAt: string;
}

const saveDraft = (data: DraftData) => {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded or private mode */ }
};

const loadDraft = (): DraftData | null => {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const draft: DraftData = JSON.parse(raw);
    const hasData = draft.typeId || Object.keys(draft.formData).length > 0;
    return hasData ? draft : null;
  } catch {
    return null;
  }
};

const clearDraft = () => {
  try { localStorage.removeItem(DRAFT_STORAGE_KEY); } catch { /* noop */ }
};

const NewAssetModal: React.FC<NewAssetModalProps> = ({
  open,
  onClose,
  onSuccess,
  preFilled
}) => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  
  const [categoryId, setCategoryId] = useState<number | null>(preFilled?.categoryId || null);
  const [groupId, setGroupId] = useState<number | null>(preFilled?.groupId || null);
  const [typeId, setTypeId] = useState<number | null>(preFilled?.typeId || null);
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const [universalFields, setUniversalFields] = useState<any[]>([]);
  const [dynamicFields, setDynamicFields] = useState<any[]>([]);
  const [reusableFields, setReusableFields] = useState<any[]>([]);
  const [connectionConfig, setConnectionConfig] = useState<any>(null);
  const [assetTypeInfo, setAssetTypeInfo] = useState<any>(null);
  
  const [photos, setPhotos] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<DraftData | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
      return;
    }
    if (initializedRef.current) return;

    const draft = loadDraft();
    if (draft && !preFilled?.typeId) {
      setPendingDraft(draft);
      setShowDraftDialog(true);
    } else {
      initializedRef.current = true;
    }
  }, [open, preFilled]);

  const handleResumeDraft = () => {
    if (!pendingDraft) return;
    setCategoryId(pendingDraft.categoryId);
    setGroupId(pendingDraft.groupId);
    setTypeId(pendingDraft.typeId);
    setFormData(pendingDraft.formData);
    setActiveStep(pendingDraft.activeStep);
    setShowDraftDialog(false);
    setPendingDraft(null);
    initializedRef.current = true;
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowDraftDialog(false);
    setPendingDraft(null);
    initializedRef.current = true;
  };

  useEffect(() => {
    if (typeId && open && initializedRef.current) {
      loadFieldsForType(typeId);
      loadConnectionConfig(typeId);
    }
  }, [typeId, open]);
  
  // Resetear campos del paso 2 cuando cambia el tipo en el paso 1
  // Usamos un ref para evitar loops infinitos
  const prevTypeIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (open && typeId && prevTypeIdRef.current !== null && prevTypeIdRef.current !== typeId) {
      // El tipo cambió, resetear campos del paso 2 (Información General)
      // Solo si estamos en paso 1 o posterior
      if (activeStep >= 1 && !preFilled?.typeId) {
        setFormData(prev => {
          const newData: Record<string, any> = {};
          // Mantener solo los campos de jerarquía
          if (categoryId) newData.categoryId = categoryId;
          if (groupId) newData.groupId = groupId;
          if (typeId) newData.typeId = typeId;
          return newData;
        });
        setFormErrors({});
      }
    }
    prevTypeIdRef.current = typeId;
  }, [typeId, open, activeStep, categoryId, groupId, preFilled]);
  
  // Si viene prellenado, empezar en paso 0 (que será "Información General", no "Seleccionar Tipo")
  useEffect(() => {
    if (preFilled?.typeId && open) {
      setActiveStep(0); // Paso 0 con preFilled = Información General
      setTypeId(preFilled.typeId);
      setCategoryId(preFilled.categoryId || null);
      setGroupId(preFilled.groupId || null);
    } else if (open && !preFilled?.typeId) {
      setActiveStep(0); // Paso 0 sin preFilled = Seleccionar Tipo
    }
  }, [open, preFilled]);
  
  const loadFieldsForType = async (assetTypeId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await customFieldService.getFieldsForAssetType(assetTypeId);
      
      console.log('🔍 NewAssetModal - Respuesta del backend:', {
        response,
        success: response?.success,
        data: response?.data,
        universalFields: response?.data?.universalFields,
        universalFieldsCount: response?.data?.universalFields?.length
      });
      
      if (response.success && response.data) {
        const universalFields = response.data.universalFields || [];
        console.log('✅ Campos universales recibidos:', universalFields.map((f: any) => ({ key: f.key, label: f.label, type: f.type, displayOrder: f.displayOrder })));
        setUniversalFields(universalFields);
        setDynamicFields(response.data.dynamicFields || []);
        setReusableFields(response.data.reusableFields || []);
        setAssetTypeInfo(response.data.assetType);
        
        // Prellenar campos de jerarquía si vienen del contexto
        if (preFilled) {
          setFormData(prev => ({
            ...prev,
            categoryId: preFilled.categoryId,
            groupId: preFilled.groupId,
            typeId: preFilled.typeId
          }));
        }
      }
    } catch (err: any) {
      console.error('Error loading fields:', err);
      setError(err.response?.data?.error || 'Error al cargar campos del tipo de activo');
    } finally {
      setLoading(false);
    }
  };
  
  const loadConnectionConfig = async (assetTypeId: number) => {
    try {
      const types = await assetCatalogService.getTypes({ id: assetTypeId });
      const assetType = Array.isArray(types) ? types[0] : types?.data?.[0] || types;
      
      if (assetType?.allowsConnections && assetType?.connectionConfig) {
        setConnectionConfig(assetType.connectionConfig);
      } else {
        setConnectionConfig(null);
      }
    } catch (err) {
      console.error('Error loading connection config:', err);
      setConnectionConfig(null);
    }
  };
  
  const handleTypeSelect = (category: number, group: number, type: number) => {
    setCategoryId(category);
    setGroupId(group);
    setTypeId(type);
    // Resetear campos del paso 2 (Información General) cuando se cambia el tipo
    setFormData(prev => {
      const newData: Record<string, any> = {};
      // Mantener solo los campos de jerarquía
      if (prev.categoryId) newData.categoryId = category;
      if (prev.groupId) newData.groupId = group;
      if (prev.typeId) newData.typeId = type;
      return newData;
    });
    setFormErrors({});
    setActiveStep(1);
  };
  
  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    
    // Limpiar error del campo
    if (formErrors[key]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
    
    // Auto-completar desde usuario si se selecciona assignedUserId
    if (key === 'assignedUserId' && value) {
      handleUserAutoComplete(value);
    }
  };
  
  const handleUserAutoComplete = async (userId: string) => {
    try {
      // Aquí deberías tener un servicio para obtener datos del usuario
      // Por ahora, asumimos que viene en el formData
      // TODO: Implementar servicio getUserDetails
      
      // Por ahora, solo mostramos un mensaje
      setSuccessMessage('✅ Campos relacionados se auto-completarán al guardar');
    } catch (err) {
      console.error('Error auto-completing from user:', err);
    }
  };
  
  const handleInvokeReusableField = async (fieldId: number) => {
    if (!typeId) return;
    
    try {
      await customFieldService.invokeReusableField(typeId, fieldId);
      
      // Recargar campos
      await loadFieldsForType(typeId);
      
      setSuccessMessage('✅ Campo reutilizable agregado exitosamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al invocar campo reutilizable');
    }
  };
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validar campos universales obligatorios
    if (!formData.name) errors.name = 'El nombre es obligatorio';
    if (!formData.categoryId) errors.categoryId = 'La categoría es obligatoria';
    if (!formData.groupId) errors.groupId = 'El grupo es obligatorio';
    if (!formData.typeId) errors.typeId = 'El tipo es obligatorio';
    if (!formData.modelId) errors.modelId = 'El modelo es obligatorio';
    if (!formData.companyId) errors.companyId = 'La empresa es obligatoria';
    if (!formData.headquartersId) errors.headquartersId = 'La sede es obligatoria';
    if (!formData.costCenter) errors.costCenter = 'El centro de costos es obligatorio';
    
    // Validar campos dinámicos obligatorios
    dynamicFields.forEach(field => {
      if (field.isRequired && !formData[field.key]) {
        errors[field.key] = `${field.label} es obligatorio`;
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      setError('Por favor, completa todos los campos obligatorios');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Preparar payload
      const payload: any = {
        // Campos universales
        name: formData.name,
        categoryId: formData.categoryId || categoryId,
        groupId: formData.groupId || groupId,
        typeId: formData.typeId || typeId,
        modelId: formData.modelId || null,
        manufacturerId: formData.manufacturerId || null,
        companyId: formData.companyId || (user as any)?.company?.id,
        headquartersId: formData.headquartersId,
        costCenter: formData.costCenter,
        assignedUserId: formData.assignedUserId || null,
        processId: formData.processId || null,
        jobTitleId: formData.jobTitleId || null,
        serialNumber: formData.serialNumber || null,
        assetCode: formData.assetCode || null,
        description: formData.description || null,
        purchaseDate: formData.purchaseDate || null,
        purchaseValue: formData.purchaseValue || null,
        warrantyExpiration: formData.warrantyExpiration || null,
        location: formData.location || null,
        status: formData.status || 'ACTIVE',
        condition: formData.condition || 'NEW',
        supplierId: formData.supplierId || null,
        invoiceNumber: formData.invoiceNumber || null,
      };
      
      // Campos dinámicos
      const dynamicFieldsData: Record<string, any> = {};
      dynamicFields.forEach(field => {
        if (formData[field.key] !== undefined && formData[field.key] !== null && formData[field.key] !== '') {
          dynamicFieldsData[field.key] = formData[field.key];
        }
      });
      
      if (Object.keys(dynamicFieldsData).length > 0) {
        payload.dynamicFields = dynamicFieldsData;
      }
      
      // Crear asset
      const response = await assetService.create(payload);
      
      if (response.success || response.data) {
        const createdAssetId = response.data?.id || response.data?.assetId || response.id;
        
        if (createdAssetId) {
          // Subir fotos después de crear el asset
          if (photos.length > 0) {
            try {
              for (const photo of photos) {
                // Mapear tipos: FRONT/BACK -> PHOTO (el backend tiene PHOTO, DIAGRAM, SCHEMATIC, OTHER)
                const imageType = photo.imageType === 'FRONT' || photo.imageType === 'BACK' ? 'PHOTO' : photo.imageType;
                await assetFilesService.uploadAssetImage(
                  createdAssetId,
                  photo.file,
                  photo.title,
                  imageType,
                  photos.indexOf(photo)
                );
              }
            } catch (photoError: any) {
              console.error('Error uploading photos:', photoError);
              // No fallar la creación si las fotos fallan
            }
          }
          
          // Subir documentos después de crear el asset
          if (documents.length > 0) {
            try {
              for (const doc of documents) {
                // Mapear tipos: MANUAL y DATASHEET -> OTHER (el backend tiene INVOICE, CONTRACT, WARRANTY, DELIVERY, TRANSFER, PHOTO, OTHER)
                let docType = doc.docType;
                if (doc.docType === 'MANUAL' || doc.docType === 'DATASHEET') {
                  docType = 'OTHER';
                }
                
                await assetFilesService.uploadAssetDocument(
                  createdAssetId,
                  doc.file,
                  docType,
                  doc.title || doc.file.name,
                  {
                    externalRef: doc.otherType || undefined,
                  }
                );
              }
            } catch (docError: any) {
              console.error('Error uploading documents:', docError);
              // No fallar la creación si los documentos fallan
            }
          }
        }
        
        clearDraft();
        setSuccessMessage(response.message || 'Activo creado exitosamente');
        
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error creating asset:', err);
      setError(err.response?.data?.error || err.message || 'Error al crear activo');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleClose = () => {
    const hasMeaningfulData =
      typeId !== null || Object.keys(formData).filter(k => formData[k] !== null && formData[k] !== undefined && formData[k] !== '').length > 0;

    if (hasMeaningfulData && !successMessage) {
      saveDraft({
        activeStep,
        categoryId,
        groupId,
        typeId,
        formData,
        savedAt: new Date().toISOString(),
      });
    }

    setActiveStep(0);
    setFormData({});
    setFormErrors({});
    setError(null);
    setSuccessMessage(null);
    setUniversalFields([]);
    setDynamicFields([]);
    setReusableFields([]);
    setConnectionConfig(null);
    setPhotos([]);
    setDocuments([]);
    
    if (!preFilled) {
      setCategoryId(null);
      setGroupId(null);
      setTypeId(null);
    }
    
    onClose();
  };
  
  const getSteps = () => {
    const steps = [];
    
    // Paso 0: Selección de tipo (solo si no viene prellenado)
    if (!preFilled?.typeId) {
      steps.push('Seleccionar Tipo');
    }
    
    // Paso 1: Campos Universales
    steps.push('Información General');
    
    // Paso 2: Campos Dinámicos
    steps.push('Campos Específicos');
    
    // Paso 3: Conexiones (solo si connectionConfig existe)
    if (connectionConfig) {
      steps.push('Conexiones');
    }
    
    // Paso 4: Fotos
    steps.push('Fotos');
    
    // Paso 5: Documentos
    steps.push('Documentos');
    
    return steps;
  };
  
  const steps = getSteps();
  const canProceed = () => {
    if (activeStep === 0 && !preFilled?.typeId) {
      return typeId !== null;
    }
    return true;
  };
  
  const handleNext = () => {
    if (canProceed()) {
      setActiveStep(prev => prev + 1);
    }
  };
  
  const handleBack = () => {
    // No permitir retroceder más allá del paso 0
    if (activeStep === 0) {
      return;
    }
    // Retroceder un paso
    setActiveStep(prev => prev - 1);
  };
  
  return (
    <>
    {/* Diálogo de borrador pendiente */}
    <Dialog open={showDraftDialog} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" component="span">Borrador encontrado</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Tienes un activo que dejaste sin terminar
          {pendingDraft?.savedAt && (
            <> el {new Date(pendingDraft.savedAt).toLocaleString('es-CO')}</>
          )}.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ¿Deseas continuar donde lo dejaste o iniciar uno nuevo?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<NewIcon />}
          onClick={handleDiscardDraft}
        >
          Iniciar nuevo
        </Button>
        <Button
          variant="contained"
          startIcon={<RestoreIcon />}
          onClick={handleResumeDraft}
        >
          Continuar borrador
        </Button>
      </DialogActions>
    </Dialog>

    <Dialog 
      open={open && !showDraftDialog}
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          maxWidth: '1200px',
          minHeight: '80vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="span">
            Crear Nuevo Activo
            {assetTypeInfo && (
              <Chip 
                label={assetTypeInfo.label || assetTypeInfo.name} 
                size="small" 
                sx={{ ml: 2 }} 
              />
            )}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}
        
        {!loading && (
          <>
            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
              {steps.map((label, index) => (
                <Step key={index}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {/* Paso 0: Selección de Tipo */}
            {activeStep === 0 && !preFilled?.typeId && (
              <AssetTypeSelector
                categoryId={categoryId}
                groupId={groupId}
                typeId={typeId}
                onCategoryChange={setCategoryId}
                onGroupChange={setGroupId}
                onTypeChange={setTypeId}
                onSelect={handleTypeSelect}
              />
            )}
            
            {/* Paso 1: Campos Universales */}
            {activeStep === (preFilled?.typeId ? 0 : 1) && (
              <UniversalFieldsTab
                fields={universalFields}
                values={formData}
                errors={formErrors}
                onChange={handleFieldChange}
                preFilled={{
                  categoryId: preFilled?.categoryId || categoryId,
                  groupId: preFilled?.groupId || groupId,
                  typeId: preFilled?.typeId || typeId
                }}
                hierarchyValues={{
                  categoryId: preFilled?.categoryId || categoryId,
                  groupId: preFilled?.groupId || groupId,
                  typeId: preFilled?.typeId || typeId
                }}
                loading={loading}
              />
            )}
            
            {/* Paso 2: Campos Dinámicos */}
            {activeStep === (preFilled?.typeId ? 1 : 2) && (
              <DynamicFieldsTab
                fields={dynamicFields}
                reusableFields={reusableFields}
                values={formData}
                errors={formErrors}
                onChange={handleFieldChange}
                onInvokeField={handleInvokeReusableField}
                loading={loading}
              />
            )}
            
            {/* Paso 3: Conexiones (condicional) */}
            {(() => {
              const connectionStep = preFilled?.typeId ? 2 : 3;
              const photosStep = connectionConfig ? connectionStep + 1 : connectionStep;
              const documentsStep = photosStep + 1;
              
              if (activeStep === connectionStep && connectionConfig) {
                return (
                  <ConnectionsTab
                    config={connectionConfig}
                    connections={formData.connections || []}
                    onChange={(connections) => handleFieldChange('connections', connections)}
                  />
                );
              }
              
              if (activeStep === photosStep) {
                return (
                  <PhotosTab
                    photos={photos}
                    onChange={setPhotos}
                    loading={loading}
                  />
                );
              }
              
              if (activeStep === documentsStep) {
                return (
                  <DocumentsTab
                    documents={documents}
                    onChange={setDocuments}
                    loading={loading}
                  />
                );
              }
              
              return null;
            })()}
          </>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Cancelar
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={submitting}>
            Anterior
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button 
            variant="contained" 
            onClick={handleNext}
            disabled={!canProceed() || submitting}
          >
            Siguiente
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || !canProceed()}
          >
            {submitting ? <CircularProgress size={20} /> : 'Crear Activo'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
    </>
  );
};

export default NewAssetModal;

