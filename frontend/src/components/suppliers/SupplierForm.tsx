import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import ModalHeader from '../common/ModalHeader';
import api from '../../config/api';
import { useAuth } from '../../hooks/useAuth';
import UnifiedLocationSelectors, { LocationData } from '../common/UnifiedLocationSelectors';

interface Supplier {
  id: number;
  name: string;
  taxDocumentType: string;
  taxDocumentNumber: string;
  country: string;
  state: string;
  city: string;
  addressLine1?: string;
  addressLine2?: string;
  phone?: string;
  email?: string;
  contactName?: string;
  commentary?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface SupplierFormData {
  name: string;
  taxDocumentType: string;
  taxDocumentNumber: string;
  country: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  email: string;
  contactName: string;
  commentary: string;
  location?: LocationData; // Para el componente unificado
}

interface SupplierFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: SupplierFormData) => void;
  initialData?: Supplier | null;
  isEditMode?: boolean;
}

const SupplierForm: React.FC<SupplierFormProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  isEditMode = false,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [locationData, setLocationData] = useState<LocationData>({
    country: null,
    state: null,
    city: null,
  });
  
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    taxDocumentType: 'NIT',
    taxDocumentNumber: '',
    country: 'Colombia',
    state: '',
    city: '',
    addressLine1: '',
    addressLine2: '',
    phone: '',
    email: '',
    contactName: '',
    commentary: '',
  });

  const taxDocumentTypes = [
    { value: 'NIT', label: 'NIT (Colombia)' },
    { value: 'EIN', label: 'EIN (Estados Unidos)' },
    { value: 'RFC', label: 'RFC (México)' },
    { value: 'RUC', label: 'RUC (Perú, Ecuador, Paraguay)' },
    { value: 'RIF', label: 'RIF (Venezuela)' },
    { value: 'BN', label: 'BN (Canadá)' },
    { value: 'CIF', label: 'CIF (España)' },
    { value: 'CUIT', label: 'CUIT (Argentina)' }
  ];

  const countries = [
    'Colombia', 'Estados Unidos', 'México', 'Perú', 'Ecuador', 'Paraguay',
    'Venezuela', 'Canadá', 'España', 'Argentina', 'Brasil', 'Chile'
  ];

  const colombianStates = [
    'Antioquia', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas',
    'Caquetá', 'Cauca', 'Cesar', 'Córdoba', 'Cundinamarca', 'Chocó',
    'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander',
    'Quindío', 'Risaralda', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
    'Arauca', 'Casanare', 'Putumayo', 'San Andrés y Providencia', 'Amazonas',
    'Guainía', 'Guaviare', 'Vaupés', 'Vichada'
  ];

  useEffect(() => {
    if (initialData && isEditMode) {
      setFormData({
        name: initialData.name || '',
        taxDocumentType: initialData.taxDocumentType || 'NIT',
        taxDocumentNumber: initialData.taxDocumentNumber || '',
        country: initialData.country || 'Colombia',
        state: initialData.state || '',
        city: initialData.city || '',
        addressLine1: initialData.addressLine1 || '',
        addressLine2: initialData.addressLine2 || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        contactName: initialData.contactName || '',
        commentary: initialData.commentary || '',
      });
      
      // Inicializar locationData si hay datos
      if (initialData.country) {
        // Buscar país en react-country-state-city (simplificado)
        setLocationData({
          country: {
            id: initialData.country === 'Colombia' ? 48 : 0,
            name: initialData.country,
            iso2: initialData.country === 'Colombia' ? 'CO' : '',
          },
          state: initialData.state ? {
            id: 0, // Se cargará cuando se seleccione el estado
            name: initialData.state,
            state_code: '',
          } : null,
          city: initialData.city ? {
            id: 0,
            name: initialData.city,
          } : null,
        });
      }
    } else {
      setFormData({
        name: '',
        taxDocumentType: 'NIT',
        taxDocumentNumber: '',
        country: 'Colombia',
        state: '',
        city: '',
        addressLine1: '',
        addressLine2: '',
        phone: '',
        email: '',
        contactName: '',
        commentary: '',
      });
      setLocationData({
        country: null,
        state: null,
        city: null,
      });
    }
  }, [initialData, isEditMode, open]);
  
  // Sincronizar locationData con formData
  useEffect(() => {
    if (locationData.country) {
      setFormData(prev => ({
        ...prev,
        country: locationData.country?.name || '',
        state: locationData.state?.name || '',
        city: locationData.city?.name || '',
      }));
    }
  }, [locationData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'El nombre del proveedor es obligatorio' });
      return;
    }

    if (!formData.taxDocumentNumber.trim()) {
      setMessage({ type: 'error', text: 'El número de documento es obligatorio' });
      return;
    }

    // Validar ubicación
    if (!locationData.country) {
      setMessage({ type: 'error', text: 'El país es obligatorio' });
      return;
    }

    if (!locationData.state) {
      setMessage({ type: 'error', text: 'El estado/departamento es obligatorio' });
      return;
    }

    if (!locationData.city) {
      setMessage({ type: 'error', text: 'La ciudad es obligatoria' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      
      // Agregar companyId y sincronizar ubicación
      const dataToSave = {
        ...formData,
        country: locationData.country.name,
        state: locationData.state.name,
        city: locationData.city.name,
        companyId: (user as any)?.company?.id || (user as any)?.companyId,
      };
      
      await onSave(dataToSave);
      
      // Mostrar mensaje de éxito
      setMessage({ type: 'success', text: 'Proveedor guardado exitosamente' });
      
      // Cerrar después de un breve delay
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error: any) {
      console.error('Error al guardar proveedor:', error);
      setMessage({
        type: 'error',
        text: 'Error al guardar el proveedor: ' + (error.response?.data?.error || error.message || 'Error desconocido')
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setMessage(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth disableEnforceFocus>
      <ModalHeader
        title={isEditMode ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        onClose={handleClose}
        gradientColor="orange"
      />
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {message && (
            <Alert severity={message.type} sx={{ mb: 2 }}>
              {message.text}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Información Básica */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: PRIMARY.main }}>
                Información Básica
              </Typography>
            </Grid>

            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Nombre del Proveedor *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: PRIMARY.main },
                    '&.Mui-focused fieldset': { borderColor: PRIMARY.main }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Documento *</InputLabel>
                <Select
                  value={formData.taxDocumentType}
                  onChange={(e) => setFormData({ ...formData, taxDocumentType: e.target.value })}
                  label="Tipo de Documento *"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: PRIMARY.main },
                      '&.Mui-focused fieldset': { borderColor: PRIMARY.main }
                    }
                  }}
                >
                  {taxDocumentTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Número de Documento *"
                value={formData.taxDocumentNumber}
                onChange={(e) => setFormData({ ...formData, taxDocumentNumber: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: PRIMARY.main },
                    '&.Mui-focused fieldset': { borderColor: PRIMARY.main }
                  }
                }}
              />
            </Grid>

            {/* Ubicación Unificada */}
            <Grid item xs={12}>
              <UnifiedLocationSelectors
                locationValue={locationData}
                onLocationChange={setLocationData}
                phoneValue={formData.phone}
                onPhoneChange={(phone, countryCode) => {
                  setFormData(prev => ({ ...prev, phone }));
                }}
                required
                disabled={saving}
                showPhone={true}
                defaultCountry="CO"
                errors={{
                  country: message?.type === 'error' && message.text.includes('país') ? message.text : undefined,
                  state: message?.type === 'error' && message.text.includes('estado') ? message.text : undefined,
                  city: message?.type === 'error' && message.text.includes('ciudad') ? message.text : undefined,
                }}
                labels={{
                  country: 'País',
                  state: 'Estado/Departamento',
                  city: 'Ciudad',
                  phone: 'Teléfono',
                }}
              />
            </Grid>

            <Divider sx={{ my: 2, width: '100%' }} />

            {/* Información de Contacto */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: PRIMARY.main }}>
                Información de Contacto
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Dirección Línea 1"
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: PRIMARY.main },
                    '&.Mui-focused fieldset': { borderColor: PRIMARY.main }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Dirección Línea 2"
                value={formData.addressLine2}
                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: PRIMARY.main },
                    '&.Mui-focused fieldset': { borderColor: PRIMARY.main }
                  }
                }}
              />
            </Grid>

            {/* Teléfono ahora está en UnifiedLocationSelectors */}

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: PRIMARY.main },
                    '&.Mui-focused fieldset': { borderColor: PRIMARY.main }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre de Contacto"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: PRIMARY.main },
                    '&.Mui-focused fieldset': { borderColor: PRIMARY.main }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Comentarios"
                multiline
                rows={3}
                value={formData.commentary}
                onChange={(e) => setFormData({ ...formData, commentary: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: PRIMARY.main },
                    '&.Mui-focused fieldset': { borderColor: PRIMARY.main }
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={handleClose} 
            color="inherit"
            startIcon={<CancelIcon />}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{
              backgroundColor: PRIMARY.main,
              '&:hover': { backgroundColor: '#FF1493' }
            }}
          >
            {saving ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SupplierForm;

