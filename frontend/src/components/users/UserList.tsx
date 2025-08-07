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
  People as PeopleIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon,
  Badge as BadgeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  FilterList as FilterIcon,
  Person as PersonIcon
} from '@mui/icons-material';

// Types
interface User {
  id: number;
  documentNumber: string;
  documentType: 'CEDULA' | 'TARJETA_IDENTIDAD' | 'CEDULA_EXTRANJERIA';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  username: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'USER';
  status: 'ACTIVE' | 'INACTIVE';
  company?: {
    id: number;
    name: string;
    nit: string;
  };
  headquarters?: {
    id: number;
    name: string;
    code: string;
  };
  jobTitle?: {
    id: number;
    name: string;
    code: string;
    process: {
      name: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

interface Company {
  id: number;
  name: string;
  nit: string;
}

interface UserListProps {
  onCreateNew: () => void;
  onEdit: (user: User) => void;
  onView: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleStatus: (user: User) => void;
}

const UserList: React.FC<UserListProps> = ({
  onCreateNew,
  onEdit,
  onView,
  onDelete,
  onToggleStatus
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<number | ''>('');
  const [selectedRole, setSelectedRole] = useState<string | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<string | ''>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadUsers(), loadCompanies()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // TODO: Replace with actual API call
      const mockUsers: User[] = [
        {
          id: 1,
          documentNumber: '1234567890',
          documentType: 'CEDULA',
          firstName: 'Juan Carlos',
          lastName: 'García López',
          email: 'juan.garcia@itdimenzion.com',
          phone: '+57 300 123 4567',
          username: 'juan.garcia',
          role: 'ADMIN',
          status: 'ACTIVE',
          company: {
            id: 1,
            name: 'ITDimenzion SAS',
            nit: '900123456-1'
          },
          headquarters: {
            id: 1,
            name: 'Sede Principal Bogotá',
            code: 'BOG-001'
          },
          jobTitle: {
            id: 2,
            name: 'Gerente de Recursos Humanos',
            code: 'RH-GER01',
            process: {
              name: 'Recursos Humanos'
            }
          },
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-08-06T15:45:00.000Z',
          lastLogin: '2024-08-06T14:30:00.000Z'
        },
        {
          id: 2,
          documentNumber: '9876543210',
          documentType: 'CEDULA',
          firstName: 'María Fernanda',
          lastName: 'Rodríguez Silva',
          email: 'maria.rodriguez@itdimenzion.com',
          phone: '+57 301 987 6543',
          username: 'maria.rodriguez',
          role: 'USER',
          status: 'ACTIVE',
          company: {
            id: 1,
            name: 'ITDimenzion SAS',
            nit: '900123456-1'
          },
          headquarters: {
            id: 1,
            name: 'Sede Principal Bogotá',
            code: 'BOG-001'
          },
          jobTitle: {
            id: 1,
            name: 'Desarrollador Senior',
            code: 'TEC-DEV01',
            process: {
              name: 'Tecnología'
            }
          },
          createdAt: '2024-02-10T09:15:00.000Z',
          updatedAt: '2024-08-05T11:20:00.000Z',
          lastLogin: '2024-08-05T16:45:00.000Z'
        },
        {
          id: 3,
          documentNumber: '5555666677',
          documentType: 'CEDULA',
          firstName: 'Carlos Eduardo',
          lastName: 'Martínez Torres',
          email: 'carlos.martinez@techcorp.com',
          phone: '+57 302 555 7777',
          username: 'carlos.martinez',
          role: 'SUPERVISOR',
          status: 'ACTIVE',
          company: {
            id: 2,
            name: 'TechCorp Colombia',
            nit: '800987654-2'
          },
          headquarters: {
            id: 3,
            name: 'Oficina Central',
            code: 'CEN-001'
          },
          jobTitle: {
            id: 3,
            name: 'Analista Financiero',
            code: 'FIN-ANA01',
            process: {
              name: 'Finanzas'
            }
          },
          createdAt: '2024-03-05T14:45:00.000Z',
          updatedAt: '2024-08-04T10:30:00.000Z',
          lastLogin: '2024-08-04T13:15:00.000Z'
        },
        {
          id: 4,
          documentNumber: '1111222233',
          documentType: 'CEDULA_EXTRANJERIA',
          firstName: 'Ana Lucía',
          lastName: 'Pérez Morales',
          email: 'ana.perez@innovatech.com',
          username: 'ana.perez',
          role: 'USER',
          status: 'INACTIVE',
          company: {
            id: 3,
            name: 'InnovaTech SA',
            nit: '700555444-3'
          },
          headquarters: {
            id: 4,
            name: 'Centro de Innovación',
            code: 'INN-001'
          },
          jobTitle: {
            id: 5,
            name: 'Especialista en Marketing Digital',
            code: 'VYM-ESP01',
            process: {
              name: 'Ventas y Marketing'
            }
          },
          createdAt: '2024-04-12T08:30:00.000Z',
          updatedAt: '2024-07-20T16:45:00.000Z',
          lastLogin: '2024-07-15T09:30:00.000Z'
        },
        {
          id: 5,
          documentNumber: '8888999900',
          documentType: 'CEDULA',
          firstName: 'Luis Alberto',
          lastName: 'González Herrera',
          email: 'luis.gonzalez@itdimenzion.com',
          phone: '+57 304 888 9999',
          username: 'luis.gonzalez',
          role: 'USER',
          status: 'ACTIVE',
          company: {
            id: 1,
            name: 'ITDimenzion SAS',
            nit: '900123456-1'
          },
          headquarters: {
            id: 2,
            name: 'Sede Medellín',
            code: 'MED-001'
          },
          jobTitle: {
            id: 1,
            name: 'Desarrollador Senior',
            code: 'TEC-DEV01',
            process: {
              name: 'Tecnología'
            }
          },
          createdAt: '2024-05-08T12:00:00.000Z',
          updatedAt: '2024-08-03T14:20:00.000Z',
          lastLogin: '2024-08-03T17:30:00.000Z'
        }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error loading users:', error);
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedUser(null);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      try {
        await onDelete(userToDelete);
        await loadUsers(); // Reload the list
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleToggleStatusClick = (user: User) => {
    onToggleStatus(user);
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'error';
      case 'ADMIN':
        return 'warning';
      case 'SUPERVISOR':
        return 'info';
      case 'USER':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'ADMIN':
        return 'Administrador';
      case 'SUPERVISOR':
        return 'Supervisor';
      case 'USER':
        return 'Usuario';
      default:
        return role;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'CEDULA':
        return 'CC';
      case 'TARJETA_IDENTIDAD':
        return 'TI';
      case 'CEDULA_EXTRANJERIA':
        return 'CE';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.documentNumber.includes(searchTerm) ||
      (user.company?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.jobTitle?.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCompany = selectedCompany === '' || user.company?.id === selectedCompany;
    const matchesRole = selectedRole === '' || user.role === selectedRole;
    const matchesStatus = selectedStatus === '' || user.status === selectedStatus;
    
    return matchesSearch && matchesCompany && matchesRole && matchesStatus;
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PeopleIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Gestión de Usuarios
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateNew}
          sx={{ borderRadius: 2 }}
        >
          Nuevo Usuario
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar por nombre, email, documento o empresa..."
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
            <Grid item xs={12} md={2}>
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
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as string)}
                  label="Rol"
                >
                  <MenuItem value="">Todos los roles</MenuItem>
                  <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                  <MenuItem value="ADMIN">Administrador</MenuItem>
                  <MenuItem value="SUPERVISOR">Supervisor</MenuItem>
                  <MenuItem value="USER">Usuario</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as string)}
                  label="Estado"
                >
                  <MenuItem value="">Todos los estados</MenuItem>
                  <MenuItem value="ACTIVE">Activo</MenuItem>
                  <MenuItem value="INACTIVE">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary" align="center">
                {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Usuario</TableCell>
                <TableCell>Documento</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Empresa/Cargo</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Último Acceso</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {searchTerm || selectedCompany || selectedRole || selectedStatus ? 
                      'No se encontraron usuarios' : 'No hay usuarios registrados'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ 
                          mr: 2, 
                          bgcolor: 'primary.light',
                          color: 'primary.contrastText'
                        }}>
                          {getInitials(user.firstName, user.lastName)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            @{user.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <BadgeIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {getDocumentTypeLabel(user.documentType)} {user.documentNumber}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {user.email}
                          </Typography>
                        </Box>
                        {user.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PhoneIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {user.phone}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box>
                        {user.company && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <BusinessIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2" fontWeight="medium">
                              {user.company.name}
                            </Typography>
                          </Box>
                        )}
                        {user.jobTitle && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <WorkIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                {user.jobTitle.name}
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                {user.jobTitle.process.name}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                        {user.headquarters && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Sede: {user.headquarters.name}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={getRoleLabel(user.role)}
                        color={getRoleColor(user.role) as any}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={getStatusLabel(user.status)}
                        color={getStatusColor(user.status) as any}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {formatDateTime(user.lastLogin)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Creado: {formatDate(user.createdAt)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip title="Ver detalles">
                          <IconButton
                            size="small"
                            onClick={() => onView(user)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => onEdit(user)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Más opciones">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, user)}
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
        {selectedUser?.status === 'ACTIVE' ? (
          <MenuItem onClick={() => selectedUser && handleToggleStatusClick(selectedUser)}>
            <ListItemIcon>
              <BlockIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText>Desactivar usuario</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => selectedUser && handleToggleStatusClick(selectedUser)}>
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Activar usuario</ListItemText>
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => selectedUser && handleDeleteClick(selectedUser)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar usuario</ListItemText>
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
          <Alert severity="error" sx={{ mb: 2 }}>
            Esta acción no se puede deshacer
          </Alert>
          <Typography>
            ¿Estás seguro de que deseas eliminar el usuario{' '}
            <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Se eliminará permanentemente toda la información asociada al usuario.
          </Typography>
          {userToDelete && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Usuario: {userToDelete.firstName} {userToDelete.lastName}<br/>
              Documento: {getDocumentTypeLabel(userToDelete.documentType)} {userToDelete.documentNumber}<br/>
              Email: {userToDelete.email}
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

export default UserList;