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
  Select
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  ContentCopy as CopyIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

// Types
interface Headquarters {
  id: number;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
  company: {
    id: number;
    name: string;
    nit: string;
  };
  city?: {
    id: number;
    name: string;
    state: {
      name: string;
      country: {
        name: string;
      };
    };
  };
  _count: {
    users: number;
    assets: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Company {
  id: number;
  name: string;
  nit: string;
}

interface HeadquartersListProps {
  onCreateNew: () => void;
  onEdit: (headquarters: Headquarters) => void;
  onView: (headquarters: Headquarters) => void;
  onDelete: (headquarters: Headquarters) => void;
}

const HeadquartersList: React.FC<HeadquartersListProps> = ({
  onCreateNew,
  onEdit,
  onView,
  onDelete
}) => {
  const [headquarters, setHeadquarters] = useState<Headquarters[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<number | ''>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [headquartersToDelete, setHeadquartersToDelete] = useState<Headquarters | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedHeadquarters, setSelectedHeadquarters] = useState<Headquarters | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadHeadquarters(), loadCompanies()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHeadquarters = async () => {
    try {
      // TODO: Replace with actual API call
      const mockHeadquarters: Headquarters[] = [
        {
          id: 1,
          name: 'Sede Principal',
          description: 'Oficina central de la empresa',
          address: 'Carrera 43A #1-50',
          phone: '+57 4 123 4567',
          email: 'principal@itdimenzion.com',
          code: 'ITD-001',
          status: 'ACTIVE',
          company: {
            id: 1,
            name: 'ITDimenzion SAS',
            nit: '900123456-1'
          },
          city: {
            id: 1,
            name: 'Medellín',
            state: {
              name: 'Antioquia',
              country: {
                name: 'Colombia'
              }
            }
          },
          _count: {
            users: 15,
            assets: 75
          },
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-08-06T15:45:00.000Z'
        },
        {
          id: 2,
          name: 'Sede Norte',
          description: 'Oficina del norte de la ciudad',
          address: 'Calle 80 #30-20',
          phone: '+57 4 234 5678',
          email: 'norte@itdimenzion.com',
          code: 'ITD-002',
          status: 'ACTIVE',
          company: {
            id: 1,
            name: 'ITDimenzion SAS',
            nit: '900123456-1'
          },
          city: {
            id: 1,
            name: 'Medellín',
            state: {
              name: 'Antioquia',
              country: {
                name: 'Colombia'
              }
            }
          },
          _count: {
            users: 10,
            assets: 45
          },
          createdAt: '2024-02-20T08:15:00.000Z',
          updatedAt: '2024-08-05T12:30:00.000Z'
        },
        {
          id: 3,
          name: 'Oficina Central',
          description: 'Sede principal en Bogotá',
          address: 'Calle 100 #10-20',
          phone: '+57 1 234 5678',
          email: 'central@techcorp.co',
          code: 'TEC-001',
          status: 'ACTIVE',
          company: {
            id: 2,
            name: 'TechCorp Colombia',
            nit: '800987654-2'
          },
          city: {
            id: 4,
            name: 'Bogotá',
            state: {
              name: 'Cundinamarca',
              country: {
                name: 'Colombia'
              }
            }
          },
          _count: {
            users: 30,
            assets: 120
          },
          createdAt: '2024-03-20T08:15:00.000Z',
          updatedAt: '2024-08-05T12:30:00.000Z'
        }
      ];
      setHeadquarters(mockHeadquarters);
    } catch (error) {
      console.error('Error loading headquarters:', error);
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, hq: Headquarters) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedHeadquarters(hq);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedHeadquarters(null);
  };

  const handleDeleteClick = (hq: Headquarters) => {
    setHeadquartersToDelete(hq);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (headquartersToDelete) {
      try {
        await onDelete(headquartersToDelete);
        await loadHeadquarters(); // Reload the list
        setDeleteDialogOpen(false);
        setHeadquartersToDelete(null);
      } catch (error) {
        console.error('Error deleting headquarters:', error);
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
        return 'Activa';
      case 'INACTIVE':
        return 'Inactiva';
      default:
        return status;
    }
  };

  const filteredHeadquarters = headquarters.filter(hq => {
    const matchesSearch = hq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hq.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hq.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (hq.email && hq.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCompany = selectedCompany === '' || hq.company.id === selectedCompany;
    
    return matchesSearch && matchesCompany;
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Gestión de Sedes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateNew}
          sx={{ borderRadius: 2 }}
        >
          Nueva Sede
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Buscar por nombre, código, empresa o email..."
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
                {filteredHeadquarters.length} sede{filteredHeadquarters.length !== 1 ? 's' : ''}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Headquarters Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sede</TableCell>
                <TableCell>Empresa</TableCell>
                <TableCell>Ubicación</TableCell>
                <TableCell>Código</TableCell>
                <TableCell>Usuarios</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Cargando sedes...
                  </TableCell>
                </TableRow>
              ) : filteredHeadquarters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {searchTerm || selectedCompany ? 'No se encontraron sedes' : 'No hay sedes registradas'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredHeadquarters.map((hq) => (
                  <TableRow key={hq.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'secondary.light' }}>
                          <BusinessIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {hq.name}
                          </Typography>
                          {hq.description && (
                            <Typography variant="caption" color="text.secondary">
                              {hq.description}
                            </Typography>
                          )}
                          {hq.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <EmailIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {hq.email}
                              </Typography>
                            </Box>
                          )}
                          {hq.phone && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PhoneIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {hq.phone}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {hq.company.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                          {hq.company.nit}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      {hq.city ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="body2">
                              {hq.city.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {hq.city.state.name}, {hq.city.state.country.name}
                            </Typography>
                            {hq.address && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {hq.address}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No especificada
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontWeight="bold">
                        {hq.code}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {hq._count.users} usuario{hq._count.users !== 1 ? 's' : ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {hq._count.assets} activo{hq._count.assets !== 1 ? 's' : ''}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={getStatusLabel(hq.status)}
                        color={getStatusColor(hq.status) as any}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip title="Ver detalles">
                          <IconButton
                            size="small"
                            onClick={() => onView(hq)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => onEdit(hq)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Más opciones">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, hq)}
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
        <MenuItem onClick={() => selectedHeadquarters && handleCopyCode(selectedHeadquarters.code)}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copiar código</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedHeadquarters && handleDeleteClick(selectedHeadquarters)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar sede</ListItemText>
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
            ¿Estás seguro de que deseas eliminar la sede{' '}
            <strong>{headquartersToDelete?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Se eliminarán también todos los usuarios y activos asociados a esta sede.
          </Typography>
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

export default HeadquartersList;