import React, { useState, useEffect } from 'react';
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
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountTree as ProcessIcon,
  Business as BusinessIcon,
  Work as JobIcon,
  People as PeopleIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  ContentCopy as CopyIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

// Types
interface Process {
  id: number;
  name: string;
  description?: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
  companies: Array<{
    id: number;
    name: string;
    nit: string;
  }>;
  _count: {
    jobTitles: number;
    users: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Company {
  id: number;
  name: string;
  nit: string;
}

interface ProcessListProps {
  onCreateNew: () => void;
  onEdit: (process: Process) => void;
  onView: (process: Process) => void;
  onDelete: (process: Process) => void;
}

const ProcessList: React.FC<ProcessListProps> = ({
  onCreateNew,
  onEdit,
  onView,
  onDelete
}) => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<number | ''>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [processToDelete, setProcessToDelete] = useState<Process | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadProcesses(), loadCompanies()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProcesses = async () => {
    try {
      // TODO: Replace with actual API call
      const mockProcesses: Process[] = [
        {
          id: 1,
          name: 'Recursos Humanos',
          description: 'Gestión del talento humano, reclutamiento, nómina y desarrollo organizacional',
          code: 'RH-001',
          status: 'ACTIVE',
          companies: [
            { id: 1, name: 'ITDimenzion SAS', nit: '900123456-1' },
            { id: 2, name: 'TechCorp Colombia', nit: '800987654-2' }
          ],
          _count: {
            jobTitles: 5,
            users: 12
          },
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-08-06T15:45:00.000Z'
        },
        {
          id: 2,
          name: 'Tecnología',
          description: 'Desarrollo de software, infraestructura IT y soporte técnico',
          code: 'TEC-001',
          status: 'ACTIVE',
          companies: [
            { id: 1, name: 'ITDimenzion SAS', nit: '900123456-1' },
            { id: 3, name: 'InnovaTech SA', nit: '700555444-3' }
          ],
          _count: {
            jobTitles: 8,
            users: 25
          },
          createdAt: '2024-01-20T08:15:00.000Z',
          updatedAt: '2024-08-05T12:30:00.000Z'
        },
        {
          id: 3,
          name: 'Finanzas',
          description: 'Gestión financiera, contabilidad, presupuestos y análisis financiero',
          code: 'FIN-001',
          status: 'ACTIVE',
          companies: [
            { id: 2, name: 'TechCorp Colombia', nit: '800987654-2' }
          ],
          _count: {
            jobTitles: 4,
            users: 8
          },
          createdAt: '2024-02-10T09:30:00.000Z',
          updatedAt: '2024-08-04T16:20:00.000Z'
        },
        {
          id: 4,
          name: 'Ventas y Marketing',
          description: 'Estrategias comerciales, marketing digital y atención al cliente',
          code: 'VYM-001',
          status: 'ACTIVE',
          companies: [
            { id: 1, name: 'ITDimenzion SAS', nit: '900123456-1' },
            { id: 2, name: 'TechCorp Colombia', nit: '800987654-2' },
            { id: 3, name: 'InnovaTech SA', nit: '700555444-3' }
          ],
          _count: {
            jobTitles: 6,
            users: 18
          },
          createdAt: '2024-02-15T11:45:00.000Z',
          updatedAt: '2024-08-03T14:10:00.000Z'
        },
        {
          id: 5,
          name: 'Operaciones',
          description: 'Gestión operativa, logística y control de procesos',
          code: 'OPE-001',
          status: 'INACTIVE',
          companies: [
            { id: 3, name: 'InnovaTech SA', nit: '700555444-3' }
          ],
          _count: {
            jobTitles: 3,
            users: 0
          },
          createdAt: '2024-03-01T07:20:00.000Z',
          updatedAt: '2024-07-20T10:30:00.000Z'
        }
      ];
      setProcesses(mockProcesses);
    } catch (error) {
      console.error('Error loading processes:', error);
    }
  };

  const loadCompanies = async () => {
    try {
      // TODO: Replace with actual API call
      const mockCompanies: Company[] = [
        { id: 1, name: 'ITDimenzion SAS', nit: '900123456-1' },
        { id: 2, name: 'TechCorp Colombia', nit: '800987654-2' },
        { id: 3, name: 'InnovaTech SA', nit: '700555444-3' },
        { id: 4, name: 'Digital Solutions', nit: '600333222-4' },
        { id: 5, name: 'Smart Systems', nit: '500111000-5' }
      ];
      setCompanies(mockCompanies);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, process: Process) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedProcess(process);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedProcess(null);
  };

  const handleDeleteClick = (process: Process) => {
    setProcessToDelete(process);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (processToDelete) {
      try {
        await onDelete(processToDelete);
        await loadProcesses(); // Reload the list
        setDeleteDialogOpen(false);
        setProcessToDelete(null);
      } catch (error) {
        console.error('Error deleting process:', error);
      }
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activo';
      case 'INACTIVE':
        return 'Inactivo';
      default:
        return status;
    }
  };

  const filteredProcesses = processes.filter(process => {
    const matchesSearch = process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         process.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (process.description && process.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCompany = selectedCompany === '' || 
                          process.companies.some(company => company.id === selectedCompany);
    
    return matchesSearch && matchesCompany;
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ProcessIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Gestión de Procesos
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateNew}
          sx={{ borderRadius: 2 }}
        >
          Nuevo Proceso
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Buscar por nombre, código o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filtrar por Empresa</InputLabel>
                <Select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value as number | '')}
                  label="Filtrar por Empresa"
                  startAdornment={<FilterIcon sx={{ mr: 1 }} />}
                >
                  <MenuItem value="">Todas las empresas</MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                {filteredProcesses.length} proceso{filteredProcesses.length !== 1 ? 's' : ''}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Processes Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Proceso</TableCell>
                <TableCell>Código</TableCell>
                <TableCell>Empresas</TableCell>
                <TableCell>Cargos</TableCell>
                <TableCell>Usuarios</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Cargando procesos...
                  </TableCell>
                </TableRow>
              ) : filteredProcesses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {searchTerm || selectedCompany ? 'No se encontraron procesos' : 'No hay procesos registrados'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProcesses.map((process) => (
                  <TableRow key={process.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'info.light' }}>
                          <ProcessIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {process.name}
                          </Typography>
                          {process.description && (
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                maxWidth: 300
                              }}
                            >
                              {process.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontWeight="bold">
                        {process.code}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 250 }}>
                        {process.companies.slice(0, 2).map((company) => (
                          <Chip
                            key={company.id}
                            label={company.name}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                        {process.companies.length > 2 && (
                          <Chip
                            label={`+${process.companies.length - 2}`}
                            size="small"
                            color="default"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {process.companies.length} empresa{process.companies.length !== 1 ? 's' : ''}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <JobIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {process._count.jobTitles} cargo{process._count.jobTitles !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PeopleIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {process._count.users} usuario{process._count.users !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={getStatusLabel(process.status)}
                        color={getStatusColor(process.status) as any}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip title="Ver detalles">
                          <IconButton
                            size="small"
                            onClick={() => onView(process)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => onEdit(process)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Más opciones">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, process)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedProcess && handleCopyCode(selectedProcess.code)}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copiar código</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => selectedProcess && handleDeleteClick(selectedProcess)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar proceso</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta acción no se puede deshacer
          </Alert>
          <Typography>
            ¿Estás seguro de que deseas eliminar el proceso{' '}
            <strong>{processToDelete?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Se eliminarán también todos los cargos (JobTitles) y usuarios asociados a este proceso.
          </Typography>
          {processToDelete && processToDelete._count.users > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Este proceso tiene {processToDelete._count.users} usuario{processToDelete._count.users !== 1 ? 's' : ''} asignado{processToDelete._count.users !== 1 ? 's' : ''}. 
              Se recomienda reasignar los usuarios antes de eliminar el proceso.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProcessList;