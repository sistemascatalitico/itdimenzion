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
import ModalHeader from '../common/ModalHeader';
import AssetManufacturerForm from './AssetManufacturerForm';
import PageHeader from '../common/PageHeader';
import PageHeaderActionButton from '../common/PageHeaderActionButton';
import { PRIMARY, PRIMARY_GRADIENT } from '../../theme/themeTokens';

interface Manufacturer {
  id: string;
  name: string;
  description?: string;
  website?: string;
  logo?: string; // URL o base64 del logo
  status: string;
  categoryIds?: number[];
  categories?: any[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

const COLUMN_OPTIONS = [
  { id: 'name', label: 'Nombre', visible: true, required: true },
  { id: 'categories', label: 'Categorías', visible: true, required: false },
  { id: 'description', label: 'Descripción', visible: true, required: false },
  { id: 'website', label: 'Website', visible: true, required: false },
  { id: 'status', label: 'Estado', visible: true, required: false },
  { id: 'actions', label: 'Acciones', visible: true, required: true },
];

const COLUMNS_CONFIG_STORAGE_KEY = 'itd_assetmanufacturers_columns_config';

const AssetManufacturers: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterField, setFilterField] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [columnsConfig, setColumnsConfig] = useState(() => {
    const saved = localStorage.getItem(COLUMNS_CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migración: asegurar que la columna 'categories' existe
      const hasCategories = parsed.some((col: any) => col.id === 'categories');
      if (!hasCategories) {
        // Insertar 'categories' después de 'name' y antes de 'description'
        const nameIndex = parsed.findIndex((col: any) => col.id === 'name');
        const insertIndex = nameIndex >= 0 ? nameIndex + 1 : 1;
        parsed.splice(insertIndex, 0, { id: 'categories', label: 'Categorías', visible: true, required: false });
        // Guardar la configuración migrada
        localStorage.setItem(COLUMNS_CONFIG_STORAGE_KEY, JSON.stringify(parsed));
        return parsed;
      }
      return parsed;
    }
    return COLUMN_OPTIONS;
  });
  const [columnsDialogOpen, setColumnsDialogOpen] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [importMenuAnchor, setImportMenuAnchor] = useState<null | HTMLElement>(null);
  const [showInactiveManufacturers, setShowInactiveManufacturers] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);

  // Opciones de campos para filtrar
  const filterFieldOptions = [
    { value: '', label: 'Todos los campos' },
    { value: 'name', label: 'Nombre' },
    { value: 'categories', label: 'Categorías' },
    { value: 'website', label: 'Website' },
    { value: 'description', label: 'Descripción' },
    { value: 'status', label: 'Estado' },
  ];

  // Determinar si el campo necesita un dropdown (select) o un campo de texto
  const shouldUseDropdown = (field: string): boolean => {
    return ['status', 'categories'].includes(field);
  };

  // Obtener valores únicos para campos filtrables
  const getUniqueFilterValues = useMemo(() => {
    if (!filterField || rows.length === 0) return [];
    
    const values = new Set<string>();
    rows.forEach(row => {
      if (filterField === 'status') {
        const value = row.status || '';
        if (value) values.add(value);
      } else if (filterField === 'categories') {
        // Para categorías, obtener todas las categorías únicas
        if (row.categories && Array.isArray(row.categories)) {
          row.categories.forEach((category: any) => {
            const categoryName = typeof category === 'object' 
              ? (category.label || category.name) 
              : category;
            if (categoryName) values.add(String(categoryName));
          });
        }
      } else {
        const value = row[filterField as keyof Manufacturer];
        if (value !== undefined && value !== null) {
          values.add(String(value));
        }
      }
    });
    return Array.from(values).sort();
  }, [filterField, rows]);

  useEffect(() => {
    loadManufacturers();
  }, []);

  const loadManufacturers = async () => {
    try {
      setLoading(true);
      // Solicitar categorías para que estén disponibles en el formulario de edición
      const response = await assetCatalogService.getManufacturers({ populate: 'categories' });
      const data = response.data || response || [];
      setRows(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Error al cargar fabricantes: ${error.response?.data?.error || error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewManufacturer = (manufacturer: Manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setViewDialogOpen(true);
  };

  const handleEditFromView = () => {
    setViewDialogOpen(false);
    // selectedManufacturer ya está establecido cuando se abre ViewDialog
    setEditDialogOpen(true);
  };

  const handleDelete = async (manufacturer: Manufacturer) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el fabricante "${manufacturer.name}"?`)) {
      try {
        await assetCatalogService.deleteManufacturer(manufacturer.id);
        setMessage({ type: 'success', text: 'Fabricante eliminado exitosamente' });
        loadManufacturers();
      } catch (error: any) {
        setMessage({
          type: 'error',
          text: `Error al eliminar: ${error.response?.data?.error || error.message}`
        });
      }
    }
  };

  const filteredRows = rows.filter(manufacturer => {
    // Búsqueda general (si no hay filtro específico)
    const matchesGeneralSearch = !filterField && (
      manufacturer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (manufacturer.website && manufacturer.website.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (manufacturer.description && manufacturer.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (manufacturer.categories && manufacturer.categories.some((cat: any) => {
        const catName = typeof cat === 'object' ? (cat.label || cat.name || '') : String(cat);
        return catName.toLowerCase().includes(searchTerm.toLowerCase());
      }))
    );

    // Filtro de inactivos (siempre aplicado)
    const matchesInactive = showInactiveManufacturers || manufacturer.status === 'ACTIVE';
    if (!matchesInactive) return false;

    // Filtro específico por campo
    if (filterField) {
      const searchText = filterValue.toLowerCase();
      if (!searchText) return true;

      if (filterField === 'categories') {
        // Filtrar por categorías
        if (!manufacturer.categories || manufacturer.categories.length === 0) return false;
        return manufacturer.categories.some((cat: any) => {
          const catName = typeof cat === 'object' ? (cat.label || cat.name || '') : String(cat);
          return catName.toLowerCase().includes(searchText);
        });
      }

      const fieldValue = manufacturer[filterField as keyof Manufacturer];
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

  // Fabricantes seleccionados
  const selectedManufacturers = useMemo(() => {
    return filteredRows.filter(m => selectedIds.has(m.id));
  }, [filteredRows, selectedIds]);

  // Estado de selección en la página actual
  const allSelectedOnPage = useMemo(() => {
    return filteredRows.length > 0 && filteredRows.every(m => selectedIds.has(m.id));
  }, [filteredRows, selectedIds]);

  const someSelectedOnPage = useMemo(() => {
    return filteredRows.some(m => selectedIds.has(m.id)) && !allSelectedOnPage;
  }, [filteredRows, selectedIds, allSelectedOnPage]);

  // Toggle seleccionar todos en la página
  const toggleSelectAllOnPage = useCallback(() => {
    if (allSelectedOnPage) {
      // Deseleccionar todos los de la página
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        filteredRows.forEach(m => newSet.delete(m.id));
        return newSet;
      });
    } else {
      // Seleccionar todos los de la página
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        filteredRows.forEach(m => newSet.add(m.id));
        return newSet;
      });
    }
  }, [allSelectedOnPage, filteredRows]);

  // Toggle seleccionar uno
  const toggleSelectOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Acciones globales
  const handleBulkActivate = async () => {
    if (selectedManufacturers.length === 0) return;
    
    try {
      await Promise.all(
        selectedManufacturers.map(m => 
          api.put(`/asset-manufacturers/${m.id}`, { status: 'ACTIVE' })
        )
      );
      setMessage({ type: 'success', text: `${selectedManufacturers.length} fabricante(s) activado(s)` });
      setSelectedIds(new Set());
      loadManufacturers();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Error al activar: ${error.response?.data?.error || error.message}`
      });
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedManufacturers.length === 0) return;
    
    try {
      await Promise.all(
        selectedManufacturers.map(m => 
          api.put(`/asset-manufacturers/${m.id}`, { status: 'INACTIVE' })
        )
      );
      setMessage({ type: 'success', text: `${selectedManufacturers.length} fabricante(s) desactivado(s)` });
      setSelectedIds(new Set());
      loadManufacturers();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Error al desactivar: ${error.response?.data?.error || error.message}`
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedManufacturers.length === 0) return;
    
    const confirmMessage = `¿Estás seguro de que deseas eliminar ${selectedManufacturers.length} fabricante(s)?`;
    if (!window.confirm(confirmMessage)) return;
    
    try {
      await Promise.all(
        selectedManufacturers.map(m => assetCatalogService.deleteManufacturer(m.id))
      );
      setMessage({ type: 'success', text: `${selectedManufacturers.length} fabricante(s) eliminado(s)` });
      setSelectedIds(new Set());
      loadManufacturers();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Error al eliminar: ${error.response?.data?.error || error.message}`
      });
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
        title="Fabricantes"
        subtitle="Catálogo de fabricantes"
        action={
          <PageHeaderActionButton
            label="Nuevo Fabricante"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedManufacturer(null);
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
              Lista de Fabricantes ({filteredRows.length})
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
                  checked={showInactiveManufacturers}
                  onChange={(e) => setShowInactiveManufacturers(e.target.checked)}
                />
              }
              label="Mostrar fabricantes inactivos"
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
                placeholder={filterField ? `Buscar por ${filterFieldOptions.find(f => f.value === filterField)?.label?.toLowerCase()}...` : "Buscar fabricante..."}
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
              onClick={loadManufacturers}
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
                        '&.Mui-checked': { color: 'white' },
                        '&.Mui-indeterminate': { color: 'white' },
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
                        {searchTerm ? 'No se encontraron fabricantes' : 'No hay fabricantes registrados'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((manufacturer) => (
                    <TableRow key={manufacturer.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.has(manufacturer.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectOne(manufacturer.id);
                          }}
                          color="primary"
                        />
                      </TableCell>
                      {visibleColumns.map((column) => {
                        switch (column.id) {
                          case 'name':
                            return (
                              <TableCell key={column.id} sx={{ fontWeight: 500 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <Avatar
                                    src={manufacturer.logo || undefined}
                                    alt={manufacturer.name}
                                    sx={{
                                      width: 40,
                                      height: 40,
                                      border: `2px solid ${PRIMARY.main}`,
                                      bgcolor: 'rgba(255, 107, 107, 0.1)',
                                    }}
                                  >
                                    {!manufacturer.logo && manufacturer.name.charAt(0).toUpperCase()}
                                  </Avatar>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontWeight: 500,
                                      color: PRIMARY.main,
                                      cursor: 'pointer',
                                      '&:hover': {
                                        textDecoration: 'underline',
                                        color: PRIMARY.dark
                                      }
                                    }}
                                    onClick={() => navigate(`/assets/by-manufacturer/${manufacturer.id}`)}
                                  >
                                    {manufacturer.name}
                                  </Typography>
                                </Box>
                              </TableCell>
                            );
                          case 'categories':
                            return (
                              <TableCell key={column.id}>
                                {manufacturer.categories && manufacturer.categories.length > 0 ? (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {manufacturer.categories.map((category: any) => {
                                      const categoryId = typeof category === 'object' ? category.id : null;
                                      const categoryName = typeof category === 'object' ? (category.label || category.name) : category;
                                      return (
                                        <Chip
                                          key={typeof category === 'object' ? category.id : category}
                                          label={categoryName}
                                          size="small"
                                          onClick={() => categoryId && navigate(`/assets/category/${categoryId}/groups`)}
                                          sx={{
                                            backgroundColor: 'rgba(255, 107, 107, 0.1)',
                                            color: PRIMARY.main,
                                            border: '1px solid rgba(255, 107, 107, 0.3)',
                                            fontSize: '0.75rem',
                                            cursor: categoryId ? 'pointer' : 'default',
                                            '&:hover': categoryId ? {
                                              backgroundColor: 'rgba(255, 107, 107, 0.2)',
                                            } : {}
                                          }}
                                        />
                                      );
                                    })}
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="textSecondary">-</Typography>
                                )}
                              </TableCell>
                            );
                          case 'description':
                            return (
                              <TableCell key={column.id} sx={{ color: 'text.secondary' }}>
                                {manufacturer.description || '-'}
                              </TableCell>
                            );
                          case 'website':
                            return (
                              <TableCell key={column.id}>
                                {manufacturer.website ? (
                                  <a
                                    href={manufacturer.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#2196F3', textDecoration: 'none' }}
                                  >
                                    {manufacturer.website}
                                  </a>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                            );
                          case 'status':
                            return (
                              <TableCell key={column.id}>
                                <Chip
                                  label={manufacturer.status || 'ACTIVE'}
                                  color={(manufacturer.status || 'ACTIVE') === 'ACTIVE' ? 'success' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                            );
                          case 'actions':
                            return (
                              <TableCell key={column.id} align="center">
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                  <Tooltip title="Ver">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleViewManufacturer(manufacturer)}
                                      sx={{ color: '#2196F3' }}
                                    >
                                      <ViewIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Editar">
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setSelectedManufacturer(manufacturer);
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
                                      onClick={() => handleDelete(manufacturer)}
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
          setSelectedManufacturer(null);
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
      {selectedManufacturer && (
        <ViewDialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          onEdit={handleEditFromView}
          title={`Fabricante: ${selectedManufacturer.name}`}
          data={selectedManufacturer}
          type="manufacturer"
        />
      )}

      {/* Formulario de edición */}
      <AssetManufacturerForm
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedManufacturer(null);
          setIsBulkEditMode(false);
          setSelectedIds(new Set());
        }}
        onSave={() => {
          loadManufacturers();
          setEditDialogOpen(false);
          setSelectedManufacturer(null);
          setIsBulkEditMode(false);
          setSelectedIds(new Set());
        }}
        initialData={selectedManufacturer}
        selectedManufacturers={isBulkEditMode ? selectedManufacturers : undefined}
        isBulkEdit={isBulkEditMode}
      />
    </Box>
  );
};

export default AssetManufacturers;
