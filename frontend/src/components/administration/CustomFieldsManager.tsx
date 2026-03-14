import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import customFieldService from '../../services/customFieldService';
import ViewDialog from '../common/ViewDialog';
import ModalHeader from '../common/ModalHeader';
import PageHeader from '../common/PageHeader';
import PageHeaderActionButton from '../common/PageHeaderActionButton';
import CustomFieldForm from './CustomFieldForm';

interface CustomField {
  id: string;
  key: string;
  label: string;
  type: string;
  description?: string;
  config?: any;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  options?: CustomFieldOption[];
  bindings?: CustomFieldBinding[];
}

interface CustomFieldOption {
  id: string;
  value: string;
  label: string;
  order: number;
  isActive: boolean;
}

interface CustomFieldBinding {
  id: string;
  scope: string;
  scopeId: string;
  isEnabled: boolean;
  isVisible: boolean;
  isRequired: boolean;
}

const FIELD_TYPES = [
  'TEXT',
  'TEXTAREA',
  'NUMBER',
  'DECIMAL',
  'CAPACITY',
  'SELECT',
  'MULTISELECT',
  'CHECKBOX',
  'DATE',
  'DATETIME',
  'URL',
  'EMAIL',
  'PHONE',
  'COLOR',
];

const CustomFieldsManager: React.FC = () => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedField, setSelectedField] = useState<CustomField | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      setLoading(true);
      const data = await customFieldService.getFields();
      const list = data?.data || data || [];
      setFields(Array.isArray(list) ? list : []);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Error al cargar campos: ${error.response?.data?.error || error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewField = (field: CustomField) => {
    setSelectedField(field);
    setViewDialogOpen(true);
  };

  const handleEditFromView = () => {
    setViewDialogOpen(false);
    setEditDialogOpen(true);
  };

  const handleToggleStatus = async (field: CustomField) => {
    try {
      const newStatus = field.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await customFieldService.updateField(Number(field.id), { status: newStatus });
      setMessage({ type: 'success', text: `Campo ${newStatus === 'ACTIVE' ? 'habilitado' : 'deshabilitado'} exitosamente` });
      loadFields();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Error al actualizar: ${error.response?.data?.error || error.message}`
      });
    }
  };

  const filteredFields = fields.filter(field => {
    const matchesSearch = 
      field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (field.description && field.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || field.type === filterType;
    const matchesStatus = filterStatus === 'all' || field.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const groupedFields = filteredFields.reduce((acc, field) => {
    const type = field.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(field);
    return acc;
  }, {} as Record<string, CustomField[]>);

  if (loading && fields.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Campos Personalizados"
        subtitle="Gestiona todos los campos personalizados del sistema"
        action={
          <PageHeaderActionButton
            label="Crear Campo"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedField(null);
              setEditDialogOpen(true);
            }}
          />
        }
      />

      {/* Alertas */}
      {message && (
        <Alert
          severity={message.type}
          sx={{ mb: 2 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {/* Card principal */}
      <Card sx={{ borderRadius: 1, boxShadow: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Lista de Campos ({filteredFields.length})
            </Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadFields}
              sx={{
                color: '#FF6B6B',
                borderColor: '#FF6B6B',
                '&:hover': {
                  borderColor: '#FF5252',
                  backgroundColor: 'rgba(255, 107, 107, 0.04)',
                },
                borderRadius: 1,
              }}
              variant="outlined"
            >
              Actualizar
            </Button>
          </Box>

          {/* Filtros */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Buscar campo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    '&:hover fieldset': { borderColor: '#FF6B6B' },
                    '&.Mui-focused fieldset': { borderColor: '#FF6B6B', borderWidth: 2 },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}>
                <InputLabel>Filtrar por Tipo</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Filtrar por Tipo"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {FIELD_TYPES.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}>
                <InputLabel>Filtrar por Estado</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Filtrar por Estado"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="ACTIVE">Activos</MenuItem>
                  <MenuItem value="INACTIVE">Inactivos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Tabla */}
          <TableContainer component={Paper} sx={{ borderRadius: 1 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#FF6B6B' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Key</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Etiqueta</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Tipo</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Descripción</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Estado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, textAlign: 'center' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFields.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                          ? 'No se encontraron campos' 
                          : 'No hay campos personalizados registrados'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFields.map((field) => (
                    <TableRow key={field.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                        {field.key}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{field.label}</TableCell>
                      <TableCell>
                        <Chip label={field.type} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {field.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={field.status || 'ACTIVE'}
                          color={(field.status || 'ACTIVE') === 'ACTIVE' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Tooltip title="Ver">
                            <IconButton
                              size="small"
                              onClick={() => handleViewField(field)}
                              sx={{ color: '#2196F3' }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedField(field);
                                setEditDialogOpen(true);
                              }}
                              sx={{ color: '#FF9800' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={field.status === 'ACTIVE' ? 'Deshabilitar' : 'Habilitar'}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleStatus(field)}
                              sx={{ color: field.status === 'ACTIVE' ? '#FF9800' : '#4CAF50' }}
                            >
                              <SettingsIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* FAB con gradiente naranja */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => {
          setSelectedField(null);
          setEditDialogOpen(true);
        }}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          background: 'linear-gradient(45deg, #FF6B35 30%, #F7931E 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #E55A2B 30%, #E8820A 90%)'
          }
        }}
      >
        <AddIcon />
      </Fab>

      {/* ViewDialog para ver detalles */}
      {selectedField && (
        <ViewDialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          onEdit={handleEditFromView}
          title={`Campo: ${selectedField.label}`}
          data={selectedField}
          type="company"
        />
      )}

      {/* Formulario de creación/edición */}
      <CustomFieldForm
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedField(null);
        }}
        onSave={() => {
          loadFields();
          setEditDialogOpen(false);
          setSelectedField(null);
        }}
        initialData={selectedField}
      />
    </Box>
  );
};

export default CustomFieldsManager;


