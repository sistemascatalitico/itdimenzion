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
  ListItemText
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
  Web as WebIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';

// Types
interface Company {
  id: number;
  name: string;
  nit: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  status: 'ACTIVE' | 'INACTIVE';
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
  headquarters: Array<{
    id: number;
    name: string;
  }>;
  _count: {
    users: number;
    assets: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface CompanyListProps {
  onCreateNew: () => void;
  onEdit: (company: Company) => void;
  onView: (company: Company) => void;
  onDelete: (company: Company) => void;
}

const CompanyList: React.FC<CompanyListProps> = ({
  onCreateNew,
  onEdit,
  onView,
  onDelete
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const mockCompanies: Company[] = [
        {
          id: 1,
          name: 'ITDimenzion SAS',
          nit: '900123456-1',
          description: 'Empresa de tecnología y desarrollo de software',
          email: 'info@itdimenzion.com',
          phone: '+57 4 123 4567',
          address: 'Carrera 43A #1-50',
          website: 'https://itdimenzion.com',
          status: 'ACTIVE',
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
          headquarters: [
            { id: 1, name: 'Sede Principal' },
            { id: 2, name: 'Sede Norte' }
          ],
          _count: {
            users: 25,
            assets: 150
          },
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-08-06T15:45:00.000Z'
        },
        {
          id: 2,
          name: 'TechCorp Colombia',
          nit: '800987654-2',
          description: 'Consultoría en tecnología empresarial',
          email: 'contacto@techcorp.co',
          phone: '+57 1 234 5678',
          address: 'Calle 100 #10-20',
          website: 'https://techcorp.co',
          status: 'ACTIVE',
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
          headquarters: [
            { id: 3, name: 'Oficina Central' }
          ],
          _count: {
            users: 45,
            assets: 200
          },
          createdAt: '2024-03-20T08:15:00.000Z',
          updatedAt: '2024-08-05T12:30:00.000Z'
        }
      ];
      setCompanies(mockCompanies);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, company: Company) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedCompany(company);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedCompany(null);
  };

  const handleDeleteClick = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (companyToDelete) {
      try {
        await onDelete(companyToDelete);
        await loadCompanies(); // Reload the list
        setDeleteDialogOpen(false);
        setCompanyToDelete(null);
      } catch (error) {
        console.error('Error deleting company:', error);
      }
    }
  };

  const handleCopyNit = (nit: string) => {
    navigator.clipboard.writeText(nit);
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

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.nit.includes(searchTerm) ||
    (company.email && company.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Gestión de Empresas
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateNew}
          sx={{ borderRadius: 2 }}
        >
          Nueva Empresa
        </Button>
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Buscar por nombre, NIT o email..."
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
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Empresa</TableCell>
                <TableCell>NIT</TableCell>
                <TableCell>Ubicación</TableCell>
                <TableCell>Sedes</TableCell>
                <TableCell>Usuarios</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Cargando empresas...
                  </TableCell>
                </TableRow>
              ) : filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {searchTerm ? 'No se encontraron empresas' : 'No hay empresas registradas'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((company) => (
                  <TableRow key={company.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.light' }}>
                          <BusinessIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {company.name}
                          </Typography>
                          {company.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <EmailIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {company.email}
                              </Typography>
                            </Box>
                          )}
                          {company.phone && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PhoneIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {company.phone}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {company.nit}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {company.city ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="body2">
                              {company.city.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {company.city.state.name}, {company.city.state.country.name}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No especificada
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {company.headquarters.length} sede{company.headquarters.length !== 1 ? 's' : ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {company.headquarters.map(hq => hq.name).join(', ')}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {company._count.users} usuario{company._count.users !== 1 ? 's' : ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {company._count.assets} activo{company._count.assets !== 1 ? 's' : ''}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={getStatusLabel(company.status)}
                        color={getStatusColor(company.status) as any}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip title="Ver detalles">
                          <IconButton
                            size="small"
                            onClick={() => onView(company)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => onEdit(company)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Más opciones">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, company)}
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
        {selectedCompany?.website && (
          <MenuItem onClick={() => window.open(selectedCompany.website, '_blank')}>
            <ListItemIcon>
              <WebIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Visitar sitio web</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => selectedCompany && handleCopyNit(selectedCompany.nit)}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copiar NIT</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedCompany && handleDeleteClick(selectedCompany)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar empresa</ListItemText>
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
            ¿Estás seguro de que deseas eliminar la empresa{' '}
            <strong>{companyToDelete?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Se eliminarán también todas las sedes, usuarios y activos asociados.
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

export default CompanyList;