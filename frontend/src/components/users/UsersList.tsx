import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Grid,
  Fab,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
  PersonAdd as PersonAddIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as ActivateIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

// Types
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SUPERVISOR' | 'USER';
  status: 'ACTIVE' | 'INACTIVE';
  documentType: string;
  documentNumber: string;
  phone?: string;
  company?: {
    id: number;
    name: string;
  };
  headquarters?: {
    id: number;
    name: string;
  };
  createdAt: string;
  lastLogin?: string;
}

interface UserFilters {
  role: string;
  status: string;
  company: string;
  search: string;
}

const UsersList: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<UserFilters>({
    role: '',
    status: '',
    company: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Role color mapping
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'error';
      case 'ADMIN':
        return 'warning';
      case 'SUPERVISOR':
        return 'info';
      case 'USER':
        return 'default';
      default:
        return 'default';
    }
  };

  // Status color mapping
  const getStatusColor = (status: string) => {
    return status === 'ACTIVE' ? 'success' : 'default';
  };

  // Generate user initials
  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        setError('Error al cargar usuarios');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = !filters.search || 
      user.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.lastName.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.documentNumber.includes(filters.search);
    
    const matchesRole = !filters.role || user.role === filters.role;
    const matchesStatus = !filters.status || user.status === filters.status;
    const matchesCompany = !filters.company || user.company?.id.toString() === filters.company;

    return matchesSearch && matchesRole && matchesStatus && matchesCompany;
  });

  // Handle filter changes
  const handleFilterChange = (field: keyof UserFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      role: '',
      status: '',
      company: '',
      search: '',
    });
  };

  // Action menu handlers
  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedUser(user);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedUser(null);
  };

  // CRUD Operations
  const handleViewUser = (user: User) => {
    // TODO: Navigate to user details page
    console.log('View user:', user);
    handleActionMenuClose();
  };

  const handleEditUser = (user: User) => {
    // TODO: Navigate to edit user page
    console.log('Edit user:', user);
    handleActionMenuClose();
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
    handleActionMenuClose();
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        await loadUsers(); // Reload users list
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      } else {
        setError('Error al eliminar usuario');
      }
    } catch (error) {
      setError('Error de conexión');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    try {
      const response = await fetch(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await loadUsers(); // Reload users list
      } else {
        setError('Error al cambiar estado del usuario');
      }
    } catch (error) {
      setError('Error de conexión');
    }
    handleActionMenuClose();
  };

  const handleCreateUser = () => {
    // TODO: Navigate to create user page
    console.log('Create new user');
  };

  // Permission checks
  const canEditUser = (user: User) => {
    if (!currentUser) return false;
    
    // Super admin can edit anyone except other super admins
    if (currentUser.role === 'SUPER_ADMIN') {
      return user.role !== 'SUPER_ADMIN' || user.id === currentUser.id;
    }
    
    // Admin can edit supervisors and users
    if (currentUser.role === 'ADMIN') {
      return ['SUPERVISOR', 'USER'].includes(user.role);
    }
    
    // Supervisor can edit users
    if (currentUser.role === 'SUPERVISOR') {
      return user.role === 'USER';
    }
    
    // Users can only edit themselves
    return user.id === currentUser.id;
  };

  const canDeleteUser = (user: User) => {
    if (!currentUser) return false;
    
    // Can't delete yourself
    if (user.id === currentUser.id) return false;
    
    // Super admin can delete anyone except other super admins
    if (currentUser.role === 'SUPER_ADMIN') {
      return user.role !== 'SUPER_ADMIN';
    }
    
    // Admin can delete supervisors and users  
    if (currentUser.role === 'ADMIN') {
      return ['SUPERVISOR', 'USER'].includes(user.role);
    }
    
    // Supervisor can delete users
    if (currentUser.role === 'SUPERVISOR') {
      return user.role === 'USER';
    }
    
    return false;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando usuarios...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Gestión de Usuarios
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={handleCreateUser}
          sx={{ borderRadius: 2 }}
        >
          Nuevo Usuario
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {/* Search */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar usuarios..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>

            {/* Filter Toggle */}
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
                size="small"
              >
                Filtros
              </Button>
            </Grid>

            {/* Clear Filters */}
            <Grid item xs={12} md={2}>
              <Button
                variant="text"
                onClick={clearFilters}
                size="small"
              >
                Limpiar
              </Button>
            </Grid>

            {/* Results Count */}
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary" textAlign="right">
                Mostrando {filteredUsers.length} de {users.length} usuarios
              </Typography>
            </Grid>
          </Grid>

          {/* Extended Filters */}
          {showFilters && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Rol</InputLabel>
                  <Select
                    value={filters.role}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                    input={<OutlinedInput label="Rol" />}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                    <MenuItem value="ADMIN">Administrador</MenuItem>
                    <MenuItem value="SUPERVISOR">Supervisor</MenuItem>
                    <MenuItem value="USER">Usuario</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    input={<OutlinedInput label="Estado" />}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="ACTIVE">Activo</MenuItem>
                    <MenuItem value="INACTIVE">Inactivo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Usuario</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Documento</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Empresa</TableCell>
                <TableCell>Último Acceso</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar
                        sx={{
                          mr: 2,
                          bgcolor: 'primary.main',
                          width: 36,
                          height: 36,
                        }}
                      >
                        {getUserInitials(user.firstName, user.lastName)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {user.firstName} {user.lastName}
                        </Typography>
                        {user.username && (
                          <Typography variant="caption" color="text.secondary">
                            @{user.username}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.documentType}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.documentNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role.replace('_', ' ')}
                      color={getRoleColor(user.role) as any}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      color={getStatusColor(user.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.company?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {user.lastLogin 
                      ? new Date(user.lastLogin).toLocaleDateString('es-ES')
                      : 'Nunca'
                    }
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleActionMenuOpen(e, user)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron usuarios
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="add user"
        onClick={handleCreateUser}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' },
        }}
      >
        <AddIcon />
      </Fab>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={() => selectedUser && handleViewUser(selectedUser)}>
          <ViewIcon sx={{ mr: 1 }} />
          Ver Detalles
        </MenuItem>
        
        {selectedUser && canEditUser(selectedUser) && (
          <MenuItem onClick={() => handleEditUser(selectedUser)}>
            <EditIcon sx={{ mr: 1 }} />
            Editar
          </MenuItem>
        )}
        
        {selectedUser && canEditUser(selectedUser) && (
          <MenuItem onClick={() => handleToggleStatus(selectedUser)}>
            {selectedUser.status === 'ACTIVE' ? (
              <>
                <BlockIcon sx={{ mr: 1 }} />
                Desactivar
              </>
            ) : (
              <>
                <ActivateIcon sx={{ mr: 1 }} />
                Activar
              </>
            )}
          </MenuItem>
        )}
        
        {selectedUser && canDeleteUser(selectedUser) && (
          <MenuItem 
            onClick={() => handleDeleteUser(selectedUser)}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} />
            Eliminar
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          {userToDelete && (
            <Typography>
              ¿Está seguro que desea eliminar al usuario{' '}
              <strong>{userToDelete.firstName} {userToDelete.lastName}</strong>?
              Esta acción no se puede deshacer.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersList;