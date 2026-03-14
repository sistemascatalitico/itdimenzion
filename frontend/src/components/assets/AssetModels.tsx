import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Build as WrenchIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
  KeyboardArrowUp,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { Checkbox } from '@mui/material';
import {
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  FormGroup,
  FormControlLabel,
  Switch,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import assetCatalogService from '../../services/assetCatalogService';
import api from '../../config/api';
import ViewDialog from '../common/ViewDialog';
import AssetModelForm from './AssetModelForm';
import PageHeader from '../common/PageHeader';
import PageHeaderActionButton from '../common/PageHeaderActionButton';
import { PRIMARY, PRIMARY_GRADIENT } from '../../theme/themeTokens';

interface AssetModel {
  id: string;
  manufacturerId: string;
  name: string;
  description?: string;
  status: string;
  typeId?: string;
  partNumber?: string;
  specsJson?: any;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  manufacturer?: {
    id: string;
    name: string;
    logo?: string;
  };
  type?: {
    id: string;
    name: string;
    label?: string;
  };
  referenceImage?: string;
}

const COLUMN_OPTIONS = [
  { id: 'manufacturerLogo', label: 'Logo Fabricante', visible: false, required: false },
  { id: 'name', label: 'Nombre', visible: true, required: true },
  { id: 'manufacturer', label: 'Fabricante', visible: true, required: false },
  { id: 'type', label: 'Tipo', visible: true, required: false },
  { id: 'partNumber', label: 'Número de Parte', visible: true, required: false },
  { id: 'status', label: 'Estado', visible: true, required: false },
  { id: 'referenceImage', label: 'Imagen Referencia', visible: false, required: false },
  { id: 'actions', label: 'Acciones', visible: true, required: true },
];

const COLUMNS_CONFIG_STORAGE_KEY = 'itd_assetmodels_columns_config';

const AssetModels: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AssetModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterField, setFilterField] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<AssetModel | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [columnsConfig, setColumnsConfig] = useState(() => {
    const saved = localStorage.getItem(COLUMNS_CONFIG_STORAGE_KEY);
    return saved ? JSON.parse(saved) : COLUMN_OPTIONS;
  });
  const [columnsDialogOpen, setColumnsDialogOpen] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [importMenuAnchor, setImportMenuAnchor] = useState<null | HTMLElement>(null);
  const [showInactiveModels, setShowInactiveModels] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);

  // Opciones de campos para filtrar
  const filterFieldOptions = [
    { value: '', label: 'Todos los campos' },
    { value: 'name', label: 'Nombre' },
    { value: 'partNumber', label: 'Número de Parte' },
    { value: 'manufacturer', label: 'Fabricante' },
    { value: 'type', label: 'Tipo' },
    { value: 'status', label: 'Estado' },
  ];

  // Determinar si el campo necesita un dropdown (select) o un campo de texto
  const shouldUseDropdown = (field: string): boolean => {
    return ['manufacturer', 'type', 'status'].includes(field);
  };

  // Obtener valores únicos para campos filtrables
  const getUniqueFilterValues = useMemo(() => {
    if (!filterField || rows.length === 0) return [];
    
    const values = new Set<string>();
    rows.forEach(row => {
      if (filterField === 'manufacturer') {
        const value = row.manufacturer?.name || '';
        if (value) values.add(value);
      } else if (filterField === 'type') {
        const value = row.type?.name || '';
        if (value) values.add(value);
      } else if (filterField === 'status') {
        const value = row.status || '';
        if (value) values.add(value);
      } else {
        const value = row[filterField as keyof AssetModel];
        if (value !== undefined && value !== null) {
          values.add(String(value));
        }
      }
    });
    return Array.from(values).sort();
  }, [filterField, rows]);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const response = await assetCatalogService.getModels();
      const data = response.data || response || [];
      setRows(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Error al cargar modelos: ${error.response?.data?.error || error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewModel = (model: AssetModel) => {
    setSelectedModel(model);
    setViewDialogOpen(true);
  };

  const handleEditFromView = () => {
    setViewDialogOpen(false);
    // selectedModel ya está establecido cuando se abre ViewDialog
    setEditDialogOpen(true);
  };

  const handleDelete = async (model: AssetModel) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el modelo "${model.name}"?`)) {
      try {
        await api.delete(`/asset-models/${model.id}`);
        setMessage({ type: 'success', text: 'Modelo eliminado exitosamente' });
        loadModels();
      } catch (error: any) {
        setMessage({
          type: 'error',
          text: `Error al eliminar: ${error.response?.data?.error || error.message}`
        });
      }
    }
  };

  const filteredRows = rows.filter(model => {
    // Búsqueda general (si no hay filtro específico)
    const matchesGeneralSearch = !filterField && (
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (model.description && model.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (model.partNumber && model.partNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (model.manufacturer && model.manufacturer.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Filtro de inactivos (siempre aplicado)
    const matchesInactive = showInactiveModels || model.status === 'ACTIVE';
    if (!matchesInactive) return false;

    // Filtro específico por campo
    if (filterField) {
      const searchText = filterValue.toLowerCase();
      if (!searchText) return true;

      if (filterField === 'manufacturer') {
        const manufacturerName = model.manufacturer?.name || '';
        return manufacturerName.toLowerCase().includes(searchText);
      }

      if (filterField === 'type') {
        const typeName = model.type?.name || '';
        return typeName.toLowerCase().includes(searchText);
      }

      const fieldValue = model[filterField as keyof AssetModel];
      if (fieldValue === undefined || fieldValue === null) return false;
      
      const fieldText = String(fieldValue).toLowerCase();
      return fieldText.includes(searchText);
    }

    return matchesGeneralSearch || !searchTerm;
  });

  const visibleColumns = columnsConfig.filter(col => col.visible);

  // Guardar configuración en localStorage cuando cambie
  React.useEffect(() => {
    localStorage.setItem(COLUMNS_CONFIG_STORAGE_KEY, JSON.stringify(columnsConfig));
  }, [columnsConfig]);

  // Funciones para manejo de selección
  const selectedModels = useMemo(() => {
    return filteredRows.filter(model => selectedIds.has(model.id));
  }, [filteredRows, selectedIds]);

  const allSelectedOnPage = useMemo(() => {
    if (filteredRows.length === 0) return false;
    return filteredRows.every(m => selectedIds.has(m.id));
  }, [filteredRows, selectedIds]);

  const someSelectedOnPage = useMemo(() => {
    return filteredRows.some(m => selectedIds.has(m.id)) && !allSelectedOnPage;
  }, [filteredRows, selectedIds, allSelectedOnPage]);

  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (allSelectedOnPage) {
        filteredRows.forEach(m => newSelected.delete(m.id));
      } else {
        filteredRows.forEach(m => newSelected.add(m.id));
      }
      return newSelected;
    });
  }, [allSelectedOnPage, filteredRows]);

  const toggleSelectOne = useCallback((id: string) => {
    setSelectedIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  // Acciones globales
  const handleBulkActivate = async () => {
    if (selectedModels.length === 0) {
      setMessage({ type: 'error', text: 'Por favor selecciona al menos un modelo' });
      return;
    }

    try {
      await Promise.all(selectedModels.map(model => 
        api.put(`/asset-models/${model.id}`, { status: 'ACTIVE' })
      ));
      setMessage({ type: 'success', text: `${selectedModels.length} modelo(s) activado(s) exitosamente` });
      setSelectedIds(new Set());
      loadModels();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al activar modelos' });
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedModels.length === 0) {
      setMessage({ type: 'error', text: 'Por favor selecciona al menos un modelo' });
      return;
    }

    try {
      await Promise.all(selectedModels.map(model => 
        api.put(`/asset-models/${model.id}`, { status: 'INACTIVE' })
      ));
      setMessage({ type: 'success', text: `${selectedModels.length} modelo(s) desactivado(s) exitosamente` });
      setSelectedIds(new Set());
      loadModels();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al desactivar modelos' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedModels.length === 0) {
      setMessage({ type: 'error', text: 'Por favor selecciona al menos un modelo' });
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar ${selectedModels.length} modelo(s)?`)) {
      return;
    }

    try {
      await Promise.all(selectedModels.map(model => 
        api.delete(`/asset-models/${model.id}`)
      ));
      setMessage({ type: 'success', text: `${selectedModels.length} modelo(s) eliminado(s) exitosamente` });
      setSelectedIds(new Set());
      loadModels();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al eliminar modelos' });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Modelos de Activos"
        subtitle="Catálogo de modelos por fabricante/tipo"
        action={
          <PageHeaderActionButton
            label="Nuevo Modelo"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedModel(null);
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
              Lista de Modelos ({filteredRows.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {/* Botones de acciones globales */}
              {selectedIds.size > 0 && (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={handleBulkActivate}
                  >
                    Activar ({selectedIds.size})
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    onClick={handleBulkDeactivate}
                  >
                    Desactivar
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                      setIsBulkEditMode(true);
                      setEditDialogOpen(true);
                    }}
                  >
                    Modificar
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={handleBulkDelete}
                  >
                    Eliminar
                  </Button>
                </>
              )}
              <Tooltip title="Exportar">
                <IconButton onClick={(e) => setExportMenuAnchor(e.currentTarget)}>
                  <ExportIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Importar">
                <IconButton onClick={(e) => setImportMenuAnchor(e.currentTarget)}>
                  <ImportIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Filters and Actions */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showInactiveModels}
                  onChange={(e) => setShowInactiveModels(e.target.checked)}
                />
              }
              label="Mostrar modelos inactivos"
            />
            
            {filterField && shouldUseDropdown(filterField) ? (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Seleccionar {filterFieldOptions.find(f => f.value === filterField)?.label}</InputLabel>
                <Select
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  label={`Seleccionar ${filterFieldOptions.find(f => f.value === filterField)?.label}`}
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  {getUniqueFilterValues.map((value) => (
                    <MenuItem key={value} value={value}>
                      {value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                placeholder={filterField ? `Buscar por ${filterFieldOptions.find(f => f.value === filterField)?.label?.toLowerCase()}...` : "Buscar modelo..."}
                value={filterField ? filterValue : searchTerm}
                onChange={(e) => {
                  if (filterField) {
                    setFilterValue(e.target.value);
                  } else {
                    setSearchTerm(e.target.value);
                  }
                }}
                size="small"
                sx={{ minWidth: 200 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            )}
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Filtrar por...</InputLabel>
              <Select
                value={filterField}
                onChange={(e) => {
                  setFilterField(e.target.value);
                  setFilterValue('');
                  setSearchTerm('');
                }}
                label="Filtrar por..."
              >
                {filterFieldOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Tooltip title="Configurar columnas">
              <IconButton onClick={() => setColumnsDialogOpen(true)}>
                <WrenchIcon />
              </IconButton>
            </Tooltip>
            
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={loadModels}
              sx={{
                backgroundColor: '#FF9800',
                '&:hover': { backgroundColor: '#F57C00' }
              }}
            >
              Actualizar
            </Button>
          </Box>

          {/* Tabla */}
          <TableContainer component={Paper} sx={{ borderRadius: 1 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: PRIMARY.main }}>
                  <TableCell padding="checkbox" sx={{ color: 'white' }}>
                    <Checkbox
                      indeterminate={someSelectedOnPage}
                      checked={allSelectedOnPage}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectAllOnPage();
                      }}
                      sx={{
                        color: 'white',
                        '&.Mui-checked': {
                          color: 'white',
                        },
                        '&.MuiCheckbox-indeterminate': {
                          color: 'white',
                        },
                      }}
                      inputProps={{
                        'aria-label': 'Seleccionar todos',
                      }}
                    />
                  </TableCell>
                  {visibleColumns.map((column) => (
                    <TableCell
                      key={column.id}
                      sx={{
                        color: 'white',
                        fontWeight: 600,
                        textAlign: column.id === 'actions' ? 'center' : 'left',
                      }}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + 1} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        {searchTerm ? 'No se encontraron modelos' : 'No hay modelos registrados'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((model) => (
                    <TableRow key={model.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.has(model.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectOne(model.id);
                          }}
                          inputProps={{
                            'aria-label': `Seleccionar modelo ${model.name}`,
                          }}
                        />
                      </TableCell>
                      {visibleColumns.map((column) => {
                        switch (column.id) {
                          case 'manufacturerLogo':
                            return (
                              <TableCell key={column.id}>
                                {model.manufacturer?.logo ? (
                                  <Avatar
                                    src={model.manufacturer.logo}
                                    alt={model.manufacturer.name}
                                    sx={{
                                      width: 40,
                                      height: 40,
                                      border: '2px solid #FF6B6B',
                                      bgcolor: 'rgba(255, 107, 107, 0.1)',
                                    }}
                                  />
                                ) : (
                                  <Avatar
                                    sx={{
                                      width: 40,
                                      height: 40,
                                      border: '2px solid #FF6B6B',
                                      bgcolor: 'rgba(255, 107, 107, 0.1)',
                                    }}
                                  >
                                    {model.manufacturer?.name?.charAt(0).toUpperCase() || '?'}
                                  </Avatar>
                                )}
                              </TableCell>
                            );
                          case 'name':
                            return (
                              <TableCell key={column.id} sx={{ fontWeight: 500 }}>
                                <Box
                                  component="span"
                                  onClick={() => navigate(`/assets/by-model/${model.id}`)}
                                  sx={{
                                    color: '#FF6B6B',
                                    cursor: 'pointer',
                                    '&:hover': {
                                      textDecoration: 'underline',
                                      color: '#FF5252'
                                    }
                                  }}
                                >
                                  {model.name}
                                </Box>
                              </TableCell>
                            );
                          case 'manufacturer':
                            return (
                              <TableCell key={column.id}>
                                {model.manufacturer?.name ? (
                                  <Chip 
                                    label={model.manufacturer.name} 
                                    size="small"
                                    onClick={() => navigate(`/assets/by-manufacturer/${model.manufacturer?.id}`)}
                                    sx={{
                                      cursor: 'pointer',
                                      '&:hover': {
                                        backgroundColor: 'rgba(255, 107, 107, 0.1)'
                                      }
                                    }}
                                  />
                                ) : (
                                  <Typography variant="body2" color="textSecondary">
                                    -
                                  </Typography>
                                )}
                              </TableCell>
                            );
                          case 'type':
                            return (
                              <TableCell key={column.id}>
                                {model.type ? (
                                  <Chip 
                                    label={model.type.label || model.type.name} 
                                    size="small" 
                                    variant="outlined"
                                    onClick={() => navigate(`/assets/by-type/${model.type?.id}`)}
                                    sx={{
                                      cursor: 'pointer',
                                      '&:hover': {
                                        backgroundColor: 'rgba(255, 107, 107, 0.1)'
                                      }
                                    }}
                                  />
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                            );
                          case 'partNumber':
                            return (
                              <TableCell key={column.id}>
                                {model.partNumber ? (
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                    {model.partNumber}
                                  </Typography>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                            );
                          case 'status':
                            return (
                              <TableCell key={column.id}>
                                <Chip
                                  label={model.status || 'ACTIVE'}
                                  color={(model.status || 'ACTIVE') === 'ACTIVE' ? 'success' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                            );
                          case 'referenceImage':
                            return (
                              <TableCell key={column.id}>
                                {model.referenceImage ? (
                                  <Avatar
                                    src={model.referenceImage}
                                    alt={model.name}
                                    sx={{
                                      width: 40,
                                      height: 40,
                                      border: '2px solid #4CAF50',
                                      bgcolor: 'rgba(76, 175, 80, 0.1)',
                                    }}
                                  />
                                ) : (
                                  <Avatar
                                    sx={{
                                      width: 40,
                                      height: 40,
                                      border: '2px solid #9E9E9E',
                                      bgcolor: 'rgba(158, 158, 158, 0.1)',
                                    }}
                                  >
                                    <Box sx={{ fontSize: '0.75rem', color: '#9E9E9E' }}>IMG</Box>
                                  </Avatar>
                                )}
                              </TableCell>
                            );
                          case 'actions':
                            return (
                              <TableCell key={column.id} align="center">
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                  <Tooltip title="Ver">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleViewModel(model)}
                                      sx={{ color: '#2196F3' }}
                                    >
                                      <ViewIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Editar">
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setSelectedModel(model);
                                        setEditDialogOpen(true);
                                      }}
                                      sx={{ color: '#FF9800' }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Eliminar">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDelete(model)}
                                      sx={{ color: '#F44336' }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            );
                          default:
                            return null;
                        }
                      })}
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
          setSelectedModel(null);
          setEditDialogOpen(true);
        }}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          background: PRIMARY_GRADIENT,
          '&:hover': {
            background: 'linear-gradient(135deg, #E55A5A 0%, #E57A5A 100%)'
          }
        }}
      >
        <AddIcon />
      </Fab>

      {/* Export/Import Menus */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setExportMenuAnchor(null); /* TODO: Implement export */ }}>
          Exportar a Excel
        </MenuItem>
        <MenuItem onClick={() => { setExportMenuAnchor(null); /* TODO: Implement export */ }}>
          Exportar a CSV
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={importMenuAnchor}
        open={Boolean(importMenuAnchor)}
        onClose={() => setImportMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setImportMenuAnchor(null); /* TODO: Implement import */ }}>
          Importar desde Excel
        </MenuItem>
        <MenuItem onClick={() => { setImportMenuAnchor(null); /* TODO: Implement import */ }}>
          Importar desde CSV
        </MenuItem>
      </Menu>

      {/* Columns Configuration Dialog */}
      <MuiDialog open={columnsDialogOpen} onClose={() => setColumnsDialogOpen(false)} maxWidth="sm" fullWidth>
        <MuiDialogTitle>Configurar Columnas</MuiDialogTitle>
        <MuiDialogContent>
          <FormGroup>
            {columnsConfig.map((column, index) => (
              <Box
                key={column.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1,
                  borderBottom: index < columnsConfig.length - 1 ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={column.visible}
                      disabled={column.required}
                      onChange={(e) => {
                        const newConfig = columnsConfig.map(col =>
                          col.id === column.id ? { ...col, visible: e.target.checked } : col
                        );
                        setColumnsConfig(newConfig);
                      }}
                    />
                  }
                  label={column.label}
                  sx={{ flex: 1 }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    disabled={index === 0}
                    onClick={() => {
                      if (index > 0) {
                        const newConfig = [...columnsConfig];
                        [newConfig[index - 1], newConfig[index]] = [newConfig[index], newConfig[index - 1]];
                        setColumnsConfig(newConfig);
                      }
                    }}
                    sx={{
                      color: index === 0 ? 'disabled' : '#FF6B6B',
                      '&:hover': {
                        backgroundColor: index === 0 ? 'transparent' : 'rgba(255, 107, 107, 0.08)',
                      },
                    }}
                  >
                    <KeyboardArrowUp fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={index === columnsConfig.length - 1}
                    onClick={() => {
                      if (index < columnsConfig.length - 1) {
                        const newConfig = [...columnsConfig];
                        [newConfig[index], newConfig[index + 1]] = [newConfig[index + 1], newConfig[index]];
                        setColumnsConfig(newConfig);
                      }
                    }}
                    sx={{
                      color: index === columnsConfig.length - 1 ? 'disabled' : '#FF6B6B',
                      '&:hover': {
                        backgroundColor: index === columnsConfig.length - 1 ? 'transparent' : 'rgba(255, 107, 107, 0.08)',
                      },
                    }}
                  >
                    <KeyboardArrowDown fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </FormGroup>
        </MuiDialogContent>
        <MuiDialogActions>
          <Button onClick={() => setColumnsDialogOpen(false)}>Cerrar</Button>
        </MuiDialogActions>
      </MuiDialog>

      {/* ViewDialog para ver detalles */}
      {selectedModel && (
        <ViewDialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          onEdit={handleEditFromView}
          title={`Modelo: ${selectedModel.name}`}
          data={selectedModel}
          type="model"
        />
      )}

      {/* Formulario de edición */}
      <AssetModelForm
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedModel(null);
          setIsBulkEditMode(false);
          setSelectedIds(new Set());
        }}
        onSave={() => {
          loadModels();
          setEditDialogOpen(false);
          setSelectedModel(null);
          setIsBulkEditMode(false);
          setSelectedIds(new Set());
          setMessage({ type: 'success', text: isBulkEditMode ? `${selectedModels.length} modelo(s) actualizado(s) exitosamente` : 'Modelo actualizado exitosamente' });
        }}
        initialData={isBulkEditMode ? null : selectedModel}
        selectedModels={isBulkEditMode ? selectedModels : []}
        isBulkEdit={isBulkEditMode}
      />
    </Box>
  );
};

export default AssetModels;
