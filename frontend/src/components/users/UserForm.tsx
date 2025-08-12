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
  DialogActions,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import api from '../../config/api';
import CompactPhoneInput from '../common/CompactPhoneInput';
import SecureLocationSelectors from '../common/SecureLocationSelectors';
import { COLOMBIA_COMPLETE_DATA } from '../../data/colombiaCities';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  documentNumber: string;
  documentType: string;
  phone: string;
  role: string;
  isActive: boolean;
  contactEmail?: string;
  addressLine1?: string;
  addressLine2?: string;
  residenceCountry?: string;
  residenceState?: string;
  residenceCity?: string;
  company?: {
    id: string;
    name: string;
  };
  headquarters?: {
    id: string;
  name: string;
  };
  process?: {
    id: string;
  name: string;
  };
  jobTitle?: {
    id: string;
  name: string;
  };
}

interface LocationData {
  country: string;
  state: string;
  city: string;
  countryName?: string;
  stateName?: string;
}

interface UserFormProps {
  initialData?: User | null;
  onCancel: () => void;
  onSave: () => void;
  isEditMode: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onCancel,
  onSave,
  isEditMode,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    documentNumber: '',
    documentType: '',
    phone: '',
    role: '',
    isActive: true,
    contactEmail: '',
    addressLine1: '',
    addressLine2: '',
    residenceCountry: '',
    residenceState: '',
    residenceCity: '',
    password: '',
    confirmPassword: '',
  });

  const [locationData, setLocationData] = useState<LocationData>({
    country: '',
    state: '',
    city: '',
  });

  const [options, setOptions] = useState({
    documentTypes: [
      { value: 'CEDULA', label: 'Cédula de Ciudadanía' },
      { value: 'CEDULA_EXTRANJERIA', label: 'Cédula de Extranjería' },
      { value: 'TARJETA_IDENTIDAD', label: 'Tarjeta de Identidad' },
      { value: 'PASSPORT', label: 'Pasaporte' },
      { value: 'NIT', label: 'NIT' },
      { value: 'RUT', label: 'RUT' },
    ],
    roles: [
      { value: 'SUPER_ADMIN', label: 'Super Administrador' },
      { value: 'ADMIN', label: 'Administrador' },
      { value: 'SUPERVISOR', label: 'Supervisor' },
      { value: 'USER', label: 'Usuario' },
    ],
  });

  useEffect(() => {
    if (initialData) {
      // Normalización de ubicación para valores existentes
      const normalizeCountry = (c?: string) => {
        if (!c) return '';
        const v = String(c).toUpperCase();
        if (v === 'CO' || v === 'COLOMBIA') return 'CO';
        if (v === 'US' || v === 'USA' || v === 'ESTADOS UNIDOS') return 'US';
        return c as string;
      };

      const normalizeStateForCO = (s?: string) => {
        if (!s) return '';
        const upper = String(s).toUpperCase();
        const byId = COLOMBIA_COMPLETE_DATA.find(st => st.id.toUpperCase() === upper);
        if (byId) return byId.id;
        const byName = COLOMBIA_COMPLETE_DATA.find(st => st.name.toUpperCase() === upper);
        return byName ? byName.id : (s as string);
      };

      const normalizedCountry = normalizeCountry(initialData.residenceCountry);
      const normalizedState = normalizedCountry === 'CO' ? normalizeStateForCO((initialData as any).residenceState || (initialData as any).state) : ((initialData as any).residenceState || (initialData as any).state || '');
      
      setFormData({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        email: initialData.email || '',
        username: initialData.username || '',
        documentNumber: initialData.documentNumber || '',
        documentType: initialData.documentType || '',
        phone: initialData.phone || '',
        role: initialData.role || '',
        isActive: initialData.isActive,
        contactEmail: initialData.contactEmail || initialData.email || '',
        addressLine1: initialData.addressLine1 || '',
        addressLine2: initialData.addressLine2 || '',
        residenceCountry: normalizedCountry,
        residenceState: normalizedState,
        residenceCity: (initialData as any).residenceCity || (initialData as any).city || '',
        password: '',
        confirmPassword: '',
      });

      setLocationData({
        country: normalizedCountry,
        state: normalizedState,
        city: (initialData as any).residenceCity || (initialData as any).city || '',
      });
    }
  }, [initialData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhoneChange = (phone: string) => {
    setFormData(prev => ({
      ...prev,
      phone
    }));
  };

  const handleLocationChange = (location: LocationData) => {
    setLocationData(location);
    setFormData(prev => ({
      ...prev,
      residenceCountry: location.country,
      residenceState: location.state,
      residenceCity: location.city,
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.firstName.trim()) errors.push('El nombre es obligatorio');
    if (!formData.lastName.trim()) errors.push('El apellido es obligatorio');
    if (!formData.email.trim()) errors.push('El email es obligatorio');
    if (!formData.documentNumber.trim()) errors.push('El número de documento es obligatorio');
    if (!formData.documentType) errors.push('El tipo de documento es obligatorio');
    if (!formData.role) errors.push('El rol es obligatorio');

    if (!isEditMode) {
      if (!formData.username.trim()) errors.push('El nombre de usuario es obligatorio');
      if (!formData.password) errors.push('La contraseña es obligatoria');
      if (formData.password !== formData.confirmPassword) {
        errors.push('Las contraseñas no coinciden');
      }
    }

    if (errors.length > 0) {
      setMessage({ type: 'error', text: errors.join(', ') });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    setMessage(null);

    try {
      // Preparar payload solo con campos soportados por el backend
      const userData: any = {
        documentNumber: formData.documentNumber,
        documentType: formData.documentType,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        contactEmail: formData.contactEmail || null,
        phone: formData.phone || null,
        username: formData.username || null,
        role: formData.role,
        status: formData.isActive ? 'ACTIVE' : 'INACTIVE',
        addressLine1: formData.addressLine1 || null,
        addressLine2: formData.addressLine2 || null,
        residenceCountry: locationData.country || null,
        residenceState: locationData.state || null,
        residenceCity: locationData.city || null,
      };

      if (isEditMode) {
        // Remove password fields for edit mode
        await api.put(`/users/${initialData?.documentNumber}`, userData);
      } else {
        userData.password = formData.password;
        await api.post('/users', userData);
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving user:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al guardar usuario' 
      });
    } finally {
      setSaving(false);
    }
  };

  const fieldStyles = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#fff',
      borderRadius: 2,
      '& fieldset': {
        borderColor: 'rgba(0, 0, 0, 0.23)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(0, 0, 0, 0.4)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#FF69B4',
        boxShadow: '0 0 0 2px rgba(255, 105, 180, 0.2)',
      },
      '& input': {
        color: '#1f1f1f',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(0, 0, 0, 0.6)',
      '&.Mui-focused': {
        color: '#FF69B4',
      },
    },
  };

  const disabledFieldStyles = {
    ...fieldStyles,
    '& .MuiOutlinedInput-root': {
      ...fieldStyles['& .MuiOutlinedInput-root'],
      backgroundColor: '#f5f5f5',
    },
  };

  return (
    <Box sx={{ p: 3 }}>
      {message && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 3 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Información Personal */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
                Información Personal
              </Typography>
          </Grid>
              
          <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
              label="Nombre"
                    value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              required
              sx={fieldStyles}
              id="firstName"
              name="firstName"
              autoComplete="given-name"
                  />
                </Grid>

          <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
              label="Apellido"
                    value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              required
              sx={fieldStyles}
              id="lastName"
              name="lastName"
              autoComplete="family-name"
                  />
                </Grid>

          <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              sx={fieldStyles}
              id="email"
              name="email"
              autoComplete="email"
                  />
                </Grid>

          <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
              label="Correo de Contacto"
                    type="email"
              value={formData.contactEmail}
              onChange={(e) => handleInputChange('contactEmail', e.target.value)}
              sx={fieldStyles}
              id="contactEmail"
              name="contactEmail"
              autoComplete="email"
                  />
                </Grid>

          <Grid item xs={12} sm={6}>
            <CompactPhoneInput
              value={formData.phone}
              onChange={handlePhoneChange}
                    label="Teléfono"
                  />
                </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="role-label">Rol</InputLabel>
                    <Select
                labelId="role-label"
                id="role"
                name="role"
                value={formData.role}
                label="Rol"
                onChange={(e) => handleInputChange('role', e.target.value)}
                sx={fieldStyles}
              >
                {options.roles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
              Documento de Identidad
            </Typography>
                </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="document-type-label">Tipo de Documento</InputLabel>
                    <Select
                labelId="document-type-label"
                id="documentType"
                name="documentType"
                value={options.documentTypes.some(dt => dt.value === formData.documentType) ? formData.documentType : ''}
                label="Tipo de Documento"
                onChange={(e) => handleInputChange('documentType', e.target.value)}
                sx={fieldStyles}
              >
                {options.documentTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Número de Documento"
              value={formData.documentNumber}
              onChange={(e) => handleInputChange('documentNumber', e.target.value)}
              required
              disabled={isEditMode}
              sx={isEditMode ? disabledFieldStyles : fieldStyles}
              id="documentNumber"
              name="documentNumber"
              autoComplete="off"
            />
              </Grid>

          <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
              label="Nombre de Usuario"
                    value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              required={!isEditMode}
                    disabled={isEditMode}
              sx={isEditMode ? disabledFieldStyles : fieldStyles}
              id="username"
              name="username"
              autoComplete="username"
                  />
                </Grid>

          {!isEditMode && (
            <>
              <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                  label="Contraseña"
                  type="password"
                        value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  sx={fieldStyles}
                  id="password"
                  name="password"
                  autoComplete="new-password"
                      />
                    </Grid>

              <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                  label="Confirmar Contraseña"
                  type="password"
                        value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                  sx={fieldStyles}
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                      />
                    </Grid>
                  </>
                )}

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
              Dirección
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Dirección Línea 1"
              value={formData.addressLine1}
              onChange={(e) => handleInputChange('addressLine1', e.target.value)}
              sx={fieldStyles}
              id="addressLine1"
              name="addressLine1"
              autoComplete="address-line1"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
                      fullWidth
              label="Dirección Línea 2"
              value={formData.addressLine2}
              onChange={(e) => handleInputChange('addressLine2', e.target.value)}
              sx={fieldStyles}
              id="addressLine2"
              name="addressLine2"
              autoComplete="address-line2"
            />
          </Grid>

          <Grid item xs={12}>
            <SecureLocationSelectors
              value={locationData}
              onChange={handleLocationChange}
              label="Ubicación"
              enableDynamicLoading={false}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
              Estado del Usuario
            </Typography>
                  </Grid>

          <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
              <InputLabel id="status-label">Estado</InputLabel>
                    <Select
                labelId="status-label"
                id="isActive"
                name="isActive"
                value={formData.isActive ? 'active' : 'inactive'}
                label="Estado"
                onChange={(e) => handleInputChange('isActive', e.target.value === 'active' ? 'true' : 'false')}
                sx={fieldStyles}
              >
                <MenuItem value="active">Activo</MenuItem>
                <MenuItem value="inactive">Inactivo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

        <DialogActions sx={{ mt: 4, px: 0 }}>
              <Button
            onClick={onCancel}
            startIcon={<CancelIcon />}
                variant="outlined"
            sx={{
              borderColor: '#FF6B6B',
              color: '#FF6B6B',
              '&:hover': {
                borderColor: '#FF5A5A',
                backgroundColor: 'rgba(255, 107, 107, 0.04)',
              },
            }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={saving}
            sx={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)',
              color: 'white',
              px: 4,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #FF5A5A 0%, #FF7D5A 100%)',
              },
              '&:disabled': {
                background: '#ccc',
              },
            }}
          >
            {saving ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear')}
              </Button>
        </DialogActions>
      </form>
    </Box>
  );
};

export default UserForm;
