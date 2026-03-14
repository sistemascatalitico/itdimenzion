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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
} from '@mui/material';
import assetCatalogService from '../../services/assetCatalogService';
import api from '../../config/api';
import ViewDialog from '../common/ViewDialog';
import AssetCategoryForm from './AssetCategoryForm';
import PageHeader from '../common/PageHeader';
import PageHeaderActionButton from '../common/PageHeaderActionButton';
import { PRIMARY, PRIMARY_GRADIENT } from '../../theme/themeTokens';

interface Category {
  id: string;
  name: string;
  label?: string;
  description?: string;
  status: string;
  isPersistent?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

const COLUMN_OPTIONS = [
  { id: 'name', label: 'Nombre', visible: true, required: true },
  { id: 'label', label: 'Etiqueta', visible: true, required: false },
  { id: 'description', label: 'Descripción', visible: true, required: false },
  { id: 'isPersistent', label: 'Persistente', visible: true, required: false },
  { id: 'status', label: 'Estado', visible: true, required: false },
  { id: 'actions', label: 'Acciones', visible: true, required: true },
];

const COLUMNS_CONFIG_STORAGE_KEY = 'itd_assetcategories_columns_config';

const AssetCategories: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterField, setFilterField] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
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
  const [showInactiveCategories, setShowInactiveCategories] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Opciones de campos para filtrar
  const filterFieldOptions = [
    { value: '', label: 'Todos los campos' },
    { value: 'name', label: 'Nombre' },
    { value: 'label', label: 'Etiqueta' },
    { value: 'description', label: 'Descripción' },
    { value: 'status', label: 'Estado' },
  ];

  // Determinar si el campo necesita un dropdown (select) o un campo de texto
  const shouldUseDropdown = (field: string): boolean => {
    return ['label', 'status'].includes(field);
  };

  // Obtener valores únicos para campos filtrables
  const getUniqueFilterValues = useMemo(() => {
    if (!filterField || rows.length === 0) return [];
    
    const values = new Set<string>();
    rows.forEach(row => {
      if (filterField === 'label') {
        const value = row.label || '';
        if (value) values.add(value);
      } else if (filterField === 'status') {
        const value = row.status || '';
        if (value) values.add(value);
      } else {
        const value = row[filterField as keyof Category];
        if (value !== undefined && value !== null) {
          values.add(String(value));
        }
      }
    });
    return Array.from(values).sort();
  }, [filterField, rows]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await assetCatalogService.getCategories();
      const data = response.data || response || [];
      setRows(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Error al cargar categorías: ${error.response?.data?.error || error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewCategory = (category: Category) => {
    setSelectedCategory(category);
    setViewDialogOpen(true);
  };

  const handleEditFromView = () => {
    setViewDialogOpen(false);
    // selectedCategory ya está establecido cuando se abre ViewDialog
    setEditDialogOpen(true);
  };

  const handleDelete = async (category: Category) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la categoría "${category.label || category.name}"?`)) {
      try {
        await api.delete(`/asset-categories/${category.id}`);
        setMessage({ type: 'success', text: 'Categoría eliminada exitosamente' });
        loadCategories();
      } catch (error: any) {
        setMessage({
          type: 'error',
          text: `Error al eliminar: ${error.response?.data?.error || error.message}`
        });
      }
    }
  };

  const filteredRows = rows.filter(category => {
    // Búsqueda general (si no hay filtro específico)
    const matchesGeneralSearch = !filterField && (
      (category.label || category.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Filtro de inactivos (siempre aplicado)
    const matchesInactive = showInactiveCategories || category.status === 'ACTIVE';
    if (!matchesInactive) return false;

    // Filtro específico por campo
    if (filterField) {
      const fieldValue = category[filterField as keyof Category];
      if (!fieldValue) return false;
      
      const searchText = filterValue.toLowerCase();
      const fieldText = String(fieldValue).toLowerCase();
      
      if (!searchText) return true; // Si no hay valor, mostrar todos
      
      return fieldText.includes(searchText);
    }

    return matchesGeneralSearch || !searchTerm; // Si hay búsqueda general, aplicarla; si no, mostrar todos
  });

  const visibleColumns = columnsConfig.filter(col => col.visible);

  // Guardar configuración en localStorage cuando cambie
  React.useEffect(() => {
    localStorage.setItem(COLUMNS_CONFIG_STORAGE_KEY, JSON.stringify(columnsConfig));
  }, [columnsConfig]);

  // Funciones para manejo de selección
  const selectedCategories = useMemo(() => {
    return filteredRows.filter(category => selectedIds.has(category.id));
  }, [filteredRows, selectedIds]);

  const allSelectedOnPage = useMemo(() => {
    if (filteredRows.length === 0) return false;
    return filteredRows.every(cat => selectedIds.has(cat.id));
  }, [filteredRows, selectedIds]);

  const someSelectedOnPage = useMemo(() => {
    return filteredRows.some(cat => selectedIds.has(cat.id)) && !allSelectedOnPage;
  }, [filteredRows, selectedIds, allSelectedOnPage]);

  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (allSelectedOnPage) {
        // Deseleccionar todos los de la página actual
        filteredRows.forEach(cat => newSelected.delete(cat.id));
      } else {
        // Seleccionar todos los de la página actual (solo si no son persistentes)
        filteredRows.forEach(cat => {
          if (!cat.isPersistent) {
            newSelected.add(cat.id);
          }
        });
      }
      return newSelected;
    });
  }, [allSelectedOnPage, filteredRows]);

  const toggleSelectOne = useCallback((id: string, isPersistent?: boolean) => {
    if (isPersistent) {
      setMessage({ 
        type: 'error', 
        text: 'No se pueden seleccionar categorías persistentes (objetos de sistema) para modificaciones globales' 
      });
      return;
    }
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
    const persistentCategories = selectedCategories.filter(cat => cat.isPersistent);
    if (persistentCategories.length > 0) {
      setMessage({ 
        type: 'error', 
        text: `No se pueden modificar categorías persistentes: ${persistentCategories.map(c => c.label || c.name).join(', ')}. Por favor, deselecciónelas.` 
      });
      return;
    }

    if (selectedCategories.length === 0) {
      setMessage({ type: 'error', text: 'Por favor selecciona al menos una categoría' });
      return;
    }

    try {
      await Promise.all(selectedCategories.map(cat => 
        api.put(`/asset-categories/${cat.id}`, { status: 'ACTIVE' })
      ));
      setMessage({ type: 'success', text: `${selectedCategories.length} categoría(s) activada(s) exitosamente` });
      setSelectedIds(new Set());
      loadCategories();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al activar categorías' });
    }
  };

  const handleBulkDeactivate = async () => {
    const persistentCategories = selectedCategories.filter(cat => cat.isPersistent);
    if (persistentCategories.length > 0) {
      setMessage({ 
        type: 'error', 
        text: `No se pueden modificar categorías persistentes: ${persistentCategories.map(c => c.label || c.name).join(', ')}. Por favor, deselecciónelas.` 
      });
      return;
    }

    if (selectedCategories.length === 0) {
      setMessage({ type: 'error', text: 'Por favor selecciona al menos una categoría' });
      return;
    }

    try {
      await Promise.all(selectedCategories.map(cat => 
        api.put(`/asset-categories/${cat.id}`, { status: 'INACTIVE' })
      ));
      setMessage({ type: 'success', text: `${selectedCategories.length} categoría(s) desactivada(s) exitosamente` });
      setSelectedIds(new Set());
      loadCategories();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al desactivar categorías' });
    }
  };

  const handleBulkDelete = async () => {
    const persistentCategories = selectedCategories.filter(cat => cat.isPersistent);
    if (persistentCategories.length > 0) {
      setMessage({ 
        type: 'error', 
        text: `No se pueden eliminar categorías persistentes: ${persistentCategories.map(c => c.label || c.name).join(', ')}. Por favor, deselecciónelas.` 
      });
      return;
    }

    if (selectedCategories.length === 0) {
      setMessage({ type: 'error', text: 'Por favor selecciona al menos una categoría' });
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar ${selectedCategories.length} categoría(s)?`)) {
      return;
    }

    try {
      await Promise.all(selectedCategories.map(cat => 
        api.delete(`/asset-categories/${cat.id}`)
      ));
      setMessage({ type: 'success', text: `${selectedCategories.length} categoría(s) eliminada(s) exitosamente` });
      setSelectedIds(new Set());
      loadCategories();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al eliminar categorías' });
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
        title="Categorías de Activos"
        subtitle="Administra las categorías base (Hardware, Software, etc.)"
        action={
          <PageHeaderActionButton
            label="Nueva Categoría"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedCategory(null);
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
              Lista de Categorías ({filteredRows.length})
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
                  checked={showInactiveCategories}
                  onChange={(e) => setShowInactiveCategories(e.target.checked)}
                />
              }
              label="Mostrar categorías inactivas"
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
                placeholder={filterField ? `Buscar por ${filterFieldOptions.find(f => f.value === filterField)?.label?.toLowerCase()}...` : "Buscar categoría..."}
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
              onClick={loadCategories}
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
                        {searchTerm ? 'No se encontraron categorías' : 'No hay categorías registradas'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((category) => (
                    <TableRow key={category.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.has(category.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectOne(category.id, category.isPersistent);
                          }}
                          disabled={category.isPersistent}
                          inputProps={{
                            'aria-label': `Seleccionar categoría ${category.label || category.name}`,
                          }}
                        />
                      </TableCell>
                      {visibleColumns.find(col => col.id === 'name') && (
                        <TableCell sx={{ fontWeight: 500 }}>
                          <Box
                            component="span"
                            onClick={() => navigate(`/assets/category/${category.id}/groups`)}
                            sx={{
                              color: PRIMARY.main,
                              cursor: 'pointer',
                              '&:hover': {
                                textDecoration: 'underline',
                                color: PRIMARY.dark
                              }
                            }}
                          >
                            {category.label || category.name}
                          </Box>
                        </TableCell>
                      )}
                      {visibleColumns.find(col => col.id === 'label') && (
                        <TableCell>
                          <Box
                            component="span"
                            onClick={() => navigate(`/assets/category/${category.id}/groups`)}
                            sx={{
                              color: PRIMARY.main,
                              cursor: 'pointer',
                              '&:hover': {
                                textDecoration: 'underline',
                                color: PRIMARY.dark
                              }
                            }}
                          >
                            {category.label || '-'}
                          </Box>
                        </TableCell>
                      )}
                      {visibleColumns.find(col => col.id === 'description') && (
                        <TableCell sx={{ maxWidth: 300 }}>
                          {category.description ? (
                            category.description.length > 200 ? (
                              <Tooltip title={category.description} arrow>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    cursor: 'help',
                                    color: 'text.secondary',
                                  }}
                                >
                                  {category.description.substring(0, 200)}...
                                </Typography>
                              </Tooltip>
                            ) : (
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {category.description}
                              </Typography>
                            )
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.find(col => col.id === 'isPersistent') && (
                        <TableCell>
                          <Chip
                            label={category.isPersistent ? 'Sí' : 'No'}
                            color={category.isPersistent ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      )}
                      {visibleColumns.find(col => col.id === 'status') && (
                        <TableCell>
                          <Chip
                            label={category.status || 'ACTIVE'}
                            color={(category.status || 'ACTIVE') === 'ACTIVE' ? 'success' : 'default'}
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
                                onClick={() => handleViewCategory(category)}
                                sx={{ color: '#2196F3' }}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedCategory(category);
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
                                onClick={() => handleDelete(category)}
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
          setSelectedCategory(null);
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
      {selectedCategory && (
        <ViewDialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          onEdit={handleEditFromView}
          title={`Categoría: ${selectedCategory.label || selectedCategory.name}`}
          data={selectedCategory}
          type="category"
        />
      )}

      {/* Formulario de edición */}
      <AssetCategoryForm
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedCategory(null);
        }}
        onSave={() => {
          loadCategories();
          setEditDialogOpen(false);
          setSelectedCategory(null);
        }}
        initialData={selectedCategory}
      />
    </Box>
  );
};

export default AssetCategories;
