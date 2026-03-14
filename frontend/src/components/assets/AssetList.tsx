import React, { useEffect, useState, useMemo } from 'react';
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
  Grid,
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
import assetService from '../../services/assetService';
import api from '../../config/api';
import ViewDialog from '../common/ViewDialog';
import NewAssetModal from './NewAssetModal';
import AssetForm from './AssetForm';
import PageHeader from '../common/PageHeader';
import PageHeaderActionButton from '../common/PageHeaderActionButton';
import { PRIMARY, PRIMARY_GRADIENT } from '../../theme/themeTokens';

interface Asset {
  id: string;
  name: string;
  description?: string;
  serialNumber?: string;
  assetCode?: string;
  status: string;
  condition?: string;
  purchaseDate?: string;
  warrantyExpiration?: string;
  notes?: string;
  commentary?: string;
  location?: string;
  purchaseValue?: number;
  category?: { id: string; name: string; label?: string };
  group?: { id: string; name: string };
  type?: { id: string; name: string };
  model?: { id: string; name: string };
  company?: { id: string; name: string };
  headquarters?: { id: string; name: string };
  assignedUser?: { id: string; firstName: string; lastName: string };
  purchasedByCompany?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

const COLUMN_OPTIONS = [
  { id: 'name', label: 'Activo', visible: true, required: true },
  { id: 'assetCode', label: 'Código', visible: true, required: false },
  { id: 'category', label: 'Categoría', visible: true, required: false },
  { id: 'model', label: 'Modelo', visible: true, required: false },
  { id: 'assignedUser', label: 'Usuario', visible: true, required: false },
  { id: 'status', label: 'Estado', visible: true, required: false },
  { id: 'actions', label: 'Acciones', visible: true, required: true },
];

const COLUMNS_CONFIG_STORAGE_KEY = 'itd_assetlist_columns_config';

const AssetList: React.FC = () => {
  const [rows, setRows] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterField, setFilterField] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
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
  const [showInactiveAssets, setShowInactiveAssets] = useState(false);

  // Opciones de campos para filtrar
  const filterFieldOptions = [
    { value: '', label: 'Todos los campos' },
    { value: 'name', label: 'Activo' },
    { value: 'assetCode', label: 'Código' },
    { value: 'category', label: 'Categoría' },
    { value: 'model', label: 'Modelo' },
    { value: 'assignedUser', label: 'Usuario' },
    { value: 'status', label: 'Estado' },
  ];

  // Determinar si el campo necesita un dropdown (select) o un campo de texto
  const shouldUseDropdown = (field: string): boolean => {
    return ['category', 'model', 'assignedUser', 'status', 'assetCode'].includes(field);
  };

  // Obtener valores únicos para campos filtrables
  const getUniqueFilterValues = useMemo(() => {
    if (!filterField || rows.length === 0) return [];
    
    const values = new Set<string>();
    rows.forEach(row => {
      if (filterField === 'category') {
        const value = row.category?.label || row.category?.name || '';
        if (value) values.add(value);
      } else if (filterField === 'model') {
        const value = row.model?.name || '';
        if (value) values.add(value);
      } else if (filterField === 'assignedUser') {
        const value = row.assignedUser ? `${row.assignedUser.firstName} ${row.assignedUser.lastName || ''}`.trim() : '';
        if (value) values.add(value);
      } else if (filterField === 'status') {
        const value = row.status || '';
        if (value) values.add(value);
      } else {
        const value = row[filterField as keyof Asset];
        if (value !== undefined && value !== null) {
          values.add(String(value));
        }
      }
    });
    return Array.from(values).sort();
  }, [filterField, rows]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await assetService.list();
      const data = res.data || res.items || res || [];
      setRows(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Error al cargar activos: ${error.response?.data?.error || error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setViewDialogOpen(true);
  };

  const handleEditFromView = () => {
    setViewDialogOpen(false);
    setEditDialogOpen(true);
  };

  const handleDelete = async (asset: Asset) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el activo "${asset.name || asset.assetCode || asset.serialNumber}"?`)) {
      try {
        await api.delete(`/assets/${asset.id}`);
        setMessage({ type: 'success', text: 'Activo eliminado exitosamente' });
        load();
      } catch (error: any) {
        setMessage({
          type: 'error',
          text: `Error al eliminar: ${error.response?.data?.error || error.message}`
        });
      }
    }
  };

  const filteredRows = rows.filter(asset => {
    // Búsqueda general (si no hay filtro específico)
    const matchesGeneralSearch = !filterField && (
      (asset.name && asset.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.assetCode && asset.assetCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.serialNumber && asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.description && asset.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Filtro de inactivos (siempre aplicado)
    const matchesInactive = showInactiveAssets || asset.status === 'ACTIVE';
    if (!matchesInactive) return false;

    // Filtro específico por campo
    if (filterField) {
      const searchText = filterValue.toLowerCase();
      if (!searchText) return true;

      if (filterField === 'category') {
        const categoryName = asset.category?.label || asset.category?.name || '';
        return categoryName.toLowerCase().includes(searchText);
      }

      if (filterField === 'model') {
        const modelName = asset.model?.name || '';
        return modelName.toLowerCase().includes(searchText);
      }

      if (filterField === 'assignedUser') {
        const userName = asset.assignedUser 
          ? `${asset.assignedUser.firstName} ${asset.assignedUser.lastName || ''}`.trim().toLowerCase()
          : '';
        return userName.includes(searchText);
      }

      const fieldValue = asset[filterField as keyof Asset];
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

  if (loading && rows.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Gestión de Activos"
        subtitle="Administra los activos del sistema"
        action={
          <PageHeaderActionButton
            label="Nuevo Activo"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedAsset(null);
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
              Lista de Activos ({filteredRows.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
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
                  checked={showInactiveAssets}
                  onChange={(e) => setShowInactiveAssets(e.target.checked)}
                />
              }
              label="Mostrar activos inactivos"
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
                placeholder={filterField ? `Buscar por ${filterFieldOptions.find(f => f.value === filterField)?.label?.toLowerCase()}...` : "Buscar activo..."}
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
              onClick={load}
              color="primary"
            >
              Actualizar
            </Button>
          </Box>

          {/* Tabla */}
          <TableContainer component={Paper} sx={{ borderRadius: 1 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: PRIMARY.main }}>
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
                    <TableCell colSpan={visibleColumns.length} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        {searchTerm ? 'No se encontraron activos' : 'No hay activos registrados'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((asset) => (
                    <TableRow key={asset.id} hover>
                      {visibleColumns.find(col => col.id === 'name') && (
                        <TableCell sx={{ fontWeight: 500 }}>
                          {asset.name || asset.assetCode || asset.serialNumber || '-'}
                        </TableCell>
                      )}
                      {visibleColumns.find(col => col.id === 'assetCode') && (
                        <TableCell>
                          {asset.assetCode ? (
                            <Chip label={asset.assetCode} size="small" variant="outlined" />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.find(col => col.id === 'category') && (
                        <TableCell>
                          {asset.category ? (
                            <Chip label={asset.category.label || asset.category.name} size="small" />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.find(col => col.id === 'model') && (
                        <TableCell>
                          {asset.model ? (
                            <Typography variant="body2">{asset.model.name}</Typography>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.find(col => col.id === 'assignedUser') && (
                        <TableCell>
                          {asset.assignedUser ? (
                            <Typography variant="body2">
                              {asset.assignedUser.firstName} {asset.assignedUser.lastName || ''}
                            </Typography>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.find(col => col.id === 'status') && (
                        <TableCell>
                          <Chip
                            label={asset.status || 'ACTIVE'}
                            color={(asset.status || 'ACTIVE') === 'ACTIVE' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      )}
                      {visibleColumns.find(col => col.id === 'actions') && (
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <Tooltip title="Ver">
                              <IconButton
                                size="small"
                                onClick={() => handleViewAsset(asset)}
                                sx={{ color: '#2196F3' }}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedAsset(asset);
                                  setEditDialogOpen(true);
                                }}
                                sx={{ color: 'warning.main' }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(asset)}
                                sx={{ color: '#F44336' }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      )}
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
          setSelectedAsset(null);
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
                      color: index === 0 ? 'disabled' : 'primary.main',
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
                      color: index === columnsConfig.length - 1 ? 'disabled' : 'primary.main',
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
      {selectedAsset && (
        <ViewDialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          onEdit={handleEditFromView}
          title={`Activo: ${selectedAsset.name || selectedAsset.assetCode || selectedAsset.serialNumber || 'Sin nombre'}`}
          data={selectedAsset}
          type="company"
        />
      )}

      {/* Modal de creación de activo */}
      <NewAssetModal
        open={editDialogOpen && !selectedAsset}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedAsset(null);
        }}
        onSuccess={() => {
          load();
          setEditDialogOpen(false);
          setSelectedAsset(null);
        }}
      />
      
      {/* TODO: Modal de edición - Por ahora mantener AssetForm para edición */}
      {selectedAsset && editDialogOpen && (
        <AssetForm
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedAsset(null);
          }}
          onSave={() => {
            load();
            setEditDialogOpen(false);
            setSelectedAsset(null);
          }}
          initialData={selectedAsset}
        />
      )}
    </Box>
  );
};

export default AssetList;
