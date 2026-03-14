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
import AssetTypeForm from './AssetTypeForm';
import PageHeader from '../common/PageHeader';
import PageHeaderActionButton from '../common/PageHeaderActionButton';
import { PRIMARY, PRIMARY_GRADIENT } from '../../theme/themeTokens';

interface AssetType {
  id: string;
  groupId: string;
  categoryId?: string;
  name: string;
  label?: string; // Label para mostrar (si está vacío, usar name)
  description?: string; // Cambiado de 'code' a 'description'
  status: string;
  createdAt?: string;
  updatedAt?: string;
  group?: {
    id: string;
    name: string;
    label?: string;
    category?: {
      id: string;
      name: string;
      label?: string;
    };
  };
  category?: {
    id: string;
    name: string;
    label?: string;
  };
}

const COLUMN_OPTIONS = [
  { id: 'name', label: 'Nombre', visible: true, required: true },
  { id: 'description', label: 'Descripción', visible: true, required: false },
  { id: 'category', label: 'Categoría', visible: true, required: false },
  { id: 'group', label: 'Grupo', visible: true, required: false },
  { id: 'status', label: 'Estado', visible: true, required: false },
  { id: 'actions', label: 'Acciones', visible: true, required: true },
];

const COLUMNS_CONFIG_STORAGE_KEY = 'itd_assettypes_columns_config';

const AssetTypes: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterField, setFilterField] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [selectedType, setSelectedType] = useState<AssetType | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [columnsConfig, setColumnsConfig] = useState(() => {
    const saved = localStorage.getItem(COLUMNS_CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrar 'code' a 'description' si existe configuración antigua
      const migrated = parsed.map((col: any) => {
        if (col.id === 'code') {
          return { ...col, id: 'description', label: 'Descripción' };
        }
        return col;
      });
      // Si no existe 'description' después de la migración, agregarlo
      if (!migrated.find((col: any) => col.id === 'description')) {
        migrated.push({ id: 'description', label: 'Descripción', visible: true, required: false });
      }
      // Si no existe 'category' después de la migración, agregarlo
      if (!migrated.find((col: any) => col.id === 'category')) {
        // Insertar después de 'description' y antes de 'group' si existe
        const descIndex = migrated.findIndex((col: any) => col.id === 'description');
        const groupIndex = migrated.findIndex((col: any) => col.id === 'group');
        const insertIndex = groupIndex !== -1 ? groupIndex : descIndex !== -1 ? descIndex + 1 : migrated.length;
        migrated.splice(insertIndex, 0, { id: 'category', label: 'Categoría', visible: true, required: false });
      }
      // Eliminar 'code' si todavía existe
      const cleaned = migrated.filter((col: any) => col.id !== 'code');
      // Guardar la configuración migrada
      localStorage.setItem(COLUMNS_CONFIG_STORAGE_KEY, JSON.stringify(cleaned));
      return cleaned;
    }
    return COLUMN_OPTIONS;
  });
  const [columnsDialogOpen, setColumnsDialogOpen] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [importMenuAnchor, setImportMenuAnchor] = useState<null | HTMLElement>(null);
  const [showInactiveTypes, setShowInactiveTypes] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);

  // Opciones de campos para filtrar
  const filterFieldOptions = [
    { value: '', label: 'Todos los campos' },
    { value: 'name', label: 'Nombre' },
    { value: 'description', label: 'Descripción' },
    { value: 'category', label: 'Categoría' },
    { value: 'group', label: 'Grupo' },
    { value: 'status', label: 'Estado' },
  ];

  // Determinar si el campo necesita un dropdown (select) o un campo de texto
  const shouldUseDropdown = (field: string): boolean => {
    return ['description', 'category', 'group', 'status'].includes(field);
  };

  // Obtener valores únicos para campos filtrables
  const getUniqueFilterValues = useMemo(() => {
    if (!filterField || rows.length === 0) return [];
    
    const values = new Set<string>();
    rows.forEach(row => {
      if (filterField === 'category') {
        const value = row.group?.category?.label || row.group?.category?.name || row.category?.label || row.category?.name || '';
        if (value) values.add(value);
      } else if (filterField === 'group') {
        const value = row.group?.label || row.group?.name || '';
        if (value) values.add(value);
      } else if (filterField === 'description') {
        const value = row.description || '';
        if (value) values.add(value);
      } else if (filterField === 'status') {
        const value = row.status || '';
        if (value) values.add(value);
      } else {
        const value = row[filterField as keyof AssetType];
        if (value !== undefined && value !== null) {
          values.add(String(value));
        }
      }
    });
    return Array.from(values).sort();
  }, [filterField, rows]);

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      setLoading(true);
      const response = await assetCatalogService.getTypes();
      const data = response.data || response || [];
      setRows(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Error al cargar tipos: ${error.response?.data?.error || error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewType = (type: AssetType) => {
    setSelectedType(type);
    setViewDialogOpen(true);
  };

  const handleEditFromView = () => {
    setViewDialogOpen(false);
    // selectedType ya está establecido cuando se abre ViewDialog
    setEditDialogOpen(true);
  };

  const handleDelete = async (type: AssetType) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el tipo "${type.label || type.name}"?`)) {
      try {
        await api.delete(`/asset-types/${type.id}`);
        setMessage({ type: 'success', text: 'Tipo eliminado exitosamente' });
        loadTypes();
      } catch (error: any) {
        setMessage({
          type: 'error',
          text: `Error al eliminar: ${error.response?.data?.error || error.message}`
        });
      }
    }
  };

  const filteredRows = rows.filter(type => {
    // Búsqueda general (si no hay filtro específico)
    const matchesGeneralSearch = !filterField && (
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (type.label && type.label.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (type.group?.category && (type.group.category.label || type.group.category.name)?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (type.category && (type.category.label || type.category.name)?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (type.group && (type.group.label || type.group.name)?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Filtro de inactivos (siempre aplicado)
    const matchesInactive = showInactiveTypes || type.status === 'ACTIVE';
    if (!matchesInactive) return false;

    // Filtro específico por campo
    if (filterField) {
      const searchText = filterValue.toLowerCase();
      if (!searchText) return true;

      if (filterField === 'category') {
        const categoryName = type.group?.category?.label || type.group?.category?.name || type.category?.label || type.category?.name || '';
        return categoryName.toLowerCase().includes(searchText);
      } else if (filterField === 'group') {
        const groupName = type.group?.label || type.group?.name || '';
        return groupName.toLowerCase().includes(searchText);
      }

      const fieldValue = type[filterField as keyof AssetType];
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
  const selectedTypes = useMemo(() => {
    return filteredRows.filter(type => selectedIds.has(type.id));
  }, [filteredRows, selectedIds]);

  const allSelectedOnPage = useMemo(() => {
    if (filteredRows.length === 0) return false;
    return filteredRows.every(t => selectedIds.has(t.id));
  }, [filteredRows, selectedIds]);

  const someSelectedOnPage = useMemo(() => {
    return filteredRows.some(t => selectedIds.has(t.id)) && !allSelectedOnPage;
  }, [filteredRows, selectedIds, allSelectedOnPage]);

  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (allSelectedOnPage) {
        filteredRows.forEach(t => newSelected.delete(t.id));
      } else {
        filteredRows.forEach(t => newSelected.add(t.id));
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
    if (selectedTypes.length === 0) {
      setMessage({ type: 'error', text: 'Por favor selecciona al menos un tipo' });
      return;
    }

    try {
      await Promise.all(selectedTypes.map(type => 
        api.put(`/asset-types/${type.id}`, { status: 'ACTIVE' })
      ));
      setMessage({ type: 'success', text: `${selectedTypes.length} tipo(s) activado(s) exitosamente` });
      setSelectedIds(new Set());
      loadTypes();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al activar tipos' });
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedTypes.length === 0) {
      setMessage({ type: 'error', text: 'Por favor selecciona al menos un tipo' });
      return;
    }

    try {
      await Promise.all(selectedTypes.map(type => 
        api.put(`/asset-types/${type.id}`, { status: 'INACTIVE' })
      ));
      setMessage({ type: 'success', text: `${selectedTypes.length} tipo(s) desactivado(s) exitosamente` });
      setSelectedIds(new Set());
      loadTypes();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al desactivar tipos' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTypes.length === 0) {
      setMessage({ type: 'error', text: 'Por favor selecciona al menos un tipo' });
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar ${selectedTypes.length} tipo(s)?`)) {
      return;
    }

    try {
      await Promise.all(selectedTypes.map(type => 
        api.delete(`/asset-types/${type.id}`)
      ));
      setMessage({ type: 'success', text: `${selectedTypes.length} tipo(s) eliminado(s) exitosamente` });
      setSelectedIds(new Set());
      loadTypes();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al eliminar tipos' });
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
        title="Tipos de Activos"
        subtitle="Administra tipos dentro de grupos"
        action={
          <PageHeaderActionButton
            label="Nuevo Tipo"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedType(null);
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
              Lista de Tipos ({filteredRows.length})
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
                  checked={showInactiveTypes}
                  onChange={(e) => setShowInactiveTypes(e.target.checked)}
                />
              }
              label="Mostrar tipos inactivos"
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
                placeholder={filterField ? `Buscar por ${filterFieldOptions.find(f => f.value === filterField)?.label?.toLowerCase()}...` : "Buscar tipo..."}
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
                onClick={loadTypes}
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
                        {searchTerm ? 'No se encontraron tipos' : 'No hay tipos registrados'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((type) => (
                    <TableRow key={type.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.has(type.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectOne(type.id);
                          }}
                          inputProps={{
                            'aria-label': `Seleccionar tipo ${type.label || type.name}`,
                          }}
                        />
                      </TableCell>
                      {visibleColumns.find(col => col.id === 'name') && (
                        <TableCell sx={{ fontWeight: 500 }}>
                          <Box
                            component="span"
                            onClick={() => navigate(`/assets/by-type/${type.id}`)}
                            sx={{
                              color: PRIMARY.main,
                              cursor: 'pointer',
                              '&:hover': {
                                textDecoration: 'underline',
                                color: PRIMARY.dark
                              }
                            }}
                          >
                            {type.label || type.name}
                          </Box>
                        </TableCell>
                      )}
                      {visibleColumns.find(col => col.id === 'description') && (
                        <TableCell sx={{ maxWidth: 300 }}>
                          {type.description ? (
                            type.description.length > 200 ? (
                              <Tooltip title={type.description} arrow>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    cursor: 'help',
                                  }}
                                >
                                  {type.description.substring(0, 200)}...
                                </Typography>
                              </Tooltip>
                            ) : (
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {type.description}
                              </Typography>
                            )
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.find(col => col.id === 'category') && (
                        <TableCell>
                          {type.group?.category ? (
                            <Chip 
                              label={type.group.category.label || type.group.category.name} 
                              size="small" 
                              variant="outlined"
                              onClick={() => navigate(`/assets/category/${type.group?.category?.id}/groups`)}
                              sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 107, 107, 0.1)'
                                }
                              }}
                            />
                          ) : type.category ? (
                            <Chip 
                              label={type.category.label || type.category.name} 
                              size="small" 
                              variant="outlined"
                              onClick={() => navigate(`/assets/category/${type.category?.id}/groups`)}
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
                      )}
                      {visibleColumns.find(col => col.id === 'group') && (
                        <TableCell>
                          {type.group?.name ? (
                            <Chip 
                              label={type.group.label || type.group.name} 
                              size="small"
                              onClick={() => navigate(`/assets/by-group/${type.group?.id}`)}
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
                      )}
                      {visibleColumns.find(col => col.id === 'status') && (
                        <TableCell>
                          <Chip
                            label={type.status || 'ACTIVE'}
                            color={(type.status || 'ACTIVE') === 'ACTIVE' ? 'success' : 'default'}
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
                                onClick={() => handleViewType(type)}
                                sx={{ color: '#2196F3' }}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedType(type);
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
                                onClick={() => handleDelete(type)}
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
          setSelectedType(null);
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
      {selectedType && (
        <ViewDialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          onEdit={handleEditFromView}
          title={`Tipo: ${selectedType.name}`}
          data={selectedType}
          type="type"
        />
      )}

      {/* Formulario de edición */}
      <AssetTypeForm
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedType(null);
          setIsBulkEditMode(false);
          setSelectedIds(new Set());
        }}
        onSave={() => {
          loadTypes();
          setEditDialogOpen(false);
          setSelectedType(null);
          setIsBulkEditMode(false);
          setSelectedIds(new Set());
          setMessage({ type: 'success', text: isBulkEditMode ? `${selectedTypes.length} tipo(s) actualizado(s) exitosamente` : 'Tipo actualizado exitosamente' });
        }}
        initialData={isBulkEditMode ? null : selectedType}
        selectedTypes={isBulkEditMode ? selectedTypes : []}
        isBulkEdit={isBulkEditMode}
      />
    </Box>
  );
};

export default AssetTypes;
