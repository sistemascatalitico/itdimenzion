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
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  AccountTree as ProcessIcon,
  Work as JobIcon,
  KeyboardArrowUp,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import api from '../../config/api';
import CompanyForm from './CompanyForm';
import ViewDialog from '../common/ViewDialog';
import PageHeader from '../common/PageHeader';
import PageHeaderActionButton from '../common/PageHeaderActionButton';
import { PRIMARY, PRIMARY_GRADIENT } from '../../theme/themeTokens';
import { companyService, Company } from '../../services/companyService';

interface CompanyListProps {
  onNavigate?: (path: string) => void;
}

const COLUMN_OPTIONS = [
  { id: 'name', label: 'Empresa', visible: true, required: true },
  { id: 'taxDocumentNumber', label: 'Documento', visible: true, required: false },
  { id: 'location', label: 'Ubicación', visible: true, required: false },
  { id: 'contact', label: 'Contacto', visible: true, required: false },
  { id: 'structure', label: 'Estructura', visible: true, required: false },
  { id: 'status', label: 'Estado', visible: true, required: false },
  { id: 'actions', label: 'Acciones', visible: true, required: true },
];

const COLUMNS_CONFIG_STORAGE_KEY = 'itd_companylist_columns_config';

const CompanyList: React.FC<CompanyListProps> = ({ onNavigate }) => {
  const { user: currentUser } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
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
  const [showInactiveCompanies, setShowInactiveCompanies] = useState(false);
  const [filterCountry, setFilterCountry] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterState, setFilterState] = useState<string>('');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [importMenuAnchor, setImportMenuAnchor] = useState<null | HTMLElement>(null);

  const loadCompanies = useCallback(async (params?: { search?: string }) => {
    try {
      setLoading(true);
      setSearching(true);
      
      const response = await companyService.getAll();
      setCompanies(response);
      setMessage(null);
    } catch (error: any) {
      console.error('Error loading companies:', error);
      setMessage({
        type: 'error',
        text: 'Error al cargar las empresas: ' + (error.response?.data?.error || error.message)
      });
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

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

  const handleOpenModal = (company?: Company) => {
    if (company) {
      setSelectedCompany(company);
      setIsEditMode(true);
    } else {
      setSelectedCompany(null);
      setIsEditMode(false);
    }
    setModalOpen(true);
  };

  const handleViewCompany = (company: Company) => {
    setSelectedCompany(company);
    setViewDialogOpen(true);
  };

  const handleEditFromView = () => {
    setViewDialogOpen(false);
    setIsEditMode(true);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCompany(null);
    setIsEditMode(false);
    setIsBulkEditMode(false);
    setSelectedIds(new Set());
  };

  const handleSave = async (formData: any) => {
    try {
      if (isEditMode && selectedCompany) {
        await api.put(`/companies/${selectedCompany.id}`, formData);
        setMessage({ type: 'success', text: 'Empresa actualizada exitosamente' });
      } else {
        await api.post('/companies', formData);
        setMessage({ type: 'success', text: 'Empresa creada exitosamente' });
      }
      handleCloseModal();
      loadCompanies();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Error al guardar la empresa: ' + (error.response?.data?.error || error.message)
      });
    }
  };

  const handleDelete = async (company: Company) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la empresa "${company.name}"?`)) {
      try {
        await api.delete(`/companies/${company.id}`);
        setMessage({ type: 'success', text: 'Empresa eliminada exitosamente' });
        loadCompanies();
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
        setMessage({
          type: 'error',
          text: `Error al eliminar la empresa: ${errorMessage}`
        });
        console.error('Delete company error:', error.response?.data);
      }
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) {
      setMessage({ type: 'error', text: 'Selecciona al menos una empresa' });
      return;
    }

    try {
      const companyIds = Array.from(selectedIds);
      
      switch (action) {
        case 'activate':
          await api.put('/companies/bulk-activate', { ids: companyIds });
          setMessage({ type: 'success', text: `${companyIds.length} empresas activadas` });
          break;
        case 'deactivate':
          await api.put('/companies/bulk-deactivate', { ids: companyIds });
          setMessage({ type: 'success', text: `${companyIds.length} empresas desactivadas` });
          break;
        case 'delete':
          if (window.confirm(`¿Estás seguro de que deseas eliminar ${companyIds.length} empresas?`)) {
            await api.delete('/companies/bulk-delete', { data: { ids: companyIds } });
            setMessage({ type: 'success', text: `${companyIds.length} empresas eliminadas` });
          }
          break;
      }
      
      setSelectedIds(new Set());
      loadCompanies();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Error en la operación masiva: ' + (error.response?.data?.error || error.message)
      });
    }
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const matchesSearch = !debouncedSearchTerm || 
        company.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        company.taxDocumentNumber.includes(debouncedSearchTerm) ||
        company.city.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      const matchesStatus = !filterStatus || company.status === filterStatus;
      const matchesCountry = !filterCountry || company.country === filterCountry;
      const matchesState = !filterState || company.state === filterState;
      const matchesInactive = showInactiveCompanies || company.status === 'ACTIVE';

      return matchesSearch && matchesStatus && matchesCountry && matchesState && matchesInactive;
    });
  }, [companies, debouncedSearchTerm, filterStatus, filterCountry, filterState, showInactiveCompanies]);

  const visibleColumns = columnsConfig.filter(col => col.visible);

  // Funciones para manejo de selección (similar a Assets) - DEBE IR DESPUÉS de filteredCompanies
  const selectedCompanyItems = useMemo(() => {
    return filteredCompanies.filter(c => selectedIds.has(String(c.id)));
  }, [filteredCompanies, selectedIds]);

  const allSelectedOnPage = useMemo(() => {
    if (filteredCompanies.length === 0) return false;
    return filteredCompanies.every(c => selectedIds.has(String(c.id)));
  }, [filteredCompanies, selectedIds]);

  const someSelectedOnPage = useMemo(() => {
    return filteredCompanies.some(c => selectedIds.has(String(c.id))) && !allSelectedOnPage;
  }, [filteredCompanies, selectedIds, allSelectedOnPage]);

  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (allSelectedOnPage) {
        filteredCompanies.forEach(c => newSelected.delete(String(c.id)));
      } else {
        filteredCompanies.forEach(c => newSelected.add(String(c.id)));
      }
      return newSelected;
    });
  }, [allSelectedOnPage, filteredCompanies]);

  const toggleSelectOne = useCallback((id: string) => {
    console.log('🔵 toggleSelectOne - ID recibido:', id, 'tipo:', typeof id);
    setSelectedIds(prevSelected => {
      console.log('🔵 selectedIds ANTES:', Array.from(prevSelected));
      const newSelected = new Set(prevSelected);
      if (newSelected.has(id)) {
        console.log('🔵 ID existe, removiendo:', id);
        newSelected.delete(id);
      } else {
        console.log('🔵 ID NO existe, agregando:', id);
        newSelected.add(id);
      }
      console.log('🔵 selectedIds DESPUÉS:', Array.from(newSelected));
      return newSelected;
    });
  }, []);

  // Debug: Log cuando selectedIds cambia
  React.useEffect(() => {
    console.log('📊 selectedIds actualizado:', Array.from(selectedIds), 'size:', selectedIds.size);
  }, [selectedIds]);

  // Debug: Log filteredCompanies
  React.useEffect(() => {
    console.log('📋 filteredCompanies:', filteredCompanies.length, 'empresas');
    if (filteredCompanies.length > 0) {
      console.log('📋 Primera empresa - ID:', filteredCompanies[0].id, 'tipo:', typeof filteredCompanies[0].id, 'nombre:', filteredCompanies[0].name);
    }
  }, [filteredCompanies]);

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
        title="Gestión de Empresas"
        subtitle="Administra las empresas del sistema"
        action={<PageHeaderActionButton label="Nueva Empresa" startIcon={<AddIcon />} onClick={() => handleOpenModal()} />}
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
              Lista de Empresas ({filteredCompanies.length})
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
                  checked={showInactiveCompanies}
                  onChange={(e) => setShowInactiveCompanies(e.target.checked)}
                />
              }
              label="Mostrar empresas inactivas"
            />
            
            <TextField
              placeholder="Buscar empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Filtrar por...</InputLabel>
              <MuiSelect
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Filtrar por..."
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
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => loadCompanies()}
                sx={{
                  borderColor: '#FF6B6B',
                  color: '#FF6B6B',
                  '&:hover': {
                    borderColor: '#FF5A5A',
                    backgroundColor: 'rgba(255, 107, 107, 0.04)',
                  },
                }}
              >
                Actualizar
              </Button>
            </Box>
          </Box>

          {/* Companies Table */}
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
                        console.log('🟣 Seleccionar todos - allSelectedOnPage:', allSelectedOnPage);
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
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.has(String(company.id))}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('🟡 Checkbox onClick - company.id:', company.id, 'String:', String(company.id));
                          toggleSelectOne(String(company.id));
                        }}
                        inputProps={{
                          'aria-label': `Seleccionar empresa ${company.name}`,
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
                                  <BusinessIcon />
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {company.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    ID: {company.id}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                          );
                        case 'taxDocumentNumber':
                          return (
                            <TableCell key={column.id}>
                              <Typography variant="body2">
                                {company.taxDocumentType}: {company.taxDocumentNumber}
                              </Typography>
                            </TableCell>
                          );
                        case 'location':
                          return (
                            <TableCell key={column.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocationIcon sx={{ mr: 0.5, fontSize: 16, color: PRIMARY.main }} />
                                <Typography variant="body2">
                                  {company.city}, {company.state}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {company.country}
                              </Typography>
                            </TableCell>
                          );
                        case 'contact':
                          return (
                            <TableCell key={column.id}>
                              <Box>
                                {company.email && (
                                  <Typography variant="body2">{company.email}</Typography>
                                )}
                                {company.website && (
                                  <Typography variant="caption" color="text.secondary">
                                    {company.website}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                          );
                        case 'structure':
                          return (
                            <TableCell key={column.id}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <LocationIcon sx={{ mr: 0.5, fontSize: 14, color: PRIMARY.main }} />
                                  <Typography variant="caption">
                                    Sedes
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <ProcessIcon sx={{ mr: 0.5, fontSize: 14, color: PRIMARY.main }} />
                                  <Typography variant="caption">
                                    Procesos
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <JobIcon sx={{ mr: 0.5, fontSize: 14, color: PRIMARY.main }} />
                                  <Typography variant="caption">
                                    Cargos
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <PeopleIcon sx={{ mr: 0.5, fontSize: 14, color: PRIMARY.main }} />
                                  <Typography variant="caption">
                                    Usuarios
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                          );
                        case 'status':
                          return (
                            <TableCell key={column.id}>
                              <Chip
                                label={company.status}
                                color={company.status === 'ACTIVE' ? 'success' : 'default'}
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
                                    onClick={() => handleViewCompany(company)}
                                    sx={{ color: '#2196F3' }}
                                  >
                                    <ViewIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Editar">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenModal(company)}
                                    sx={{ color: '#FF9800' }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Eliminar">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDelete(company)}
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
          background: PRIMARY_GRADIENT,
          '&:hover': {
            background: 'linear-gradient(135deg, #E55A5A 0%, #E57A5A 100%)'
          }
        }}
      >
        <AddIcon />
      </Fab>

      {/* Company Form Modal */}
      <CompanyForm
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        initialData={isBulkEditMode ? null : selectedCompany}
        isEditMode={isEditMode && !isBulkEditMode}
        isBulkEdit={isBulkEditMode}
        selectedCompanies={isBulkEditMode ? selectedCompanyItems : []}
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
      {selectedCompany && (
        <ViewDialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          onEdit={handleEditFromView}
          title={`Empresa: ${selectedCompany.name}`}
          data={selectedCompany}
          type="company"
        />
      )}
    </Box>
  );
};

export default CompanyList;