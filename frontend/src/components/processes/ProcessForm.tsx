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
  Divider,
  Chip,
  Autocomplete,
  OutlinedInput,
  SelectChangeEvent
} from '@mui/material';
import {
  AccountTree as ProcessIcon,
  Business as BusinessIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Types
interface Company {
  id: number;
  name: string;
  nit: string;
}

interface ProcessFormData {
  name: string;
  description?: string;
  code?: string;
  autoGenerateCode: boolean;
  companyIds: number[];
}

interface ProcessFormProps {
  initialData?: Partial<ProcessFormData>;
  onSubmit: (data: ProcessFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .required('El nombre del proceso es obligatorio'),
  companyIds: Yup.array()
    .of(Yup.number())
    .min(1, 'Debe seleccionar al menos una empresa')
    .required('Debe seleccionar al menos una empresa'),
  code: Yup.string()
    .min(2, 'El código debe tener al menos 2 caracteres')
    .max(10, 'El código no puede exceder 10 caracteres')
    .when('autoGenerateCode', {
      is: false,
      then: (schema) => schema.required('El código es obligatorio cuando no se genera automáticamente')
    })
});

const ProcessForm: React.FC<ProcessFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  // State for dropdown data
  const [companies, setCompanies] = useState<Company[]>([]);

  const formik = useFormik<ProcessFormData>({
    initialValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      code: initialData?.code || '',
      autoGenerateCode: !initialData?.code, // Si hay código inicial, no auto-generar
      companyIds: initialData?.companyIds || []
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        // Auto-generate code if requested
        if (values.autoGenerateCode) {
          const processCode = values.name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 3);
          const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          values.code = `${processCode}-${randomNum}`;
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
  }, []);

  const loadCompanies = async () => {
    try {
      // TODO: Replace with actual API call
      const mockCompanies: Company[] = [
        { id: 1, name: 'ITDimenzion SAS', nit: '900123456-1' },
        { id: 2, name: 'TechCorp Colombia', nit: '800987654-2' },
        { id: 3, name: 'InnovaTech SA', nit: '700555444-3' },
        { id: 4, name: 'Digital Solutions', nit: '600333222-4' },
        { id: 5, name: 'Smart Systems', nit: '500111000-5' }
      ];
      setCompanies(mockCompanies);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handleCompanyChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value;
    formik.setFieldValue('companyIds', typeof value === 'string' ? [] : value);
  };

  const getSelectedCompanies = () => {
    return companies.filter(company => formik.values.companyIds.includes(company.id));
  };

  const generatePreviewCode = () => {
    if (!formik.values.autoGenerateCode || !formik.values.name) return '';
    
    const processCode = formik.values.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 3);
    
    return `${processCode}-XXX`;
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Card elevation={2}>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <ProcessIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h5" component="h1">
              {initialData ? 'Editar Proceso' : 'Crear Nuevo Proceso'}
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            Los procesos pueden ser utilizados por múltiples empresas. 
            Un proceso puede tener varios cargos (JobTitles) asociados.
          </Alert>

          <form onSubmit={formik.handleSubmit}>
            {/* Basic Info */}
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Información Básica
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  name="name"
                  label="Nombre del Proceso *"
                  placeholder="Ej: Recursos Humanos, Tecnología, Finanzas"
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
                  {!formik.values.autoGenerateCode ? (
                    <TextField
                      fullWidth
                      name="code"
                      label="Código del Proceso *"
                      placeholder="Ej: RH-001, TEC-001"
                      value={formik.values.code}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.code && Boolean(formik.errors.code)}
                      helperText={formik.touched.code && formik.errors.code}
                      sx={{ mt: 1 }}
                    />
                  ) : (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Código preview: {generatePreviewCode() || 'Ingrese el nombre del proceso'}
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
                  placeholder="Describe las actividades y responsabilidades de este proceso..."
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Company Assignment */}
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Asignación a Empresas
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Empresas *</InputLabel>
                  <Select
                    multiple
                    name="companyIds"
                    value={formik.values.companyIds}
                    onChange={handleCompanyChange}
                    input={<OutlinedInput label="Empresas *" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as number[]).map((companyId) => {
                          const company = companies.find(c => c.id === companyId);
                          return company ? (
                            <Chip 
                              key={companyId} 
                              label={company.name}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ) : null;
                        })}
                      </Box>
                    )}
                    error={formik.touched.companyIds && Boolean(formik.errors.companyIds)}
                  >
                    {companies.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        <Box>
                          <Typography variant="body2">{company.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            NIT: {company.nit}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.companyIds && formik.errors.companyIds && (
                    <Typography variant="caption" color="error" sx={{ ml: 2, mt: 1 }}>
                      {formik.errors.companyIds}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {formik.values.companyIds.length > 0 && (
                <Grid item xs={12}>
                  <Alert severity="success">
                    <Typography variant="subtitle2" gutterBottom>
                      Este proceso será disponible para {formik.values.companyIds.length} empresa{formik.values.companyIds.length !== 1 ? 's' : ''}:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {getSelectedCompanies().map((company) => (
                        <Chip 
                          key={company.id}
                          label={`${company.name} (${company.nit})`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Alert>
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Process Rules */}
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Reglas del Sistema:
              </Typography>
              <Typography variant="body2" component="div">
                • Un proceso puede existir en múltiples empresas<br/>
                • No puede existir el mismo proceso con el mismo nombre en la misma empresa<br/>
                • Los cargos (JobTitles) pertenecen a un proceso específico<br/>
                • Los usuarios son asignados a cargos, no directamente a procesos
              </Typography>
            </Alert>

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
                {isLoading ? 'Guardando...' : 'Guardar Proceso'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProcessForm;