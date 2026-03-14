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
  Work as JobIcon,
  Business as BusinessIcon,
  AccountTree as ProcessIcon,
  KeyboardArrowUp,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import api from '../../config/api';
import JobTitleForm from './JobTitleForm';
import ViewDialog from '../common/ViewDialog';
import PageHeader from '../common/PageHeader';
import PageHeaderActionButton from '../common/PageHeaderActionButton';
import { jobTitleService, JobTitle } from '../../services/jobTitleService';
import { companyService, Company } from '../../services/companyService';
import { processService, Process } from '../../services/processService';

interface JobTitleListProps {
  onNavigate?: (path: string) => void;
}

const COLUMN_OPTIONS = [
  { id: 'name', label: 'Cargo', visible: true, required: true },
  { id: 'company', label: 'Empresa', visible: true, required: false },
  { id: 'process', label: 'Proceso', visible: true, required: false },
  { id: 'commentary', label: 'Descripción', visible: true, required: false },
  { id: 'status', label: 'Estado', visible: true, required: false },
  { id: 'actions', label: 'Acciones', visible: true, required: true },
];

const COLUMNS_CONFIG_STORAGE_KEY = 'itd_jobtitlelist_columns_config';

const JobTitleList: React.FC<JobTitleListProps> = ({ onNavigate }) => {
  const { user: currentUser } = useAuth();
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedJobTitle, setSelectedJobTitle] = useState<JobTitle | null>(null);
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
  const [showInactiveJobTitles, setShowInactiveJobTitles] = useState(false);
  const [filterCompany, setFilterCompany] = useState<string>('');
  const [filterProcess, setFilterProcess] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [importMenuAnchor, setImportMenuAnchor] = useState<null | HTMLElement>(null);

  const loadJobTitles = useCallback(async (params?: { search?: string }) => {
    try {
      setLoading(true);
      setSearching(true);
      
      const response = await jobTitleService.getAll();
      setJobTitles(response);
      setMessage(null);
    } catch (error: any) {
      console.error('Error loading job titles:', error);
      setMessage({
        type: 'error',
        text: 'Error al cargar los cargos: ' + (error.response?.data?.error || error.message)
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

  const loadProcesses = useCallback(async () => {
    try {
      const response = await processService.getAll();
      setProcesses(response);
    } catch (error: any) {
      console.error('Error loading processes:', error);
    }
  }, []);

  useEffect(() => {
    loadJobTitles();
    loadCompanies();
    loadProcesses();
  }, [loadJobTitles, loadCompanies, loadProcesses]);

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


  const handleOpenModal = (jobTitle?: JobTitle) => {
    if (jobTitle) {
      setSelectedJobTitle(jobTitle);
      setIsEditMode(true);
    } else {
      setSelectedJobTitle(null);
      setIsEditMode(false);
    }
    setModalOpen(true);
  };

  const handleViewJobTitle = (jobTitle: JobTitle) => {
    setSelectedJobTitle(jobTitle);
    setViewDialogOpen(true);
  };

  const handleEditFromView = () => {
    setViewDialogOpen(false);
    setIsEditMode(true);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedJobTitle(null);
    setIsEditMode(false);
    setIsBulkEditMode(false);
    setSelectedIds(new Set());
  };

  const handleSave = async (formData: any) => {
    try {
      if (isEditMode && selectedJobTitle) {
        await api.put(`/job-titles/${selectedJobTitle.id}`, formData);
        setMessage({ type: 'success', text: 'Cargo actualizado exitosamente' });
      } else {
        await api.post('/job-titles', formData);
        setMessage({ type: 'success', text: 'Cargo creado exitosamente' });
      }
      handleCloseModal();
      loadJobTitles();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Error al guardar el cargo: ' + (error.response?.data?.error || error.message)
      });
    }
  };

  const handleDelete = async (jobTitle: JobTitle) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el cargo "${jobTitle.name}"?`)) {
      try {
        await api.delete(`/job-titles/${jobTitle.id}`);
        setMessage({ type: 'success', text: 'Cargo eliminado exitosamente' });
        loadJobTitles();
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
        setMessage({
          type: 'error',
          text: `Error al eliminar el cargo: ${errorMessage}`
        });
        console.error('Delete job title error:', error.response?.data);
      }
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) {
      setMessage({ type: 'error', text: 'Selecciona al menos un cargo' });
      return;
    }

    try {
      const jobTitleIds = Array.from(selectedIds);
      
      switch (action) {
        case 'activate':
          await api.put('/job-titles/bulk-activate', { ids: jobTitleIds });
          setMessage({ type: 'success', text: `${jobTitleIds.length} cargos activados` });
          break;
        case 'deactivate':
          await api.put('/job-titles/bulk-deactivate', { ids: jobTitleIds });
          setMessage({ type: 'success', text: `${jobTitleIds.length} cargos desactivados` });
          break;
        case 'delete':
          if (window.confirm(`¿Estás seguro de que deseas eliminar ${jobTitleIds.length} cargos?`)) {
            await api.delete('/job-titles/bulk-delete', { data: { ids: jobTitleIds } });
            setMessage({ type: 'success', text: `${jobTitleIds.length} cargos eliminados` });
          }
          break;
      }
      
      setSelectedIds(new Set());
      loadJobTitles();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Error en la operación masiva: ' + (error.response?.data?.error || error.message)
      });
    }
  };

  const filteredJobTitles = useMemo(() => {
    return jobTitles.filter(jobTitle => {
      const matchesSearch = !debouncedSearchTerm || 
        jobTitle.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (jobTitle.commentary && jobTitle.commentary.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

      const matchesStatus = !filterStatus || jobTitle.status === filterStatus;
      const matchesCompany = !filterCompany || jobTitle.companyId.toString() === filterCompany;
      const matchesProcess = !filterProcess || jobTitle.processId.toString() === filterProcess;
      const matchesInactive = showInactiveJobTitles || jobTitle.status === 'ACTIVE';

      return matchesSearch && matchesStatus && matchesCompany && matchesProcess && matchesInactive;
    });
  }, [jobTitles, debouncedSearchTerm, filterStatus, filterCompany, filterProcess, showInactiveJobTitles]);

  const visibleColumns = columnsConfig.filter(col => col.visible);

  // Funciones para manejo de selección (similar a Assets) - DEBE IR DESPUÉS de filteredJobTitles
  const selectedJobTitleItems = useMemo(() => {
    return filteredJobTitles.filter(j => selectedIds.has(String(j.id)));
  }, [filteredJobTitles, selectedIds]);

  const allSelectedOnPage = useMemo(() => {
    if (filteredJobTitles.length === 0) return false;
    return filteredJobTitles.every(j => selectedIds.has(String(j.id)));
  }, [filteredJobTitles, selectedIds]);

  const someSelectedOnPage = useMemo(() => {
    return filteredJobTitles.some(j => selectedIds.has(String(j.id))) && !allSelectedOnPage;
  }, [filteredJobTitles, selectedIds, allSelectedOnPage]);

  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (allSelectedOnPage) {
        filteredJobTitles.forEach(j => newSelected.delete(String(j.id)));
      } else {
        filteredJobTitles.forEach(j => newSelected.add(String(j.id)));
      }
      return newSelected;
    });
  }, [allSelectedOnPage, filteredJobTitles]);

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
        title="Gestión de Cargos"
        subtitle="Administra los cargos de los procesos"
        action={<PageHeaderActionButton label="Nuevo Cargo" startIcon={<AddIcon />} onClick={() => handleOpenModal()} />}
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
              Lista de Cargos ({filteredJobTitles.length})
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
                  checked={showInactiveJobTitles}
                  onChange={(e) => setShowInactiveJobTitles(e.target.checked)}
                />
              }
              label="Mostrar cargos inactivos"
            />
            
            <TextField
              placeholder="Buscar cargo..."
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
              <InputLabel>Proceso</InputLabel>
              <MuiSelect
                value={filterProcess}
                onChange={(e) => setFilterProcess(e.target.value)}
                label="Proceso"
              >
                <MuiMenuItem value="">Todos</MuiMenuItem>
                {processes.map((process) => (
                  <MuiMenuItem key={process.id} value={process.id.toString()}>
                    {process.name}
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
                onClick={() => loadJobTitles()}
                sx={{
                  backgroundColor: '#9C27B0',
                  '&:hover': { backgroundColor: '#7B1FA2' }
                }}
              >
                Actualizar
              </Button>
            </Box>
          </Box>

          {/* Job Titles Table */}
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
                {filteredJobTitles.map((jobTitle) => (
                  <TableRow key={jobTitle.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIds.has(String(jobTitle.id))}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectOne(String(jobTitle.id));
                      }}
                      inputProps={{
                        'aria-label': `Seleccionar cargo ${jobTitle.name}`,
                      }}
                    />
                  </TableCell>
                    {visibleColumns.map((column) => {
                      switch (column.id) {
                        case 'name':
                          return (
                            <TableCell key={column.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ bgcolor: '#9C27B0', mr: 2, width: 32, height: 32 }}>
                                  <JobIcon />
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {jobTitle.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    ID: {jobTitle.id}
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
                                  {jobTitle.company?.name || 'Sin empresa'}
                                </Typography>
                              </Box>
                            </TableCell>
                          );
                        case 'process':
                          return (
                            <TableCell key={column.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <ProcessIcon sx={{ mr: 0.5, fontSize: 16, color: '#FF9800' }} />
                                <Typography variant="body2">
                                  {jobTitle.process?.name || 'Sin proceso'}
                                </Typography>
                              </Box>
                            </TableCell>
                          );
                        case 'commentary':
                          return (
                            <TableCell key={column.id}>
                              <Typography variant="body2" color="text.secondary">
                                {jobTitle.commentary || 'Sin descripción'}
                              </Typography>
                            </TableCell>
                          );
                        case 'status':
                          return (
                            <TableCell key={column.id}>
                              <Chip
                                label={jobTitle.status}
                                color={jobTitle.status === 'ACTIVE' ? 'success' : 'default'}
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
                                    onClick={() => handleViewJobTitle(jobTitle)}
                                    sx={{ color: '#2196F3' }}
                                  >
                                    <ViewIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Editar">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenModal(jobTitle)}
                                    sx={{ color: '#FF9800' }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Eliminar">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDelete(jobTitle)}
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

      {/* Job Title Form Modal */}
      <JobTitleForm
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        initialData={selectedJobTitle}
        isEditMode={isEditMode}
        companies={companies}
        processes={processes}
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
      {selectedJobTitle && (
        <ViewDialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          onEdit={handleEditFromView}
          title={`Cargo: ${selectedJobTitle.name}`}
          data={selectedJobTitle}
          type="jobtitle"
        />
      )}
    </Box>
  );
};

export default JobTitleList;


