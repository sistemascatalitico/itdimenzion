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
import AssetGroupForm from './AssetGroupForm';
import PageHeader from '../common/PageHeader';
import PageHeaderActionButton from '../common/PageHeaderActionButton';
import { PRIMARY, PRIMARY_GRADIENT } from '../../theme/themeTokens';

interface Group {
  id: string;
  categoryId: string;
  name: string;
  label?: string; // Label para mostrar (si está vacío, usar name)
  description?: string;
  status: string;
  isSystem?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  category?: {
    id: string;
    name: string;
    label?: string;
  };
}

const COLUMN_OPTIONS = [
  { id: 'name', label: 'Nombre', visible: true, required: true },
  { id: 'category', label: 'Categoría', visible: true, required: false },
  { id: 'description', label: 'Descripción', visible: true, required: false },
  { id: 'isSystem', label: 'Sistema', visible: true, required: false },
  { id: 'status', label: 'Estado', visible: true, required: false },
  { id: 'actions', label: 'Acciones', visible: true, required: true },
];

const COLUMNS_CONFIG_STORAGE_KEY = 'itd_assetgroups_columns_config';

const AssetGroups: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterField, setFilterField] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
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
  const [showInactiveGroups, setShowInactiveGroups] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);

  // Opciones de campos para filtrar
  const filterFieldOptions = [
    { value: '', label: 'Todos los campos' },
    { value: 'name', label: 'Nombre' },
    { value: 'description', label: 'Descripción' },
    { value: 'category', label: 'Categoría' },
    { value: 'status', label: 'Estado' },
    { value: 'isSystem', label: 'Sistema' },
  ];

  // Determinar si el campo necesita un dropdown (select) o un campo de texto
  const shouldUseDropdown = (field: string): boolean => {
    return ['category', 'status', 'isSystem'].includes(field);
  };

  // Obtener valores únicos para campos filtrables
  const getUniqueFilterValues = useMemo(() => {
    if (!filterField || rows.length === 0) return [];
    
    const values = new Set<string>();
    rows.forEach(row => {
      if (filterField === 'category') {
        const value = row.category?.name || row.category?.label || '';
        if (value) values.add(value);
      } else if (filterField === 'status') {
        const value = row.status || '';
        if (value) values.add(value);
      } else if (filterField === 'isSystem') {
        values.add(row.isSystem ? 'Sí' : 'No');
      } else {
        const value = row[filterField as keyof Group];
        if (value !== undefined && value !== null) {
          values.add(String(value));
        }
      }
    });
    return Array.from(values).sort();
  }, [filterField, rows]);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await assetCatalogService.getGroups();
      const data = response.data || response || [];
      setRows(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Error al cargar grupos: ${error.response?.data?.error || error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewGroup = (group: Group) => {
    setSelectedGroup(group);
    setViewDialogOpen(true);
  };

  const handleEditFromView = () => {
    setViewDialogOpen(false);
    // selectedGroup ya está establecido cuando se abre ViewDialog
    setEditDialogOpen(true);
  };

  const handleDelete = async (group: Group) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el grupo "${group.name}"?`)) {
      try {
        await api.delete(`/asset-groups/${group.id}`);
        setMessage({ type: 'success', text: 'Grupo eliminado exitosamente' });
        loadGroups();
      } catch (error: any) {
        setMessage({
          type: 'error',
          text: `Error al eliminar: ${error.response?.data?.error || error.message}`
        });
      }
    }
  };

  const filteredRows = rows.filter(group => {
    // Búsqueda general (si no hay filtro específico)
    const matchesGeneralSearch = !filterField && (
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (group.category && group.category.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Filtro de inactivos (siempre aplicado)
    const matchesInactive = showInactiveGroups || group.status === 'ACTIVE';
    if (!matchesInactive) return false;

    // Filtro específico por campo
    if (filterField) {
      const searchText = filterValue.toLowerCase();
      if (!searchText) return true; // Si no hay valor, mostrar todos

      if (filterField === 'category') {
        const categoryName = group.category?.name || '';
        return categoryName.toLowerCase().includes(searchText);
      }

      const fieldValue = group[filterField as keyof Group];
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
  const selectedGroups = useMemo(() => {
    return filteredRows.filter(group => selectedIds.has(group.id));
  }, [filteredRows, selectedIds]);

  const allSelectedOnPage = useMemo(() => {
    if (filteredRows.length === 0) return false;
    return filteredRows.every(grp => selectedIds.has(grp.id));
  }, [filteredRows, selectedIds]);

  const someSelectedOnPage = useMemo(() => {
    return filteredRows.some(grp => selectedIds.has(grp.id)) && !allSelectedOnPage;
  }, [filteredRows, selectedIds, allSelectedOnPage]);

  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (allSelectedOnPage) {
        filteredRows.forEach(grp => newSelected.delete(grp.id));
      } else {
        filteredRows.forEach(grp => {
          if (!grp.isSystem) {
            newSelected.add(grp.id);
          }
        });
      }
      return newSelected;
    });
  }, [allSelectedOnPage, filteredRows]);

  const toggleSelectOne = useCallback((id: string, isSystem?: boolean) => {
    if (isSystem) {
      setMessage({ 
        type: 'error', 
        text: 'No se pueden seleccionar grupos de sistema para modificaciones globales' 
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
    const systemGroups = selectedGroups.filter(grp => grp.isSystem);
    if (systemGroups.length > 0) {
      setMessage({ 
        type: 'error', 
        text: `No se pueden modificar grupos de sistema: ${systemGroups.map(g => g.label || g.name).join(', ')}. Por favor, deselecciónelos.` 
      });
      return;
    }

    if (selectedGroups.length === 0) {
      setMessage({ type: 'error', text: 'Por favor selecciona al menos un grupo' });
      return;
    }

    try {
      await Promise.all(selectedGroups.map(grp => 
        api.put(`/asset-groups/${grp.id}`, { status: 'ACTIVE' })
      ));
      setMessage({ type: 'success', text: `${selectedGroups.length} grupo(s) activado(s) exitosamente` });
      setSelectedIds(new Set());
      loadGroups();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al activar grupos' });
    }
  };

  const handleBulkDeactivate = async () => {
    const systemGroups = selectedGroups.filter(grp => grp.isSystem);
    if (systemGroups.length > 0) {
      setMessage({ 
        type: 'error', 
        text: `No se pueden modificar grupos de sistema: ${systemGroups.map(g => g.label || g.name).join(', ')}. Por favor, deselecciónelos.` 
      });
      return;
    }

    if (selectedGroups.length === 0) {
      setMessage({ type: 'error', text: 'Por favor selecciona al menos un grupo' });
      return;
    }

    try {
      await Promise.all(selectedGroups.map(grp => 
        api.put(`/asset-groups/${grp.id}`, { status: 'INACTIVE' })
      ));
      setMessage({ type: 'success', text: `${selectedGroups.length} grupo(s) desactivado(s) exitosamente` });
      setSelectedIds(new Set());
      loadGroups();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al desactivar grupos' });
    }
  };

  const handleBulkDelete = async () => {
    const systemGroups = selectedGroups.filter(grp => grp.isSystem);
    if (systemGroups.length > 0) {
      setMessage({ 
        type: 'error', 
        text: `No se pueden eliminar grupos de sistema: ${systemGroups.map(g => g.label || g.name).join(', ')}. Por favor, deselecciónelos.` 
      });
      return;
    }

    if (selectedGroups.length === 0) {
      setMessage({ type: 'error', text: 'Por favor selecciona al menos un grupo' });
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar ${selectedGroups.length} grupo(s)?`)) {
      return;
    }

    try {
      await Promise.all(selectedGroups.map(grp => 
        api.delete(`/asset-groups/${grp.id}`)
      ));
      setMessage({ type: 'success', text: `${selectedGroups.length} grupo(s) eliminado(s) exitosamente` });
      setSelectedIds(new Set());
      loadGroups();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al eliminar grupos' });
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
        title="Grupos de Activos"
        subtitle="Administra grupos dentro de una categoría (ej. Laptops)"
        action={
          <PageHeaderActionButton
            label="Nuevo Grupo"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedGroup(null);
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
              Lista de Grupos ({filteredRows.length})
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
                      const systemGroups = selectedGroups.filter(grp => grp.isSystem);
                      if (systemGroups.length > 0) {
                        setMessage({ 
                          type: 'error', 
                          text: `No se pueden modificar grupos de sistema: ${systemGroups.map(g => g.label || g.name).join(', ')}. Por favor, deselecciónelos.` 
                        });
                        return;
                      }
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
                  checked={showInactiveGroups}
                  onChange={(e) => setShowInactiveGroups(e.target.checked)}
                />
              }
              label="Mostrar grupos inactivos"
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
                placeholder={filterField ? `Buscar por ${filterFieldOptions.find(f => f.value === filterField)?.label?.toLowerCase()}...` : "Buscar grupo..."}
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
              onClick={loadGroups}
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
                        {searchTerm ? 'No se encontraron grupos' : 'No hay grupos registrados'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((group) => (
                    <TableRow key={group.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.has(group.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectOne(group.id, group.isSystem);
                          }}
                          disabled={group.isSystem}
                          inputProps={{
                            'aria-label': `Seleccionar grupo ${group.label || group.name}`,
                          }}
                        />
                      </TableCell>
                      {visibleColumns.find(col => col.id === 'name') && (
                        <TableCell sx={{ fontWeight: 500 }}>
                          <Box
                            component="span"
                            onClick={() => navigate(`/assets/by-group/${group.id}`)}
                            sx={{
                              color: PRIMARY.main,
                              cursor: 'pointer',
                              '&:hover': {
                                textDecoration: 'underline',
                                color: PRIMARY.dark
                              }
                            }}
                          >
                            {group.label || group.name}
                          </Box>
                        </TableCell>
                      )}
                      {visibleColumns.find(col => col.id === 'category') && (
                        <TableCell>
                          {group.category?.name || group.category?.label ? (
                            <Chip 
                              label={group.category.label || group.category.name} 
                              size="small"
                              onClick={() => navigate(`/assets/category/${group.category?.id}/groups`)}
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
                      {visibleColumns.find(col => col.id === 'description') && (
                        <TableCell sx={{ maxWidth: 300 }}>
                          {group.description ? (
                            group.description.length > 200 ? (
                              <Tooltip title={group.description} arrow>
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
                                  {group.description.substring(0, 200)}...
                                </Typography>
                              </Tooltip>
                            ) : (
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {group.description}
                              </Typography>
                            )
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.find(col => col.id === 'isSystem') && (
                        <TableCell>
                          <Chip
                            label={group.isSystem ? 'Sí' : 'No'}
                            color={group.isSystem ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      )}
                      {visibleColumns.find(col => col.id === 'status') && (
                        <TableCell>
                          <Chip
                            label={group.status || 'ACTIVE'}
                            color={(group.status || 'ACTIVE') === 'ACTIVE' ? 'success' : 'default'}
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
                                onClick={() => handleViewGroup(group)}
                                sx={{ color: '#2196F3' }}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedGroup(group);
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
                                onClick={() => handleDelete(group)}
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
          setSelectedGroup(null);
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
      {selectedGroup && (
        <ViewDialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          onEdit={handleEditFromView}
          title={`Grupo: ${selectedGroup.name}`}
          data={selectedGroup}
          type="group"
        />
      )}

      {/* Formulario de edición */}
      <AssetGroupForm
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedGroup(null);
          setIsBulkEditMode(false);
          setSelectedIds(new Set());
        }}
        onSave={() => {
          loadGroups();
          setEditDialogOpen(false);
          setSelectedGroup(null);
          setIsBulkEditMode(false);
          setSelectedIds(new Set());
          setMessage({ type: 'success', text: isBulkEditMode ? `${selectedGroups.length} grupo(s) actualizado(s) exitosamente` : 'Grupo actualizado exitosamente' });
        }}
        initialData={isBulkEditMode ? null : selectedGroup}
        selectedGroups={isBulkEditMode ? selectedGroups : []}
        isBulkEdit={isBulkEditMode}
      />
    </Box>
  );
};

export default AssetGroups;
