import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import SimplePhoneInput from '../common/SimplePhoneInput';
import SecureLocationSelectors from '../common/SecureLocationSelectors';

// Types
interface Company {
  id: number;
  name: string;
  nit: string;
}

interface Country {
  id: number;
  name: string;
  code: string;
}

interface State {
  id: number;
  name: string;
  code: string;
  countryId: number;
}

interface City {
  id: number;
  name: string;
  stateId: number;
}

interface HeadquartersFormData {
  name: string;
  companyId: number;
  description?: string;
  address?: string;
  cityId?: number;
  stateId?: number;
  countryId?: number;
  phone?: string;
  email?: string;
  code?: string;
  autoGenerateCode: boolean;
}

interface HeadquartersFormProps {
  initialData?: Partial<HeadquartersFormData>;
  onSubmit: (data: HeadquartersFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .required('El nombre de la sede es obligatorio'),
  companyId: Yup.number()
    .required('Debe seleccionar una empresa'),
  email: Yup.string()
    .email('Email inválido')
    .optional(),
  phone: Yup.string()
    .matches(/^[\d\s\+\-\(\)]{7,20}$/, 'Formato de teléfono inválido')
    .optional(),
  code: Yup.string()
    .min(2, 'El código debe tener al menos 2 caracteres')
    .max(10, 'El código no puede exceder 10 caracteres')
    .when('autoGenerateCode', {
      is: false,
      then: (schema) => schema.required('El código es obligatorio cuando no se genera automáticamente')
    })
});

const HeadquartersForm: React.FC<HeadquartersFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  // State for dropdown data
  const [companies, setCompanies] = useState<Company[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const formik = useFormik<HeadquartersFormData>({
    initialValues: {
      name: initialData?.name || '',
      companyId: initialData?.companyId || 0,
      description: initialData?.description || '',
      address: initialData?.address || '',
      cityId: initialData?.cityId || undefined,
      stateId: initialData?.stateId || undefined,
      countryId: initialData?.countryId || undefined,
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      code: initialData?.code || '',
      autoGenerateCode: !initialData?.code // Si hay código inicial, no auto-generar
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        // Auto-generate code if requested
        if (values.autoGenerateCode && values.companyId) {
          const company = companies.find(c => c.id === values.companyId);
          const companyCode = company?.name.substring(0, 3).toUpperCase() || 'HQ';
          const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          values.code = `${companyCode}-${randomNum}`;
        }
        
        await onSubmit(values);
      } catch (error) {
        console.error('Error submitting form:', error);
      }
    }
  });

  // Load initial data
  useEffect(() => {
    loadCompanies();
    loadCountries();
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (formik.values.countryId) {
      loadStates(formik.values.countryId);
    } else {
      setStates([]);
      setCities([]);
    }
  }, [formik.values.countryId]);

  // Load cities when state changes
  useEffect(() => {
    if (formik.values.stateId) {
      loadCities(formik.values.stateId);
    } else {
      setCities([]);
    }
  }, [formik.values.stateId]);

  const loadCompanies = async () => {
    try {
      // TODO: Replace with actual API call
      const mockCompanies: Company[] = [
        { id: 1, name: 'ITDimenzion SAS', nit: '900123456-1' },
        { id: 2, name: 'TechCorp Colombia', nit: '800987654-2' },
        { id: 3, name: 'InnovaTech SA', nit: '700555444-3' }
      ];
      setCompanies(mockCompanies);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const loadCountries = async () => {
    try {
      // TODO: Replace with actual API call
      const mockCountries: Country[] = [
        { id: 1, name: 'Colombia', code: 'CO' },
        { id: 2, name: 'United States', code: 'US' }
      ];
      setCountries(mockCountries);
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  };

  const loadStates = async (countryId: number) => {
    try {
      // TODO: Replace with actual API call
      const mockStates: State[] = countryId === 1 ? [
        { id: 1, name: 'Antioquia', code: 'ANT', countryId: 1 },
        { id: 2, name: 'Cundinamarca', code: 'CUN', countryId: 1 },
        { id: 3, name: 'Valle del Cauca', code: 'VAL', countryId: 1 }
      ] : [
        { id: 4, name: 'California', code: 'CA', countryId: 2 },
        { id: 5, name: 'Texas', code: 'TX', countryId: 2 },
        { id: 6, name: 'Florida', code: 'FL', countryId: 2 }
      ];
      setStates(mockStates);
    } catch (error) {
      console.error('Error loading states:', error);
    }
  };

  const loadCities = async (stateId: number) => {
    try {
      // TODO: Replace with actual API call
      const mockCities: City[] = stateId === 1 ? [
        { id: 1, name: 'Medellín', stateId: 1 },
        { id: 2, name: 'Bello', stateId: 1 },
        { id: 3, name: 'Itagüí', stateId: 1 }
      ] : stateId === 2 ? [
        { id: 4, name: 'Bogotá', stateId: 2 },
        { id: 5, name: 'Chía', stateId: 2 },
        { id: 6, name: 'Zipaquirá', stateId: 2 }
      ] : [
        { id: 7, name: 'Cali', stateId: 3 },
        { id: 8, name: 'Palmira', stateId: 3 },
        { id: 9, name: 'Buenaventura', stateId: 3 }
      ];
      setCities(mockCities);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Card elevation={2}>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h5" component="h1">
              {initialData ? 'Editar Sede' : 'Crear Nueva Sede'}
            </Typography>
          </Box>

          {initialData?.companyId && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Esta sede será creada para la empresa seleccionada. 
              Asegúrate de que todos los datos sean correctos.
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit}>
            {/* Basic Info */}
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Información Básica
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Empresa *</InputLabel>
                  <Select
                    name="companyId"
                    value={formik.values.companyId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Empresa *"
                    error={formik.touched.companyId && Boolean(formik.errors.companyId)}
                  >
                    <MenuItem value={0}>Seleccionar empresa...</MenuItem>
                    {companies.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.name} ({company.nit})
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.companyId && formik.errors.companyId && (
                    <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                      {formik.errors.companyId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  name="name"
                  label="Nombre de la Sede *"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.autoGenerateCode}
                        onChange={(e) => formik.setFieldValue('autoGenerateCode', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Auto-generar código"
                  />
                  {!formik.values.autoGenerateCode && (
                    <TextField
                      fullWidth
                      name="code"
                      label="Código de Sede *"
                      value={formik.values.code}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.code && Boolean(formik.errors.code)}
                      helperText={formik.touched.code && formik.errors.code}
                      sx={{ mt: 1 }}
                    />
                  )}
                  {formik.values.autoGenerateCode && formik.values.companyId > 0 && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Se generará automáticamente: {companies.find(c => c.id === formik.values.companyId)?.name.substring(0, 3).toUpperCase() || 'HQ'}-XXX
                    </Alert>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="description"
                  label="Descripción"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Contact Info */}
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Información de Contacto
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="email"
                  label="Email"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="phone"
                  label="Teléfono"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.phone && Boolean(formik.errors.phone)}
                  helperText={formik.touched.phone && formik.errors.phone}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Geographic Location */}
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Ubicación
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>País</InputLabel>
                  <Select
                    name="countryId"
                    value={formik.values.countryId || ''}
                    onChange={formik.handleChange}
                    label="País"
                  >
                    {countries.map((country) => (
                      <MenuItem key={country.id} value={country.id}>
                        {country.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Departamento/Estado</InputLabel>
                  <Select
                    name="stateId"
                    value={formik.values.stateId || ''}
                    onChange={formik.handleChange}
                    label="Departamento/Estado"
                    disabled={!formik.values.countryId}
                  >
                    {states.map((state) => (
                      <MenuItem key={state.id} value={state.id}>
                        {state.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Ciudad</InputLabel>
                  <Select
                    name="cityId"
                    value={formik.values.cityId || ''}
                    onChange={formik.handleChange}
                    label="Ciudad"
                    disabled={!formik.values.stateId}
                  >
                    {cities.map((city) => (
                      <MenuItem key={city.id} value={city.id}>
                        {city.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="address"
                  label="Dirección"
                  value={formik.values.address}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={isLoading}
                startIcon={<CancelIcon />}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                startIcon={<SaveIcon />}
              >
                {isLoading ? 'Guardando...' : 'Guardar Sede'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default HeadquartersForm;