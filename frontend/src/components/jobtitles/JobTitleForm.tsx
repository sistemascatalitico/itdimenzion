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
  Chip
} from '@mui/material';
import {
  Work as JobIcon,
  AccountTree as ProcessIcon,
  Business as BusinessIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  SupervisorAccount as ManagerIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Types
interface Process {
  id: number;
  name: string;
  code: string;
  companies: Array<{
    id: number;
    name: string;
  }>;
}

interface Company {
  id: number;
  name: string;
  nit: string;
}

interface JobTitleFormData {
  name: string;
  processId: number;
  description?: string;
  code?: string;
  autoGenerateCode: boolean;
  processManager: boolean;
  companyIds: number[];
}

interface JobTitleFormProps {
  initialData?: Partial<JobTitleFormData>;
  onSubmit: (data: JobTitleFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .required('El nombre del cargo es obligatorio'),
  processId: Yup.number()
    .required('Debe seleccionar un proceso'),
  companyIds: Yup.array()
    .of(Yup.number())
    .min(1, 'Debe seleccionar al menos una empresa')
    .required('Debe seleccionar al menos una empresa'),
  code: Yup.string()
    .min(2, 'El código debe tener al menos 2 caracteres')
    .max(15, 'El código no puede exceder 15 caracteres')
    .when('autoGenerateCode', {
      is: false,
      then: (schema) => schema.required('El código es obligatorio cuando no se genera automáticamente')
    })
});

const JobTitleForm: React.FC<JobTitleFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  // State for dropdown data
  const [processes, setProcesses] = useState<Process[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);

  const formik = useFormik<JobTitleFormData>({
    initialValues: {
      name: initialData?.name || '',
      processId: initialData?.processId || 0,
      description: initialData?.description || '',
      code: initialData?.code || '',
      autoGenerateCode: !initialData?.code,
      processManager: initialData?.processManager || false,
      companyIds: initialData?.companyIds || []
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        // Auto-generate code if requested
        if (values.autoGenerateCode && values.processId) {
          const process = processes.find(p => p.id === values.processId);
          const processCode = process?.code || 'JT';
          const jobCode = values.name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 3);
          const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
          values.code = `${processCode}-${jobCode}${randomNum}`;
        }
        
        await onSubmit(values);
      } catch (error) {
        console.error('Error submitting form:', error);
      }
    }
  });

  // Load initial data
  useEffect(() => {
    loadProcesses();
    loadCompanies();
  }, []);

  // Update available companies when process changes
  useEffect(() => {
    if (formik.values.processId) {
      const selectedProcess = processes.find(p => p.id === formik.values.processId);
      if (selectedProcess) {
        const processCompanies = selectedProcess.companies;
        const availableComps = companies.filter(comp => 
          processCompanies.some(pc => pc.id === comp.id)
        );
        setAvailableCompanies(availableComps);
        
        // Reset company selection if current selection is not available
        const validCompanyIds = formik.values.companyIds.filter(id => 
          availableComps.some(comp => comp.id === id)
        );
        if (validCompanyIds.length !== formik.values.companyIds.length) {
          formik.setFieldValue('companyIds', validCompanyIds);
        }
      }
    } else {
      setAvailableCompanies([]);
      formik.setFieldValue('companyIds', []);
    }
  }, [formik.values.processId, processes, companies]);

  const loadProcesses = async () => {
    try {
      // TODO: Replace with actual API call
      const mockProcesses: Process[] = [
        {
          id: 1,
          name: 'Recursos Humanos',
          code: 'RH-001',
          companies: [
            { id: 1, name: 'ITDimenzion SAS' },
            { id: 2, name: 'TechCorp Colombia' }
          ]
        },
        {
          id: 2,
          name: 'Tecnología',
          code: 'TEC-001',
          companies: [
            { id: 1, name: 'ITDimenzion SAS' },
            { id: 3, name: 'InnovaTech SA' }
          ]
        },
        {
          id: 3,
          name: 'Finanzas',
          code: 'FIN-001',
          companies: [
            { id: 2, name: 'TechCorp Colombia' }
          ]
        },
        {
          id: 4,
          name: 'Ventas y Marketing',
          code: 'VYM-001',
          companies: [
            { id: 1, name: 'ITDimenzion SAS' },
            { id: 2, name: 'TechCorp Colombia' },
            { id: 3, name: 'InnovaTech SA' }
          ]
        }
      ];
      setProcesses(mockProcesses);
    } catch (error) {
      console.error('Error loading processes:', error);
    }
  };

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

  const generatePreviewCode = () => {
    if (!formik.values.autoGenerateCode || !formik.values.processId || !formik.values.name) return '';
    
    const process = processes.find(p => p.id === formik.values.processId);
    const processCode = process?.code || 'JT';
    const jobCode = formik.values.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 3);
    
    return `${processCode}-${jobCode}XX`;
  };

  const getSelectedProcess = () => {
    return processes.find(p => p.id === formik.values.processId);
  };

  const getSelectedCompanies = () => {
    return availableCompanies.filter(comp => formik.values.companyIds.includes(comp.id));
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Card elevation={2}>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <JobIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h5" component="h1">
              {initialData ? 'Editar Cargo' : 'Crear Nuevo Cargo'}
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            Los cargos pertenecen a un proceso específico y pueden existir en múltiples empresas 
            donde ese proceso esté disponible.
          </Alert>

          <form onSubmit={formik.handleSubmit}>
            {/* Basic Info */}
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Información Básica
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Proceso *</InputLabel>
                  <Select
                    name="processId"
                    value={formik.values.processId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Proceso *"
                    error={formik.touched.processId && Boolean(formik.errors.processId)}
                  >
                    <MenuItem value={0}>Seleccionar proceso...</MenuItem>
                    {processes.map((process) => (
                      <MenuItem key={process.id} value={process.id}>
                        <Box>
                          <Typography variant="body2">{process.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {process.code} • {process.companies.length} empresa{process.companies.length !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.processId && formik.errors.processId && (
                    <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                      {formik.errors.processId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  name="name"
                  label="Nombre del Cargo *"
                  placeholder="Ej: Desarrollador Senior, Analista Financiero, Gerente de Ventas"
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
                      label="Código del Cargo *"
                      placeholder="Ej: TEC-DEV01, FIN-ANA01"
                      value={formik.values.code}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.code && Boolean(formik.errors.code)}
                      helperText={formik.touched.code && formik.errors.code}
                      sx={{ mt: 1 }}
                    />
                  ) : (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Código preview: {generatePreviewCode() || 'Seleccione proceso y nombre'}
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
                  label="Descripción del Cargo"
                  placeholder="Describe las responsabilidades, funciones y requisitos del cargo..."
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formik.values.processManager}
                      onChange={(e) => formik.setFieldValue('processManager', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ManagerIcon sx={{ mr: 1, fontSize: 20 }} />
                      Es Gerente/Manager del Proceso
                    </Box>
                  }
                />
                {formik.values.processManager && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Los usuarios asignados a este cargo tendrán permisos de supervisión 
                    sobre todo el proceso {getSelectedProcess()?.name}.
                  </Alert>
                )}
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Company Assignment */}
            {formik.values.processId > 0 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Empresas Disponibles
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    {availableCompanies.length > 0 ? (
                      <FormControl fullWidth required>
                        <InputLabel>Empresas *</InputLabel>
                        <Select
                          multiple
                          name="companyIds"
                          value={formik.values.companyIds}
                          onChange={(e) => formik.setFieldValue('companyIds', e.target.value)}
                          label="Empresas *"
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {(selected as number[]).map((companyId) => {
                                const company = availableCompanies.find(c => c.id === companyId);
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
                          {availableCompanies.map((company) => (
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
                    ) : (
                      <Alert severity="warning">
                        El proceso seleccionado no está disponible en ninguna empresa.
                      </Alert>
                    )}
                  </Grid>

                  {formik.values.companyIds.length > 0 && (
                    <Grid item xs={12}>
                      <Alert severity="success">
                        <Typography variant="subtitle2" gutterBottom>
                          Este cargo estará disponible en {formik.values.companyIds.length} empresa{formik.values.companyIds.length !== 1 ? 's' : ''}:
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
              </>
            )}

            {/* Job Title Rules */}
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Reglas del Sistema:
              </Typography>
              <Typography variant="body2" component="div">
                • Un cargo pertenece a un proceso específico<br/>
                • Un cargo puede existir en múltiples empresas (donde el proceso esté disponible)<br/>
                • No puede existir el mismo cargo con el mismo nombre en la misma empresa<br/>
                • Los usuarios son asignados directamente a cargos<br/>
                • Los cargos marcados como "Manager" tienen permisos especiales
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
                disabled={isLoading || formik.values.processId === 0}
                startIcon={<SaveIcon />}
              >
                {isLoading ? 'Guardando...' : 'Guardar Cargo'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default JobTitleForm;