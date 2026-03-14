import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Fab,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  Select as MuiSelect,
  MenuItem as MuiMenuItem,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Switch,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Build as WrenchIcon,
  DoneAll as DoneAllIcon,
  DragIndicator as DragIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  KeyboardArrowUp,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import api from '../../config/api';
import HeadquartersForm from './HeadquartersForm';
import ViewDialog from '../common/ViewDialog';
import PageHeader from '../common/PageHeader';
import PageHeaderActionButton from '../common/PageHeaderActionButton';
import { headquartersService, Headquarters } from '../../services/headquartersService';
import { companyService, Company } from '../../services/companyService';

interface HeadquartersListProps {
  onNavigate?: (path: string) => void;
}

const COLUMN_OPTIONS = [
  { id: 'name', label: 'Sede', visible: true, required: true },
  { id: 'company', label: 'Empresa', visible: true, required: false },
  { id: 'location', label: 'Ubicación', visible: true, required: false },
  { id: 'contact', label: 'Contacto', visible: true, required: false },
  { id: 'status', label: 'Estado', visible: true, required: false },
  { id: 'actions', label: 'Acciones', visible: true, required: true },
];

const COLUMNS_CONFIG_STORAGE_KEY = 'itd_headquarterslist_columns_config';

const HeadquartersList: React.FC<HeadquartersListProps> = ({ onNavigate }) => {
  const { user: currentUser } = useAuth();
  const [headquarters, setHeadquarters] = useState<Headquarters[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedHeadquarters, setSelectedHeadquarters] = useState<Headquarters | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [columnsConfig, setColumnsConfig] = useState(() => {
    const saved = localStorage.getItem(COLUMNS_CONFIG_STORAGE_KEY);
    return saved ? JSON.parse(saved) : COLUMN_OPTIONS;
  });
  const [columnsDialogOpen, setColumnsDialogOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [showInactiveHeadquarters, setShowInactiveHeadquarters] = useState(false);
  const [filterCompany, setFilterCompany] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterState, setFilterState] = useState<string>('');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [importMenuAnchor, setImportMenuAnchor] = useState<null | HTMLElement>(null);

  const loadHeadquarters = useCallback(async (params?: { search?: string }) => {
    try {
      setLoading(true);
      setSearching(true);
      
      const response = await headquartersService.getAll();
      setHeadquarters(response);
      setMessage(null);
    } catch (error: any) {
      console.error('Error loading headquarters:', error);
      setMessage({
        type: 'error',
        text: 'Error al cargar las sedes: ' + (error.response?.data?.error || error.message)
      });
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  const loadCompanies = useCallback(async () => {
    try {
      const response = await companyService.getAll();
      setCompanies(response);
    } catch (error: any) {
      console.error('Error loading companies:', error);
    }
  }, []);

  useEffect(() => {
    loadHeadquarters();
    loadCompanies();
  }, [loadHeadquarters, loadCompanies]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Guardar configuración de columnas en localStorage
  useEffect(() => {
    localStorage.setItem(COLUMNS_CONFIG_STORAGE_KEY, JSON.stringify(columnsConfig));
  }, [columnsConfig]);


  const handleOpenModal = (headquarters?: Headquarters) => {
    if (headquarters) {
      setSelectedHeadquarters(headquarters);
      setIsEditMode(true);
      setIsBulkEditMode(false);
    } else {
      setSelectedHeadquarters(null);
      setIsEditMode(false);
      setIsBulkEditMode(false);
    }
    setModalOpen(true);
  };

  const handleViewHeadquarters = (headquarters: Headquarters) => {
    setSelectedHeadquarters(headquarters);
    setViewDialogOpen(true);
  };

  const handleEditFromView = () => {
    setViewDialogOpen(false);
    setIsEditMode(true);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedHeadquarters(null);
    setIsEditMode(false);
    setIsBulkEditMode(false);
    setSelectedIds(new Set());
  };

  const handleSave = async (formData: any) => {
    try {
      if (isBulkEditMode && selectedHeadquartersItems.length > 0) {
        // Bulk edit ya se maneja en el formulario, solo recargar
        setSelectedIds(new Set());
        setIsBulkEditMode(false);
        loadHeadquarters();
      } else if (isEditMode && selectedHeadquarters) {
        await api.put(`/headquarters/${selectedHeadquarters.id}`, formData);
        setMessage({ type: 'success', text: 'Sede actualizada exitosamente' });
        handleCloseModal();
        loadHeadquarters();
      } else {
        await api.post('/headquarters', formData);
        setMessage({ type: 'success', text: 'Sede creada exitosamente' });
        handleCloseModal();
        loadHeadquarters();
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Error al guardar la sede: ' + (error.response?.data?.error || error.message)
      });
    }
  };

  const handleDelete = async (headquarters: Headquarters) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la sede "${headquarters.name}"?`)) {
      try {
        await api.delete(`/headquarters/${headquarters.id}`);
        setMessage({ type: 'success', text: 'Sede eliminada exitosamente' });
        loadHeadquarters();
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
        setMessage({
          type: 'error',
          text: `Error al eliminar la sede: ${errorMessage}`
        });
        console.error('Delete headquarters error:', error.response?.data);
      }
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) {
      setMessage({ type: 'error', text: 'Selecciona al menos una sede' });
      return;
    }

    try {
      const headquartersIds = Array.from(selectedIds);
      
      switch (action) {
        case 'activate':
          await api.put('/headquarters/bulk-activate', { ids: headquartersIds });
          setMessage({ type: 'success', text: `${headquartersIds.length} sedes activadas` });
          break;
        case 'deactivate':
          await api.put('/headquarters/bulk-deactivate', { ids: headquartersIds });
          setMessage({ type: 'success', text: `${headquartersIds.length} sedes desactivadas` });
          break;
        case 'delete':
          if (window.confirm(`¿Estás seguro de que deseas eliminar ${headquartersIds.length} sedes?`)) {
            await api.delete('/headquarters/bulk-delete', { data: { ids: headquartersIds } });
            setMessage({ type: 'success', text: `${headquartersIds.length} sedes eliminadas` });
          }
          break;
      }
      
      setSelectedIds(new Set());
      loadHeadquarters();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Error en la operación masiva: ' + (error.response?.data?.error || error.message)
      });
    }
  };

  const filteredHeadquarters = useMemo(() => {
    return headquarters.filter(headquarters => {
      const matchesSearch = !debouncedSearchTerm || 
        headquarters.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        headquarters.city.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      const matchesStatus = !filterStatus || headquarters.status === filterStatus;
      const matchesCompany = !filterCompany || headquarters.companyId.toString() === filterCompany;
      const matchesState = !filterState || headquarters.state === filterState;
      // Si showInactiveHeadquarters está activado, mostrar todas (ACTIVE, INACTIVE, DELETED)
      // Si está desactivado, solo mostrar ACTIVE
      const matchesInactive = showInactiveHeadquarters || headquarters.status === 'ACTIVE';

      return matchesSearch && matchesStatus && matchesCompany && matchesState && matchesInactive;
    });
  }, [headquarters, debouncedSearchTerm, filterStatus, filterCompany, filterState, showInactiveHeadquarters]);

  const visibleColumns = columnsConfig.filter(col => col.visible);

  // Funciones para manejo de selección (similar a Assets) - DEBE IR DESPUÉS de filteredHeadquarters
  const selectedHeadquartersItems = useMemo(() => {
    return filteredHeadquarters.filter(h => selectedIds.has(String(h.id)));
  }, [filteredHeadquarters, selectedIds]);

  const allSelectedOnPage = useMemo(() => {
    if (filteredHeadquarters.length === 0) return false;
    return filteredHeadquarters.every(h => selectedIds.has(String(h.id)));
  }, [filteredHeadquarters, selectedIds]);

  const someSelectedOnPage = useMemo(() => {
    return filteredHeadquarters.some(h => selectedIds.has(String(h.id))) && !allSelectedOnPage;
  }, [filteredHeadquarters, selectedIds, allSelectedOnPage]);

  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (allSelectedOnPage) {
        filteredHeadquarters.forEach(h => newSelected.delete(String(h.id)));
      } else {
        filteredHeadquarters.forEach(h => newSelected.add(String(h.id)));
      }
      return newSelected;
    });
  }, [allSelectedOnPage, filteredHeadquarters]);

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
        title="Gestión de Sedes"
        subtitle="Administra las sedes de las empresas"
        action={<PageHeaderActionButton label="+ Nueva Sede" startIcon={<AddIcon />} onClick={() => handleOpenModal()} />}
      />

      {/* Alerts */}
      {message && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 2 }} 
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {/* Main Content */}
      <Card>
        <CardContent>
          {/* Title and Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Lista de Sedes ({filteredHeadquarters.length})
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

          {/* Filters and Search */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showInactiveHeadquarters}
                  onChange={(e) => setShowInactiveHeadquarters(e.target.checked)}
                />
              }
              label="Mostrar sedes inactivas"
            />
            
            <TextField
              placeholder="Buscar sede..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Empresa</InputLabel>
              <MuiSelect
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                label="Empresa"
              >
                <MuiMenuItem value="">Todas</MuiMenuItem>
                {companies.map((company) => (
                  <MuiMenuItem key={company.id} value={company.id.toString()}>
                    {company.name}
                  </MuiMenuItem>
                ))}
              </MuiSelect>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Estado</InputLabel>
              <MuiSelect
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Estado"
              >
                <MuiMenuItem value="">Todos</MuiMenuItem>
                <MuiMenuItem value="ACTIVE">Activas</MuiMenuItem>
                <MuiMenuItem value="INACTIVE">Inactivas</MuiMenuItem>
              </MuiSelect>
            </FormControl>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {/* Botones de acciones globales */}
              {selectedIds.size > 0 && (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() => handleBulkAction('activate')}
                  >
                    Activar ({selectedIds.size})
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    onClick={() => handleBulkAction('deactivate')}
                  >
                    Desactivar
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                      setIsBulkEditMode(true);
                      setModalOpen(true);
                    }}
                  >
                    Modificar
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => handleBulkAction('delete')}
                  >
                    Eliminar
                  </Button>
                </>
              )}
              <Tooltip title="Configurar columnas">
                <IconButton onClick={() => setColumnsDialogOpen(true)}>
                  <WrenchIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={() => loadHeadquarters()}
                sx={{
                  backgroundColor: PRIMARY.main,
                  '&:hover': { backgroundColor: '#E91E63' }
                }}
              >
                Actualizar
              </Button>
            </Box>
          </Box>

          {/* Headquarters Table */}
          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#FF6B6B' }}>
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
                {filteredHeadquarters.map((headquarters) => (
                  <TableRow key={headquarters.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIds.has(String(headquarters.id))}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectOne(String(headquarters.id));
                      }}
                      inputProps={{
                        'aria-label': `Seleccionar sede ${headquarters.name}`,
                      }}
                    />
                  </TableCell>
                    {visibleColumns.map((column) => {
                      switch (column.id) {
                        case 'name':
                          return (
                            <TableCell key={column.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ bgcolor: PRIMARY.main, mr: 2, width: 32, height: 32 }}>
                                  <LocationIcon />
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {headquarters.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    ID: {headquarters.id}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                          );
                        case 'company':
                          return (
                            <TableCell key={column.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <BusinessIcon sx={{ mr: 0.5, fontSize: 16, color: PRIMARY.main }} />
                                <Typography variant="body2">
                                  {headquarters.company?.name || 'Sin empresa'}
                                </Typography>
                              </Box>
                            </TableCell>
                          );
                        case 'location':
                          return (
                            <TableCell key={column.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocationIcon sx={{ mr: 0.5, fontSize: 16, color: PRIMARY.main }} />
                                <Typography variant="body2">
                                  {headquarters.city}, {headquarters.state}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {headquarters.country}
                              </Typography>
                            </TableCell>
                          );
                        case 'contact':
                          return (
                            <TableCell key={column.id}>
                              <Box>
                                {headquarters.email && (
                                  <Typography variant="body2">{headquarters.email}</Typography>
                                )}
                                {headquarters.phone && (
                                  <Typography variant="caption" color="text.secondary">
                                    {headquarters.phone}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                          );
                        case 'status':
                          return (
                            <TableCell key={column.id}>
                              <Chip
                                label={headquarters.status}
                                color={headquarters.status === 'ACTIVE' ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                          );
                        case 'actions':
                          return (
                            <TableCell key={column.id}>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Ver">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleViewHeadquarters(headquarters)}
                                    sx={{ color: '#2196F3' }}
                                  >
                                    <ViewIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Editar">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenModal(headquarters)}
                                    sx={{ color: '#FF9800' }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Eliminar">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDelete(headquarters)}
                                    sx={{ color: '#F44336' }}
                                  >
                                    <DeleteIcon />
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
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => handleOpenModal()}
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

      {/* Headquarters Form Modal */}
      <HeadquartersForm
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        initialData={selectedHeadquarters}
        isEditMode={isEditMode}
        isBulkEdit={isBulkEditMode}
        selectedHeadquarters={isBulkEditMode ? selectedHeadquartersItems : []}
        companies={companies}
      />

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={() => setExportMenuAnchor(null)}>
          Exportar a Excel
        </MenuItem>
        <MenuItem onClick={() => setExportMenuAnchor(null)}>
          Exportar a CSV
        </MenuItem>
        <MenuItem onClick={() => setExportMenuAnchor(null)}>
          Exportar a PDF
        </MenuItem>
      </Menu>

      {/* Import Menu */}
      <Menu
        anchorEl={importMenuAnchor}
        open={Boolean(importMenuAnchor)}
        onClose={() => setImportMenuAnchor(null)}
      >
        <MenuItem onClick={() => setImportMenuAnchor(null)}>
          Importar desde Excel
        </MenuItem>
        <MenuItem onClick={() => setImportMenuAnchor(null)}>
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

      {/* View Dialog */}
      {selectedHeadquarters && (
        <ViewDialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          onEdit={handleEditFromView}
          title={`Sede: ${selectedHeadquarters.name}`}
          data={selectedHeadquarters}
          type="headquarters"
        />
      )}
    </Box>
  );
};

export default HeadquartersList;


