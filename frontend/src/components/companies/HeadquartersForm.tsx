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
import { Headquarters } from '../../services/headquartersService';
import { Company } from '../../services/companyService';

interface HeadquartersFormData {
  name: string;
  companyId: number;
  country: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  email: string;
  commentary: string;
}

interface HeadquartersFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: HeadquartersFormData) => void;
  initialData?: Headquarters | null;
  isEditMode?: boolean;
  isBulkEdit?: boolean;
  selectedHeadquarters?: Headquarters[];
  companies: Company[];
}

const HeadquartersForm: React.FC<HeadquartersFormProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  isEditMode = false,
  isBulkEdit = false,
  selectedHeadquarters = [],
  companies,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState<HeadquartersFormData>({
    name: '',
    companyId: companies.length > 0 ? companies[0].id : 0,
    country: 'Colombia',
    state: '',
    city: '',
    addressLine1: '',
    addressLine2: '',
    phone: '',
    email: '',
    commentary: '',
  });

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
    if (!open) return; // Solo ejecutar cuando el modal está abierto
    
    if (isBulkEdit && selectedHeadquarters.length > 0) {
      // En modo bulk edit, inicializar con valores vacíos o valores comunes si todos tienen el mismo
      const firstHQ = selectedHeadquarters[0];
      const allSameCompany = selectedHeadquarters.every(h => h.companyId === firstHQ.companyId);
      const allSameCountry = selectedHeadquarters.every(h => (h.country || 'Colombia') === (firstHQ.country || 'Colombia'));
      const allSameState = selectedHeadquarters.every(h => h.state === firstHQ.state);
      const allSameStatus = selectedHeadquarters.every(h => (h.status || 'ACTIVE') === (firstHQ.status || 'ACTIVE'));
      
      setFormData({
        name: '', // No se edita en bulk edit
        companyId: allSameCompany ? (firstHQ.companyId || (companies.length > 0 ? companies[0].id : 0)) : (companies.length > 0 ? companies[0].id : 0),
        country: allSameCountry ? (firstHQ.country || 'Colombia') : 'Colombia',
        state: allSameState ? (firstHQ.state || '') : '',
        city: '',
        addressLine1: '',
        addressLine2: '',
        phone: '',
        email: '',
        commentary: '',
      });
    } else if (initialData && isEditMode) {
      setFormData({
        name: initialData.name || '',
        companyId: initialData.companyId || (companies.length > 0 ? companies[0].id : 0),
        country: initialData.country || 'Colombia',
        state: initialData.state || '',
        city: initialData.city || '',
        addressLine1: initialData.addressLine1 || '',
        addressLine2: initialData.addressLine2 || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        commentary: initialData.commentary || '',
      });
    } else {
      setFormData({
        name: '',
        companyId: companies.length > 0 ? companies[0].id : 0,
        country: 'Colombia',
        state: '',
        city: '',
        addressLine1: '',
        addressLine2: '',
        phone: '',
        email: '',
        commentary: '',
      });
    }
  }, [open, isBulkEdit, isEditMode, initialData?.id, selectedHeadquarters?.map(h => h.id).join(','), companies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBulkEdit) {
      // Validación para bulk edit: al menos un campo debe estar presente
      const hasChanges = formData.companyId || formData.country || formData.state || 
                         formData.city || formData.addressLine1 || formData.addressLine2 || 
                         formData.phone || formData.email || formData.commentary;
      
      if (!hasChanges) {
        setMessage({ type: 'error', text: 'Debe especificar al menos un campo para actualizar' });
        return;
      }
    } else {
      // Validación normal para edición/creación individual
      if (!formData.name.trim()) {
        setMessage({ type: 'error', text: 'El nombre de la sede es obligatorio' });
        return;
      }

      if (!formData.companyId) {
        setMessage({ type: 'error', text: 'Debe seleccionar una empresa' });
        return;
      }

      if (!formData.city.trim()) {
        setMessage({ type: 'error', text: 'La ciudad es obligatoria' });
        return;
      }
    }

    try {
      setSaving(true);
      setMessage(null);
      
      if (isBulkEdit && selectedHeadquarters.length > 0) {
        // Modo bulk edit: actualizar todos los headquarters seleccionados
        const payload: any = {};
        
        // Solo incluir campos que se quieren actualizar (si tienen valores)
        if (formData.companyId) {
          payload.companyId = formData.companyId;
        }
        if (formData.country) {
          payload.country = formData.country;
        }
        if (formData.state) {
          payload.state = formData.state;
        }
        if (formData.city) {
          payload.city = formData.city;
        }
        if (formData.addressLine1) {
          payload.addressLine1 = formData.addressLine1;
        }
        if (formData.addressLine2) {
          payload.addressLine2 = formData.addressLine2;
        }
        if (formData.phone) {
          payload.phone = formData.phone;
        }
        if (formData.email) {
          payload.email = formData.email;
        }
        if (formData.commentary) {
          payload.commentary = formData.commentary;
        }
        
        // Actualizar todos los headquarters seleccionados
        const updatePromises = selectedHeadquarters.map(async (hq) => {
          return api.put(`/headquarters/${hq.id}`, payload);
        });
        await Promise.all(updatePromises);
        setMessage({ type: 'success', text: `${selectedHeadquarters.length} sede(s) actualizada(s) exitosamente` });
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        await onSave(formData);
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Error al guardar: ' + (error.response?.data?.error || error.message)
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
        title={isBulkEdit ? `Editar ${selectedHeadquarters.length} Sedes` : (isEditMode ? 'Editar Sede' : 'Nueva Sede')}
        onClose={handleClose}
        gradientColor="Orange"
      />
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {isBulkEdit && selectedHeadquarters.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Estás editando {selectedHeadquarters.length} sede(s): {selectedHeadquarters.map(h => h.name).join(', ')}.
              <br />
              <strong>Nota:</strong> El campo "Nombre" no se puede editar en modo de edición masiva.
            </Alert>
          )}
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

            {!isBulkEdit && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre de la Sede *"
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
            )}

            <Grid item xs={12} md={isBulkEdit ? 12 : 6}>
              <FormControl fullWidth required={!isBulkEdit}>
                <InputLabel>Empresa {isBulkEdit ? '(opcional)' : '*'}</InputLabel>
                <Select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value as number })}
                  label={`Empresa ${isBulkEdit ? '(opcional)' : '*'}`}
                  disabled={isBulkEdit}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: PRIMARY.main },
                      '&.Mui-focused fieldset': { borderColor: PRIMARY.main }
                    }
                  }}
                >
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required={!isBulkEdit}>
                <InputLabel>País {isBulkEdit ? '(opcional)' : '*'}</InputLabel>
                <Select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  label={`País ${isBulkEdit ? '(opcional)' : '*'}`}
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

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required={!isBulkEdit}>
                <InputLabel>Estado/Departamento {isBulkEdit ? '(opcional)' : '*'}</InputLabel>
                <Select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  label={`Estado/Departamento ${isBulkEdit ? '(opcional)' : '*'}`}
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

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={`Ciudad ${isBulkEdit ? '(opcional)' : '*'}`}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required={!isBulkEdit}
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
              '&:hover': { backgroundColor: '#1976D2' }
            }}
          >
            {saving ? 'Guardando...' : (isBulkEdit ? 'Modificar' : (isEditMode ? 'Actualizar' : 'Crear'))}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default HeadquartersForm;
