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
  Autocomplete,
  Divider,
  IconButton,
  Paper,
  Alert,
  FormHelperText
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
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

interface Headquarters {
  id?: number;
  name: string;
  description?: string;
  address?: string;
  cityId?: number;
  stateId?: number;
  countryId?: number;
  phone?: string;
  email?: string;
  code?: string;
}

interface CompanyFormData {
  name: string;
  nit: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  cityId?: number;
  stateId?: number;
  countryId?: number;
  website?: string;
  headquarters: Headquarters[];
}

interface CompanyFormProps {
  initialData?: Partial<CompanyFormData>;
  onSubmit: (data: CompanyFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .required('El nombre de la empresa es obligatorio'),
  nit: Yup.string()
    .matches(/^\\d{9,11}$/, 'El NIT debe tener entre 9 y 11 dígitos')
    .required('El NIT es obligatorio'),
  email: Yup.string()
    .email('Email inválido')
    .optional(),
  phone: Yup.string()
    .matches(/^[\\d\\s\\+\\-\\(\\)]{7,20}$/, 'Formato de teléfono inválido')
    .optional(),
  website: Yup.string()
    .url('URL inválida')
    .optional(),
  headquarters: Yup.array().of(
    Yup.object({
      name: Yup.string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .required('El nombre de la sede es obligatorio'),
      email: Yup.string()
        .email('Email inválido')
        .optional(),
      phone: Yup.string()
        .matches(/^[\\d\\s\\+\\-\\(\\)]{7,20}$/, 'Formato de teléfono inválido')
        .optional(),
    })
  )
});

const CompanyForm: React.FC<CompanyFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  // State for geography data
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [headquartersStates, setHeadquartersStates] = useState<{ [key: number]: State[] }>({});
  const [headquartersCities, setHeadquartersCities] = useState<{ [key: number]: City[] }>({});

  const formik = useFormik<CompanyFormData>({
    initialValues: {
      name: initialData?.name || '',
      nit: initialData?.nit || '',
      description: initialData?.description || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
      cityId: initialData?.cityId || undefined,
      stateId: initialData?.stateId || undefined,
      countryId: initialData?.countryId || undefined,
      website: initialData?.website || '',
      headquarters: initialData?.headquarters || []
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Error submitting form:', error);
      }
    }
  });

  // Load countries on component mount
  useEffect(() => {
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
      ] : [
        { id: 4, name: 'Bogotá', stateId: 2 },
        { id: 5, name: 'Chía', stateId: 2 },
        { id: 6, name: 'Zipaquirá', stateId: 2 }
      ];
      setCities(mockCities);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const addHeadquarters = () => {
    const newHeadquarters: Headquarters = {
      name: '',
      description: '',
      address: '',
      phone: '',
      email: ''
    };
    formik.setFieldValue('headquarters', [...formik.values.headquarters, newHeadquarters]);
  };

  const removeHeadquarters = (index: number) => {
    const newHeadquarters = formik.values.headquarters.filter((_, i) => i !== index);
    formik.setFieldValue('headquarters', newHeadquarters);
  };

  const updateHeadquarters = (index: number, field: keyof Headquarters, value: any) => {
    const newHeadquarters = [...formik.values.headquarters];
    newHeadquarters[index] = { ...newHeadquarters[index], [field]: value };
    formik.setFieldValue('headquarters', newHeadquarters);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Card elevation={2}>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h5" component="h1">
              {initialData ? 'Editar Empresa' : 'Crear Nueva Empresa'}
            </Typography>
          </Box>

          <form onSubmit={formik.handleSubmit}>
            {/* Company Basic Info */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
              Información Básica
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="name"
                  label="Nombre de la Empresa *"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="nit"
                  label="NIT *"
                  value={formik.values.nit}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.nit && Boolean(formik.errors.nit)}
                  helperText={formik.touched.nit && formik.errors.nit}
                />
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

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="website"
                  label="Sitio Web"
                  value={formik.values.website}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.website && Boolean(formik.errors.website)}
                  helperText={formik.touched.website && formik.errors.website}
                />
              </Grid>
            </Grid>

            {/* Geographic Location */}
            <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
              <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Ubicación Principal
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

            {/* Headquarters Section */}
            <Box sx={{ mt: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Sedes ({formik.values.headquarters.length})
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addHeadquarters}
                  variant="outlined"
                  color="primary"
                >
                  Agregar Sede
                </Button>
              </Box>

              {formik.values.headquarters.map((headquarters, index) => (
                <Paper key={index} sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Sede #{index + 1}
                    </Typography>
                    <IconButton
                      onClick={() => removeHeadquarters(index)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Nombre de la Sede *"
                        value={headquarters.name}
                        onChange={(e) => updateHeadquarters(index, 'name', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Teléfono"
                        value={headquarters.phone || ''}
                        onChange={(e) => updateHeadquarters(index, 'phone', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={headquarters.email || ''}
                        onChange={(e) => updateHeadquarters(index, 'email', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Dirección"
                        value={headquarters.address || ''}
                        onChange={(e) => updateHeadquarters(index, 'address', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Descripción"
                        value={headquarters.description || ''}
                        onChange={(e) => updateHeadquarters(index, 'description', e.target.value)}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Box>

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
                {isLoading ? 'Guardando...' : 'Guardar Empresa'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CompanyForm;