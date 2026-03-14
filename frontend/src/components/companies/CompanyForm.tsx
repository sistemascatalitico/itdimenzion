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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import ModalHeader from '../common/ModalHeader';
import api from '../../config/api';
import { PRIMARY } from '../../theme/themeTokens';
import { Company } from '../../services/companyService';

interface CompanyFormData {
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
  website: string;
  commentary: string;
}

interface CompanyFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CompanyFormData) => void;
  initialData?: Company | null;
  isEditMode?: boolean;
}

const CompanyForm: React.FC<CompanyFormProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  isEditMode = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState<CompanyFormData>({
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
    website: '',
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
        website: initialData.website || '',
        commentary: initialData.commentary || '',
      });
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
        website: '',
        commentary: '',
      });
    }
  }, [initialData, isEditMode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'El nombre de la empresa es obligatorio' });
      return;
    }

    if (!formData.taxDocumentNumber.trim()) {
      setMessage({ type: 'error', text: 'El número de documento es obligatorio' });
      return;
    }

    if (!formData.city.trim()) {
      setMessage({ type: 'error', text: 'La ciudad es obligatoria' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      await onSave(formData);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Error al guardar la empresa: ' + (error.response?.data?.error || error.message)
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
        title={isEditMode ? 'Editar Empresa' : 'Nueva Empresa'}
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
                label="Nombre de la Empresa *"
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

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>País *</InputLabel>
                <Select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  label="País *"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: PRIMARY.main },
                      '&.Mui-focused fieldset': { borderColor: PRIMARY.main }
                    }
                  }}
                >
                  {countries.map((country) => (
                    <MenuItem key={country} value={country}>
                      {country}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Estado/Departamento *</InputLabel>
                <Select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  label="Estado/Departamento *"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: PRIMARY.main },
                      '&.Mui-focused fieldset': { borderColor: PRIMARY.main }
                    }
                  }}
                >
                  {formData.country === 'Colombia' ? (
                    colombianStates.map((state) => (
                      <MenuItem key={state} value={state}>
                        {state}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="Otro">Otro</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ciudad *"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: PRIMARY.main },
                    '&.Mui-focused fieldset': { borderColor: PRIMARY.main }
                  }
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

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                label="Sitio Web"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
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

export default CompanyForm;
