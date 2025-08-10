import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  MenuItem,
  Alert,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Chip,
  Divider,
  Paper,
  Avatar,
  Switch,
  FormControlLabel,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import {
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Phone,
  Badge,
  AccountCircle,
  Lock,
  Business,
  Work,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera,
  Delete as DeleteIcon,
  ContactPhone,
  Security,
  Assignment,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/api';

// Country data with flags and phone codes (same as registration)
const countries = [
  { code: 'CO', name: 'Colombia', phone: '+57', flag: '🇨🇴' },
  { code: 'US', name: 'Estados Unidos', phone: '+1', flag: '🇺🇸' },
  { code: 'MX', name: 'México', phone: '+52', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', phone: '+54', flag: '🇦🇷' },
  { code: 'BR', name: 'Brasil', phone: '+55', flag: '🇧🇷' },
  { code: 'CL', name: 'Chile', phone: '+56', flag: '🇨🇱' },
  { code: 'PE', name: 'Perú', phone: '+51', flag: '🇵🇪' },
  { code: 'EC', name: 'Ecuador', phone: '+593', flag: '🇪🇨' },
  { code: 'VE', name: 'Venezuela', phone: '+58', flag: '🇻🇪' },
  { code: 'ES', name: 'España', phone: '+34', flag: '🇪🇸' },
];

// Document types
const documentTypes = [
  { value: 'CEDULA', label: 'Cédula de Ciudadanía' },
  { value: 'TARJETA_IDENTIDAD', label: 'Tarjeta de Identidad' },
  { value: 'CEDULA_EXTRANJERIA', label: 'Cédula de Extranjería' },
  { value: 'PASSPORT', label: 'Pasaporte' },
  { value: 'NIT', label: 'NIT' },
  { value: 'RUT', label: 'RUT' },
];

// User roles
const userRoles = [
  { value: 'USER', label: 'Usuario' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'SUPER_ADMIN', label: 'Super Administrador' },
];

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  phone: string;
  countryCode: string;
  documentType: string;
  documentNumber: string;
  role: string;
  status: string;
  companyId: string;
  headquartersId: string;
  processId: string;
  jobTitleId: string;
  profilePicture: string;
}

interface FormErrors {
  [key: string]: string;
}

interface Company {
  id: number;
  name: string;
}

interface Headquarters {
  id: number;
  name: string;
  companyId: number;
}

interface Process {
  id: number;
  name: string;
}

interface JobTitle {
  id: number;
  name: string;
  processId: number;
}

interface UserFormProps {
  initialData?: Partial<UserFormData>;
  onSubmit?: (data: UserFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  isEditMode?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ initialData, onCancel, isEditMode }) => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  
  const isEditing = Boolean(userId);
  const isCreating = !isEditing;

  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    phone: '',
    countryCode: 'CO',
    documentType: '',
    documentNumber: '',
    role: 'USER',
    status: 'ACTIVE',
    companyId: '',
    headquartersId: '',
    processId: '',
    jobTitleId: '',
    profilePicture: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Options data
  const [companies, setCompanies] = useState<Company[]>([]);
  const [headquarters, setHeadquarters] = useState<Headquarters[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);

  // Load form data if editing
  useEffect(() => {
    if (isEditing && userId) {
      loadUser(userId);
    }
    loadFormOptions();
  }, [isEditing, userId]);

  // Handle initial data from props - solo ejecutar cuando initialData cambie realmente
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  // Filter headquarters by selected company
  const filteredHeadquarters = headquarters.filter(
    hq => hq.companyId && hq.companyId.toString() === formData.companyId
  );

  // Filter job titles by selected process
  const filteredJobTitles = jobTitles.filter(
    jt => jt.processId && jt.processId.toString() === formData.processId
  );

  const loadUser = async (id: string) => {
    try {
      const response = await api.get(`/users/${id}`);
      const user = response.data.user;
      
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        username: user.username || '',
        password: '',
        confirmPassword: '',
        phone: user.phone?.replace(/^\+\d+/, '') || '', // Remove country code
        countryCode: getCountryCodeFromPhone(user.phone) || 'CO',
        documentType: user.documentType || '',
        documentNumber: user.documentNumber || '',
        role: user.role || 'USER',
        status: user.status || 'ACTIVE',
        companyId: user.companyId?.toString() || '',
        headquartersId: user.headquartersId?.toString() || '',
        processId: user.processId?.toString() || '',
        jobTitleId: user.jobTitleId?.toString() || '',
        profilePicture: user.profilePicture || '',
      });
    } catch (error) {
      setSubmitError('Error al cargar usuario');
    }
  };

  const getCountryCodeFromPhone = (phone?: string): string => {
    if (!phone) return 'CO';
    const country = countries.find(c => phone.startsWith(c.phone));
    return country?.code || 'CO';
  };

  const loadFormOptions = async () => {
    try {
      // Load companies
      const companiesResponse = await api.get('/companies');
      setCompanies(companiesResponse.data.companies || []);

      // Load headquarters
      const headquartersResponse = await api.get('/headquarters');
      setHeadquarters(headquartersResponse.data.headquarters || []);

      // Load processes
      const processesResponse = await api.get('/processes');
      setProcesses(processesResponse.data.processes || []);

      // Load job titles
      const jobTitlesResponse = await api.get('/job-titles');
      setJobTitles(jobTitlesResponse.data.jobTitles || []);
    } catch (error) {
      console.error('Error loading form options:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es obligatorio';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es obligatorio';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Ingrese un email válido';
      }
    }

    // Password validation (only for creation or if password is provided)
    if (isCreating || formData.password) {
      if (!formData.password) {
        newErrors.password = 'La contraseña es obligatoria';
      } else if (formData.password.length < 8) {
        newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    // Document validation
    if (!formData.documentType) {
      newErrors.documentType = 'Seleccione un tipo de documento';
    }

    if (!formData.documentNumber.trim()) {
      newErrors.documentNumber = 'El número de documento es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof UserFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Clear headquarters when company changes
    if (field === 'companyId') {
      setFormData(prev => ({ ...prev, headquartersId: '' }));
    }

    // Clear job title when process changes
    if (field === 'processId') {
      setFormData(prev => ({ ...prev, jobTitleId: '' }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const selectedCountry = countries.find(c => c.code === formData.countryCode);
      const fullPhoneNumber = formData.phone ? `${selectedCountry?.phone}${formData.phone}` : '';
      
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        username: formData.username.trim() || undefined,
        phone: fullPhoneNumber,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber.trim(),
        role: formData.role,
        status: formData.status,
        companyId: formData.companyId ? parseInt(formData.companyId) : undefined,
        headquartersId: formData.headquartersId ? parseInt(formData.headquartersId) : undefined,
        processId: formData.processId ? parseInt(formData.processId) : undefined,
        jobTitleId: formData.jobTitleId ? parseInt(formData.jobTitleId) : undefined,
        ...(formData.password && { password: formData.password }),
      };

      const response = isEditing 
        ? await api.put(`/users/${userId}`, userData)
        : await api.post('/users', userData);

      if (response.status === 200 || response.status === 201) {
        setSubmitSuccess(
          isEditing 
            ? 'Usuario actualizado correctamente' 
            : 'Usuario creado correctamente'
        );
        
        setTimeout(() => {
          navigate('/users');
        }, 2000);
      }
    } catch (error: any) {
      const errorData = error.response?.data;
      setSubmitError(errorData?.message || error.message || 'Error al guardar usuario');
      
      if (errorData?.errors) {
        setErrors(errorData.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Si tenemos onCancel prop (modo modal), lo usamos
    if (onCancel) {
      onCancel();
    } else {
      // Si no, navegamos (modo página independiente)
      navigate('/users');
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !userId) return;
    
    if (!window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/users/${userId}`);
      
      setSubmitSuccess('Usuario eliminado correctamente');
      setTimeout(() => {
        navigate('/users');
      }, 2000);
    } catch (error: any) {
      const errorData = error.response?.data;
      setSubmitError(errorData?.message || error.message || 'Error al eliminar usuario');
    } finally {
      setLoading(false);
    }
  };

  const selectedCountry = countries.find(c => c.code === formData.countryCode);

  // Permission checks
  const canEditRole = () => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN') return true;
    if (currentUser.role === 'ADMIN') return true;
    return false;
  };

  const getAvailableRoles = () => {
    if (!currentUser) return [];
    
    if (currentUser.role === 'SUPER_ADMIN') {
      return userRoles;
    }
    
    if (currentUser.role === 'ADMIN') {
      return userRoles.filter(role => role.value !== 'SUPER_ADMIN');
    }
    
    return userRoles.filter(role => ['USER', 'SUPERVISOR'].includes(role.value));
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          {isEditing ? 'Editar Usuario' : 'Crear Usuario'}
        </Typography>
      </Box>

      {/* Success/Error Messages */}
      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}
      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {submitSuccess}
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit}>
            
            {/* =============== INFORMACIÓN PERSONAL =============== */}
            <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: 'grey.50' }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', color: 'primary.main' }}>
                <Person sx={{ mr: 2 }} />
                Información Personal
              </Typography>
              
              <Grid container spacing={3}>
                {/* Nombre y Apellido en la misma fila */}
                <Grid xs={12} md={4}>
                  <TextField
                    id="firstName"
                    name="firstName"
                    autoComplete="given-name"
                    fullWidth
                    label="Nombre *"
                    value={formData.firstName}
                    onChange={handleInputChange('firstName')}
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid xs={12} md={4}>
                  <TextField
                    id="lastName"
                    name="lastName"
                    autoComplete="family-name"
                    fullWidth
                    label="Apellido *"
                    value={formData.lastName}
                    onChange={handleInputChange('lastName')}
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Foto del perfil a la derecha */}
                <Grid xs={12} md={4}>
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        mb: 2,
                        bgcolor: 'primary.main',
                      }}
                      src={formData.profilePicture}
                    >
                      {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
                    </Avatar>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PhotoCamera />}
                      component="label"
                    >
                      Cambiar Foto
                      <input
                        hidden
                        accept="image/*"
                        type="file"
                        onChange={(e) => {
                          // TODO: Handle image upload
                          console.log('Image upload:', e.target.files);
                        }}
                      />
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* =============== INFORMACIÓN DE IDENTIFICACIÓN =============== */}
            <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: 'grey.50' }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', color: 'primary.main' }}>
                <Badge sx={{ mr: 2 }} />
                Información de Identificación
              </Typography>
              
              <Grid container spacing={3}>
                <Grid xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.documentType}>
                    <InputLabel id="documentType-label">Tipo de Documento *</InputLabel>
                    <Select
                      labelId="documentType-label"
                      id="documentType"
                      name="documentType"
                      value={formData.documentType}
                      onChange={handleInputChange('documentType')}
                      input={<OutlinedInput label="Tipo de Documento *" />}
                    >
                      {documentTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.documentType && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                        {errors.documentType}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid xs={12} md={6}>
                  <TextField
                    id="documentNumber"
                    name="documentNumber"
                    autoComplete="off"
                    fullWidth
                    label={isEditMode ? "Número de Documento (No editable)" : "Número de Documento *"}
                    value={formData.documentNumber}
                    onChange={handleInputChange('documentNumber')}
                    disabled={isEditMode}
                    error={!!errors.documentNumber}
                    helperText={errors.documentNumber}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Badge color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* =============== INFORMACIÓN DE CONTACTO =============== */}
            <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: 'grey.50' }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', color: 'primary.main' }}>
                <ContactPhone sx={{ mr: 2 }} />
                Información de Contacto
              </Typography>
              
              <Grid container spacing={3}>
                {/* Email en la primera posición */}
                <Grid xs={12} md={6}>
                  <TextField
                    id="email"
                    name="email"
                    autoComplete="email"
                    fullWidth
                    label="Email *"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    error={!!errors.email}
                    helperText={errors.email}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* País y Teléfono */}
                <Grid xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel id="countryCode-label">País</InputLabel>
                  <Select
                    labelId="countryCode-label"
                    id="countryCode"
                    name="countryCode"
                      value={formData.countryCode}
                      onChange={handleInputChange('countryCode')}
                      input={<OutlinedInput label="País" />}
                      renderValue={(value) => {
                        const country = countries.find(c => c.code === value);
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: 8, fontSize: '1.2em' }}>{country?.flag}</span>
                            {country?.phone}
                          </Box>
                        );
                      }}
                    >
                      {countries.map((country) => (
                        <MenuItem key={country.code} value={country.code}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <span style={{ marginRight: 12, fontSize: '1.2em' }}>{country.flag}</span>
                            <Box>
                              <Typography variant="body2">{country.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {country.phone}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid xs={12} md={3}>
                  <TextField
                    id="phone"
                    name="phone"
                    autoComplete="tel"
                    fullWidth
                    label="Teléfono"
                    value={formData.phone}
                    onChange={handleInputChange('phone')}
                    error={!!errors.phone}
                    helperText={errors.phone}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Chip
                            size="small"
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: 4, fontSize: '0.9em' }}>{selectedCountry?.flag}</span>
                                {selectedCountry?.phone}
                              </Box>
                            }
                            sx={{ mr: 1 }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* =============== INFORMACIÓN ORGANIZACIONAL =============== */}
            <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: 'grey.50' }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', color: 'primary.main' }}>
                <Business sx={{ mr: 2 }} />
                Información Organizacional
              </Typography>
              
              <Grid container spacing={3}>
                {/* Empresa y Sede */}
                <Grid xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="companyId-label">Empresa</InputLabel>
                  <Select
                    labelId="companyId-label"
                    id="companyId"
                    name="companyId"
                      value={companies.some((c) => c.id?.toString() === formData.companyId) ? formData.companyId : ''}
                      onChange={handleInputChange('companyId')}
                      input={<OutlinedInput label="Empresa" />}
                    >
                      <MenuItem value="">
                        <em>Ninguna</em>
                      </MenuItem>
                      {companies.map((company) => (
                        <MenuItem key={company.id} value={company.id.toString()}>
                          {company.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid xs={12} md={6}>
                  <FormControl fullWidth disabled={!formData.companyId}>
                    <InputLabel id="headquartersId-label">Sede</InputLabel>
                  <Select
                    labelId="headquartersId-label"
                    id="headquartersId"
                    name="headquartersId"
                      value={filteredHeadquarters.some((hq) => hq.id?.toString() === formData.headquartersId) ? formData.headquartersId : ''}
                      onChange={handleInputChange('headquartersId')}
                      input={<OutlinedInput label="Sede" />}
                    >
                      <MenuItem value="">
                        <em>Ninguna</em>
                      </MenuItem>
                      {filteredHeadquarters.map((hq) => (
                        <MenuItem key={hq.id} value={hq.id.toString()}>
                          {hq.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Proceso y Cargo */}
                <Grid xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="processId-label">Proceso</InputLabel>
                  <Select
                    labelId="processId-label"
                    id="processId"
                    name="processId"
                      value={processes.some((p) => p.id?.toString() === formData.processId) ? formData.processId : ''}
                      onChange={handleInputChange('processId')}
                      input={<OutlinedInput label="Proceso" />}
                    >
                      <MenuItem value="">
                        <em>Ninguno</em>
                      </MenuItem>
                      {processes.map((process) => (
                        <MenuItem key={process.id} value={process.id.toString()}>
                          {process.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid xs={12} md={6}>
                  <FormControl fullWidth disabled={!formData.processId}>
                    <InputLabel id="jobTitleId-label">Cargo</InputLabel>
                  <Select
                    labelId="jobTitleId-label"
                    id="jobTitleId"
                    name="jobTitleId"
                      value={filteredJobTitles.some((jt) => jt.id?.toString() === formData.jobTitleId) ? formData.jobTitleId : ''}
                      onChange={handleInputChange('jobTitleId')}
                      input={<OutlinedInput label="Cargo" />}
                    >
                      <MenuItem value="">
                        <em>Ninguno</em>
                      </MenuItem>
                      {filteredJobTitles.map((jobTitle) => (
                        <MenuItem key={jobTitle.id} value={jobTitle.id.toString()}>
                          {jobTitle.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {/* =============== SEGURIDAD Y PERMISOS =============== */}
            <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: 'grey.50' }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', color: 'primary.main' }}>
                <Security sx={{ mr: 2 }} />
                Seguridad y Permisos
              </Typography>
              
              <Grid container spacing={3}>
                {/* Username y Rol */}
                <Grid xs={12} md={6}>
                  <TextField
                    id="username"
                    name="username"
                    autoComplete="username"
                    fullWidth
                    label={isEditMode ? "Nombre de Usuario (No editable)" : "Nombre de Usuario (Opcional)"}
                    value={formData.username}
                    onChange={handleInputChange('username')}
                    disabled={isEditMode}
                    error={!!errors.username}
                    helperText={isEditMode ? 'El nombre de usuario no se puede cambiar' : (errors.username || 'Deje en blanco para usar el email como nombre de usuario')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccountCircle color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {canEditRole() && (
                  <Grid xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="role-label">Rol</InputLabel>
                      <Select
                        labelId="role-label"
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange('role')}
                        input={<OutlinedInput label="Rol" />}
                      >
                        {getAvailableRoles().map((role) => (
                          <MenuItem key={role.value} value={role.value}>
                            {role.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Contraseña y Confirmar Contraseña */}
                {(isCreating || showPassword) && (
                  <>
                    <Grid xs={12} md={6}>
                      <TextField
                        id="password"
                        name="password"
                        autoComplete="new-password"
                        fullWidth
                        label={isCreating ? "Contraseña *" : "Nueva Contraseña"}
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleInputChange('password')}
                        error={!!errors.password}
                        helperText={errors.password}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid xs={12} md={6}>
                      <TextField
                        id="confirmPassword"
                        name="confirmPassword"
                        autoComplete="new-password"
                        fullWidth
                        label={isCreating ? "Confirmar Contraseña *" : "Confirmar Nueva Contraseña"}
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleInputChange('confirmPassword')}
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                edge="end"
                              >
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </>
                )}

                {isEditing && !showPassword && (
                  <Grid xs={12} md={6}>
                    <Button
                      variant="outlined"
                      onClick={() => setShowPassword(true)}
                      fullWidth
                      sx={{ height: '56px' }}
                    >
                      Cambiar Contraseña
                    </Button>
                  </Grid>
                )}

                {/* Estado */}
                <Grid xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="status-label">Estado</InputLabel>
                    <Select
                      labelId="status-label"
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange('status')}
                      input={<OutlinedInput label="Estado" />}
                    >
                      <MenuItem value="ACTIVE">Activo</MenuItem>
                      <MenuItem value="INACTIVE">Inactivo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {/* =============== BOTONES DE ACCIÓN =============== */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                startIcon={<CancelIcon />}
                disabled={loading}
              >
                Cancelar
              </Button>
              
              {isEditing && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDelete}
                  startIcon={<DeleteIcon />}
                  disabled={loading}
                >
                  Eliminar
                </Button>
              )}
              
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={<SaveIcon />}
              >
                {loading 
                  ? (isEditing ? 'Actualizando...' : 'Creando...')
                  : (isEditing ? 'Actualizar Usuario' : 'Crear Usuario')
                }
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserForm;