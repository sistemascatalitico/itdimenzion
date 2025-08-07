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
  Work as JobIcon,
  AccountTree as ProcessIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  ContentCopy as CopyIcon,
  FilterList as FilterIcon,
  SupervisorAccount as ManagerIcon
} from '@mui/icons-material';

// Types
interface JobTitle {
  id: number;
  name: string;
  description?: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
  processManager: boolean;
  process: {
    id: number;
    name: string;
    code: string;
  };
  companies: Array<{
    id: number;
    name: string;
    nit: string;
  }>;
  _count: {
    users: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Process {
  id: number;
  name: string;
  code: string;
}

interface Company {
  id: number;
  name: string;
  nit: string;
}

interface JobTitleListProps {
  onCreateNew: () => void;
  onEdit: (jobTitle: JobTitle) => void;
  onView: (jobTitle: JobTitle) => void;
  onDelete: (jobTitle: JobTitle) => void;
}

const JobTitleList: React.FC<JobTitleListProps> = ({
  onCreateNew,
  onEdit,
  onView,
  onDelete
}) => {
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProcess, setSelectedProcess] = useState<number | ''>('');
  const [selectedCompany, setSelectedCompany] = useState<number | ''>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobTitleToDelete, setJobTitleToDelete] = useState<JobTitle | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedJobTitle, setSelectedJobTitle] = useState<JobTitle | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadJobTitles(), loadProcesses(), loadCompanies()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJobTitles = async () => {
    try {
      // TODO: Replace with actual API call
      const mockJobTitles: JobTitle[] = [
        {
          id: 1,
          name: 'Desarrollador Senior',
          description: 'Desarrollo de aplicaciones full-stack, arquitectura de software y mentoría a desarrolladores junior',
          code: 'TEC-DEV01',
          status: 'ACTIVE',
          processManager: false,
          process: {
            id: 2,
            name: 'Tecnología',
            code: 'TEC-001'
          },
          companies: [
            { id: 1, name: 'ITDimenzion SAS', nit: '900123456-1' },
            { id: 3, name: 'InnovaTech SA', nit: '700555444-3' }
          ],
          _count: {
            users: 8
          },
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-08-06T15:45:00.000Z'
        },
        {
          id: 2,
          name: 'Gerente de Recursos Humanos',
          description: 'Gestión integral del talento humano, estrategias de reclutamiento y desarrollo organizacional',
          code: 'RH-GER01',
          status: 'ACTIVE',
          processManager: true,
          process: {
            id: 1,
            name: 'Recursos Humanos',
            code: 'RH-001'
          },
          companies: [
            { id: 1, name: 'ITDimenzion SAS', nit: '900123456-1' },
            { id: 2, name: 'TechCorp Colombia', nit: '800987654-2' }
          ],
          _count: {
            users: 2
          },
          createdAt: '2024-01-20T08:15:00.000Z',
          updatedAt: '2024-08-05T12:30:00.000Z'
        },
        {
          id: 3,
          name: 'Analista Financiero',
          description: 'Análisis financiero, elaboración de presupuestos y reportes de gestión',
          code: 'FIN-ANA01',
          status: 'ACTIVE',
          processManager: false,
          process: {
            id: 3,
            name: 'Finanzas',
            code: 'FIN-001'
          },
          companies: [
            { id: 2, name: 'TechCorp Colombia', nit: '800987654-2' }
          ],
          _count: {
            users: 3
          },
          createdAt: '2024-02-10T09:30:00.000Z',
          updatedAt: '2024-08-04T16:20:00.000Z'
        },
        {
          id: 4,
          name: 'Director de Tecnología',
          description: 'Dirección estratégica del área de tecnología, innovación y transformación digital',
          code: 'TEC-DIR01',
          status: 'ACTIVE',
          processManager: true,
          process: {
            id: 2,
            name: 'Tecnología',
            code: 'TEC-001'
          },
          companies: [
            { id: 1, name: 'ITDimenzion SAS', nit: '900123456-1' },
            { id: 3, name: 'InnovaTech SA', nit: '700555444-3' }
          ],
          _count: {
            users: 1
          },
          createdAt: '2024-02-15T11:45:00.000Z',
          updatedAt: '2024-08-03T14:10:00.000Z'
        },
        {
          id: 5,
          name: 'Especialista en Marketing Digital',
          description: 'Gestión de campañas digitales, SEO/SEM, redes sociales y análisis de métricas',
          code: 'VYM-ESP01',
          status: 'ACTIVE',
          processManager: false,
          process: {
            id: 4,
            name: 'Ventas y Marketing',
            code: 'VYM-001'
          },
          companies: [
            { id: 1, name: 'ITDimenzion SAS', nit: '900123456-1' },
            { id: 2, name: 'TechCorp Colombia', nit: '800987654-2' },
            { id: 3, name: 'InnovaTech SA', nit: '700555444-3' }
          ],
          _count: {
            users: 5
          },
          createdAt: '2024-03-01T07:20:00.000Z',
          updatedAt: '2024-07-20T10:30:00.000Z'
        },
        {
          id: 6,
          name: 'Desarrollador Junior',
          description: 'Desarrollo de funcionalidades bajo supervisión, aprendizaje y crecimiento técnico',
          code: 'TEC-DEV02',
          status: 'INACTIVE',
          processManager: false,
          process: {
            id: 2,
            name: 'Tecnología',
            code: 'TEC-001'
          },
          companies: [
            { id: 1, name: 'ITDimenzion SAS', nit: '900123456-1' }
          ],
          _count: {
            users: 0
          },
          createdAt: '2024-03-10T14:20:00.000Z',
          updatedAt: '2024-07-15T09:10:00.000Z'
        }
      ];
      setJobTitles(mockJobTitles);
    } catch (error) {
      console.error('Error loading job titles:', error);
    }
  };

  const loadProcesses = async () => {
    try {
      // TODO: Replace with actual API call
      const mockProcesses: Process[] = [
        { id: 1, name: 'Recursos Humanos', code: 'RH-001' },
        { id: 2, name: 'Tecnología', code: 'TEC-001' },
        { id: 3, name: 'Finanzas', code: 'FIN-001' },
        { id: 4, name: 'Ventas y Marketing', code: 'VYM-001' }
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
        { id: 3, name: 'InnovaTech SA', nit: '700555444-3' }
      ];
      setCompanies(mockCompanies);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, jobTitle: JobTitle) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedJobTitle(jobTitle);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedJobTitle(null);
  };

  const handleDeleteClick = (jobTitle: JobTitle) => {
    setJobTitleToDelete(jobTitle);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (jobTitleToDelete) {
      try {
        await onDelete(jobTitleToDelete);
        await loadJobTitles(); // Reload the list
        setDeleteDialogOpen(false);
        setJobTitleToDelete(null);
      } catch (error) {
        console.error('Error deleting job title:', error);
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

  const filteredJobTitles = jobTitles.filter(jobTitle => {
    const matchesSearch = jobTitle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         jobTitle.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         jobTitle.process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (jobTitle.description && jobTitle.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesProcess = selectedProcess === '' || jobTitle.process.id === selectedProcess;
    
    const matchesCompany = selectedCompany === '' || 
                          jobTitle.companies.some(company => company.id === selectedCompany);
    
    return matchesSearch && matchesProcess && matchesCompany;
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <JobIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Gestión de Cargos
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateNew}
          sx={{ borderRadius: 2 }}
        >
          Nuevo Cargo
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Buscar por nombre, código, proceso o descripción..."
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
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Proceso</InputLabel>
                <Select
                  value={selectedProcess}
                  onChange={(e) => setSelectedProcess(e.target.value as number | '')}
                  label="Proceso"
                  startAdornment={<ProcessIcon sx={{ mr: 1, fontSize: 20 }} />}
                >
                  <MenuItem value="">Todos los procesos</MenuItem>
                  {processes.map((process) => (
                    <MenuItem key={process.id} value={process.id}>
                      {process.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Empresa</InputLabel>
                <Select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value as number | '')}
                  label="Empresa"
                  startAdornment={<BusinessIcon sx={{ mr: 1, fontSize: 20 }} />}
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
            <Grid item xs={12} md={1}>
              <Typography variant="body2" color="text.secondary" align="center">
                {filteredJobTitles.length} cargo{filteredJobTitles.length !== 1 ? 's' : ''}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Job Titles Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cargo</TableCell>
                <TableCell>Proceso</TableCell>
                <TableCell>Código</TableCell>
                <TableCell>Empresas</TableCell>
                <TableCell>Usuarios</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Cargando cargos...
                  </TableCell>
                </TableRow>
              ) : filteredJobTitles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {searchTerm || selectedProcess || selectedCompany ? 'No se encontraron cargos' : 'No hay cargos registrados'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobTitles.map((jobTitle) => (
                  <TableRow key={jobTitle.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ 
                          mr: 2, 
                          bgcolor: jobTitle.processManager ? 'warning.light' : 'primary.light',
                          color: jobTitle.processManager ? 'warning.contrastText' : 'primary.contrastText'
                        }}>
                          {jobTitle.processManager ? <ManagerIcon /> : <JobIcon />}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {jobTitle.name}
                          </Typography>
                          {jobTitle.description && (
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
                              {jobTitle.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ProcessIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {jobTitle.process.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                            {jobTitle.process.code}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontWeight="bold">
                        {jobTitle.code}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 200 }}>
                        {jobTitle.companies.slice(0, 2).map((company) => (
                          <Chip
                            key={company.id}
                            label={company.name}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        ))}
                        {jobTitle.companies.length > 2 && (
                          <Chip
                            label={`+${jobTitle.companies.length - 2}`}
                            size="small"
                            color="default"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {jobTitle.companies.length} empresa{jobTitle.companies.length !== 1 ? 's' : ''}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PeopleIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {jobTitle._count.users} usuario{jobTitle._count.users !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      {jobTitle.processManager ? (
                        <Chip
                          icon={<ManagerIcon />}
                          label="Manager"
                          color="warning"
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          label="Regular"
                          color="default"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={getStatusLabel(jobTitle.status)}
                        color={getStatusColor(jobTitle.status) as any}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip title="Ver detalles">
                          <IconButton
                            size="small"
                            onClick={() => onView(jobTitle)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => onEdit(jobTitle)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Más opciones">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, jobTitle)}
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
        <MenuItem onClick={() => selectedJobTitle && handleCopyCode(selectedJobTitle.code)}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copiar código</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => selectedJobTitle && handleDeleteClick(selectedJobTitle)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar cargo</ListItemText>
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
            ¿Estás seguro de que deseas eliminar el cargo{' '}
            <strong>{jobTitleToDelete?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Se eliminarán también todos los usuarios asociados a este cargo.
          </Typography>
          {jobTitleToDelete && jobTitleToDelete._count.users > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Este cargo tiene {jobTitleToDelete._count.users} usuario{jobTitleToDelete._count.users !== 1 ? 's' : ''} asignado{jobTitleToDelete._count.users !== 1 ? 's' : ''}. 
              Se recomienda reasignar los usuarios antes de eliminar el cargo.
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

export default JobTitleList;