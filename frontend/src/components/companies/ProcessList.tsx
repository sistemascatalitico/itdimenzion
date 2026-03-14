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
  AccountTree as ProcessIcon,
  Business as BusinessIcon,
  Work as JobIcon,
  KeyboardArrowUp,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import api from '../../config/api';
import ProcessForm from './ProcessForm';
import ViewDialog from '../common/ViewDialog';
import PageHeader from '../common/PageHeader';
import PageHeaderActionButton from '../common/PageHeaderActionButton';
import { processService, Process } from '../../services/processService';
import { companyService, Company } from '../../services/companyService';

interface ProcessListProps {
  onNavigate?: (path: string) => void;
}

const COLUMN_OPTIONS = [
  { id: 'name', label: 'Proceso', visible: true, required: true },
  { id: 'company', label: 'Empresa', visible: true, required: false },
  { id: 'commentary', label: 'Descripción', visible: true, required: false },
  { id: 'status', label: 'Estado', visible: true, required: false },
  { id: 'actions', label: 'Acciones', visible: true, required: true },
];

const COLUMNS_CONFIG_STORAGE_KEY = 'itd_processlist_columns_config';

const ProcessList: React.FC<ProcessListProps> = ({ onNavigate }) => {
  const { user: currentUser } = useAuth();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
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
  const [showInactiveProcesses, setShowInactiveProcesses] = useState(false);
  const [filterCompany, setFilterCompany] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [importMenuAnchor, setImportMenuAnchor] = useState<null | HTMLElement>(null);

  const loadProcesses = useCallback(async (params?: { search?: string }) => {
    try {
      setLoading(true);
      setSearching(true);
      
      const response = await processService.getAll();
      setProcesses(response);
      setMessage(null);
    } catch (error: any) {
      console.error('Error loading processes:', error);
      setMessage({
        type: 'error',
        text: 'Error al cargar los procesos: ' + (error.response?.data?.error || error.message)
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
    loadProcesses();
    loadCompanies();
  }, [loadProcesses, loadCompanies]);

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


  const handleOpenModal = (process?: Process) => {
    if (process) {
      setSelectedProcess(process);
      setIsEditMode(true);
    } else {
      setSelectedProcess(null);
      setIsEditMode(false);
    }
    setModalOpen(true);
  };

  const handleViewProcess = (process: Process) => {
    setSelectedProcess(process);
    setViewDialogOpen(true);
  };

  const handleEditFromView = () => {
    setViewDialogOpen(false);
    setIsEditMode(true);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProcess(null);
    setIsEditMode(false);
    setIsBulkEditMode(false);
    setSelectedIds(new Set());
  };

  const handleSave = async (formData: any) => {
    try {
      if (isBulkEditMode && selectedProcessItems.length > 0) {
        // Bulk edit ya se maneja en el formulario, solo recargar
        setSelectedIds(new Set());
        setIsBulkEditMode(false);
        loadProcesses();
      } else if (isEditMode && selectedProcess) {
        await api.put(`/processes/${selectedProcess.id}`, formData);
        setMessage({ type: 'success', text: 'Proceso actualizado exitosamente' });
        handleCloseModal();
        loadProcesses();
      } else {
        await api.post('/processes', formData);
        setMessage({ type: 'success', text: 'Proceso creado exitosamente' });
        handleCloseModal();
        loadProcesses();
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Error al guardar el proceso: ' + (error.response?.data?.error || error.message)
      });
    }
  };

  const handleDelete = async (process: Process) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el proceso "${process.name}"?`)) {
      try {
        await api.delete(`/processes/${process.id}`);
        setMessage({ type: 'success', text: 'Proceso eliminado exitosamente' });
        loadProcesses();
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
        setMessage({
          type: 'error',
          text: `Error al eliminar el proceso: ${errorMessage}`
        });
        console.error('Delete process error:', error.response?.data);
      }
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) {
      setMessage({ type: 'error', text: 'Selecciona al menos un proceso' });
      return;
    }

    try {
      const processIds = Array.from(selectedIds);
      
      switch (action) {
        case 'activate':
          await api.put('/processes/bulk-activate', { ids: processIds });
          setMessage({ type: 'success', text: `${processIds.length} procesos activados` });
          break;
        case 'deactivate':
          await api.put('/processes/bulk-deactivate', { ids: processIds });
          setMessage({ type: 'success', text: `${processIds.length} procesos desactivados` });
          break;
        case 'delete':
          if (window.confirm(`¿Estás seguro de que deseas eliminar ${processIds.length} procesos?`)) {
            await api.delete('/processes/bulk-delete', { data: { ids: processIds } });
            setMessage({ type: 'success', text: `${processIds.length} procesos eliminados` });
          }
          break;
      }
      
      setSelectedIds(new Set());
      loadProcesses();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Error en la operación masiva: ' + (error.response?.data?.error || error.message)
      });
    }
  };


  const filteredProcesses = useMemo(() => {
    return processes.filter(process => {
      const matchesSearch = !debouncedSearchTerm || 
        process.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (process.commentary && process.commentary.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

      const matchesStatus = !filterStatus || process.status === filterStatus;
      const matchesCompany = !filterCompany || process.companyId.toString() === filterCompany;
      const matchesInactive = showInactiveProcesses || process.status === 'ACTIVE';

      return matchesSearch && matchesStatus && matchesCompany && matchesInactive;
    });
  }, [processes, debouncedSearchTerm, filterStatus, filterCompany, showInactiveProcesses]);

  const visibleColumns = columnsConfig.filter(col => col.visible);

  // Funciones para manejo de selección (similar a Assets) - DEBE IR DESPUÉS de filteredProcesses
  const selectedProcessItems = useMemo(() => {
    return filteredProcesses.filter(p => selectedIds.has(String(p.id)));
  }, [filteredProcesses, selectedIds]);

  const allSelectedOnPage = useMemo(() => {
    if (filteredProcesses.length === 0) return false;
    return filteredProcesses.every(p => selectedIds.has(String(p.id)));
  }, [filteredProcesses, selectedIds]);

  const someSelectedOnPage = useMemo(() => {
    return filteredProcesses.some(p => selectedIds.has(String(p.id))) && !allSelectedOnPage;
  }, [filteredProcesses, selectedIds, allSelectedOnPage]);

  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (allSelectedOnPage) {
        filteredProcesses.forEach(p => newSelected.delete(String(p.id)));
      } else {
        filteredProcesses.forEach(p => newSelected.add(String(p.id)));
      }
      return newSelected;
    });
  }, [allSelectedOnPage, filteredProcesses]);

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
        title="Gestión de Procesos"
        subtitle="Administra los procesos de las empresas"
        action={<PageHeaderActionButton label="Nuevo Proceso" startIcon={<AddIcon />} onClick={() => handleOpenModal()} />}
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
              Lista de Procesos ({filteredProcesses.length})
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
                  checked={showInactiveProcesses}
                  onChange={(e) => setShowInactiveProcesses(e.target.checked)}
                />
              }
              label="Mostrar procesos inactivos"
            />
            
            <TextField
              placeholder="Buscar proceso..."
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
                <MuiMenuItem value="ACTIVE">Activos</MuiMenuItem>
                <MuiMenuItem value="INACTIVE">Inactivos</MuiMenuItem>
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
                onClick={() => loadProcesses()}
                sx={{
                  backgroundColor: '#FF9800',
                  '&:hover': { backgroundColor: '#F57C00' }
                }}
              >
                Actualizar
              </Button>
            </Box>
          </Box>

          {/* Processes Table */}
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
                {filteredProcesses.map((process) => (
                  <TableRow key={process.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIds.has(String(process.id))}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectOne(String(process.id));
                      }}
                      inputProps={{
                        'aria-label': `Seleccionar proceso ${process.name}`,
                      }}
                    />
                  </TableCell>
                    {visibleColumns.map((column) => {
                      switch (column.id) {
                        case 'name':
                          return (
                            <TableCell key={column.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ bgcolor: '#FF9800', mr: 2, width: 32, height: 32 }}>
                                  <ProcessIcon />
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {process.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    ID: {process.id}
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
                                  {process.company?.name || 'Sin empresa'}
                                </Typography>
                              </Box>
                            </TableCell>
                          );
                        case 'commentary':
                          return (
                            <TableCell key={column.id}>
                              <Typography variant="body2" color="text.secondary">
                                {process.commentary || 'Sin descripción'}
                              </Typography>
                            </TableCell>
                          );
                        case 'status':
                          return (
                            <TableCell key={column.id}>
                              <Chip
                                label={process.status}
                                color={process.status === 'ACTIVE' ? 'success' : 'default'}
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
                                    onClick={() => handleViewProcess(process)}
                                    sx={{ color: '#2196F3' }}
                                  >
                                    <ViewIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Editar">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenModal(process)}
                                    sx={{ color: '#FF9800' }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Eliminar">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDelete(process)}
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

      {/* Process Form Modal */}
      <ProcessForm
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        initialData={selectedProcess}
        isEditMode={isEditMode}
        isBulkEdit={isBulkEditMode}
        selectedProcesses={isBulkEditMode ? selectedProcessItems : []}
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
      {selectedProcess && (
        <ViewDialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          onEdit={handleEditFromView}
          title={`Proceso: ${selectedProcess.name}`}
          data={selectedProcess}
          type="process"
        />
      )}
    </Box>
  );
};

export default ProcessList;


