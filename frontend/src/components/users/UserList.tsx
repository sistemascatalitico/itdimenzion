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
  Divider,
  CircularProgress
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
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
  Person as PersonIcon,
  Warning as WarningIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import UserForm from './UserForm';
import api from '../../config/api';

// Types
interface User {
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

interface UserFormData {
  documentNumber: string;
  documentType: 'CEDULA' | 'TARJETA_IDENTIDAD' | 'CEDULA_EXTRANJERIA';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  password?: string;
  confirmPassword?: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'USER';
  companyId: number;
  headquartersId: number;
  jobTitleId: number;
}

const UserList: React.FC = () => {
  const { user: currentUser } = useAuth();
  const {
    hasPermission,
    canManageUser,
    canEditUser,
    canDeleteUser,
    getManagedRoles,
    userPermissions,
    loading: permissionsLoading,
    error: permissionsError
  } = usePermissions();

  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<number | ''>('');
  const [selectedRole, setSelectedRole] = useState<string | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<string | ''>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Estados para controlar el modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');

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

  const loadUsers = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get('/users');
      
      // Filter users based on current user's permissions
      const filteredUsers = response.data.users?.filter((user: User) => 
        canManageUser(user.role)
      ) || [];
      
      setUsers(filteredUsers);
    } catch (error: any) {
      console.error('Error loading users:', error);
      setError(
        error.response?.data?.message || 
        error.message || 
        'Error al cargar los usuarios. Verifique su conexión.'
      );
      // Fallback to empty array for now
      setUsers([]);
    }
  }, [canManageUser]);  // Simplified dependencies

  const loadCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data.companies || []);
    } catch (error: any) {
      console.error('Error loading companies:', error);
      // Fallback to empty array
      setCompanies([]);
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
    if (!canDeleteUser(user.role)) {
      setError('No tienes permisos para eliminar este usuario');
      return;
    }
    setUserToDelete(user);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      try {
        await handleDelete(userToDelete);
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleToggleStatusClick = (user: User) => {
    if (!canEditUser(user.role)) {
      setError('No tienes permisos para cambiar el estado de este usuario');
      return;
    }
    handleToggleStatus(user);
    handleMenuClose();
  };

  // Funciones para manejar el modal - optimizadas con useCallback
  const handleOpenModal = useCallback((mode: 'create' | 'edit' | 'view', user?: User) => {
    // Previene el warning de aria-hidden moviendo el foco lejos de elementos activos
    try { (document.activeElement as HTMLElement)?.blur?.(); } catch {}
    setModalMode(mode);
    setSelectedUser(user || null);
    setModalOpen(true);
  }, []);

  // Handlers estables usando data attributes para evitar re-renders
  const handleViewClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const documentNumber = event.currentTarget.getAttribute('data-document-number');
    const user = users.find(u => u.documentNumber === documentNumber);
    if (user) handleOpenModal('view', user);
  }, [users, handleOpenModal]);

  const handleEditClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const documentNumber = event.currentTarget.getAttribute('data-document-number');
    const user = users.find(u => u.documentNumber === documentNumber);
    if (user) handleOpenModal('edit', user);
  }, [users, handleOpenModal]);

  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const documentNumber = event.currentTarget.getAttribute('data-document-number');
    const user = users.find(u => u.documentNumber === documentNumber);
    if (user) handleMenuOpen(event, user);
  }, [users]);

  const handleCloseModal = useCallback((shouldReload = false) => {
    setModalOpen(false);
    setSelectedUser(null);
    // Solo recargar si se solicita explícitamente
    if (shouldReload) {
      loadUsers();
    }
  }, [loadUsers]);  // Now safe with memoized loadUsers

  // Funciones para operaciones de usuarios
  const handleDelete = async (user: User) => {
    try {
      await api.delete(`/users/${user.documentNumber}`);
      setError(null);
      await loadUsers(); // Recargar la lista
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setError(error.response?.data?.message || 'Error al eliminar el usuario');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.patch(`/users/${user.documentNumber}/status`, {
        status: newStatus
      });
      setError(null);
      await loadUsers(); // Recargar la lista
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      setError(error.response?.data?.message || 'Error al cambiar el estado del usuario');
    }
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
    // Check if current user can manage this user
    if (!canManageUser(user.role)) {
      return false;
    }

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

  // Get available roles based on current user's permissions
  const availableRoles = getManagedRoles();
  const roleOptions = [
    { value: '', label: 'Todos los roles' },
    ...availableRoles.map(role => ({
      value: role,
      label: getRoleLabel(role)
    }))
  ];

  // Memoizar initialData para prevenir re-renders infinitos
  const initialData = useMemo(() => {
    if (!selectedUser) return undefined;
    
    return {
      documentNumber: selectedUser.documentNumber,
      documentType: selectedUser.documentType,
      firstName: selectedUser.firstName,
      lastName: selectedUser.lastName,
      email: selectedUser.email,
      phone: selectedUser.phone || '',
      username: selectedUser.username,
      role: selectedUser.role === 'SUPER_ADMIN' ? 'ADMIN' : selectedUser.role,
      companyId: selectedUser.company?.id?.toString() || '',
      headquartersId: selectedUser.headquarters?.id?.toString() || '',
      jobTitleId: selectedUser.jobTitle?.id?.toString() || ''
    };
  }, [selectedUser]);

  // UserModal component
  const UserModal = () => (
    <Dialog
      open={modalOpen}
      onClose={(event, reason) => {
        if (reason === 'backdropClick') return;
        handleCloseModal(false);
      }}
      maxWidth="md"          // Tamaño del modal: xs, sm, md, lg, xl
      fullWidth              // Usa todo el ancho del maxWidth
      disableAutoFocus        // Previene auto-focus que puede causar problemas
      disableEnforceFocus     // Previene enforce focus que puede interferir
      disableEscapeKeyDown
      keepMounted
      PaperProps={{
        sx: {
          borderRadius: 2,   // Bordes redondeados
          minHeight: '60vh', // Altura mínima
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1 
      }}>
        {modalMode === 'create' && 'Nuevo Usuario'}
        {modalMode === 'edit' && 'Editar Usuario'}
        {modalMode === 'view' && 'Ver Usuario'}
        <IconButton 
          onClick={() => handleCloseModal(false)}
          size="small"
          sx={{ color: 'grey.500' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <UserForm
          initialData={initialData}
          onCancel={() => handleCloseModal(false)}
          isEditMode={modalMode === 'edit'}
        />
      </DialogContent>
    </Dialog>
  );

  // Show loading if permissions are still loading
  if (permissionsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando permisos...</Typography>
      </Box>
    );
  }

  // Show error if no permission to view users
  if (!hasPermission('users_read')) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center">
            <WarningIcon sx={{ mr: 1 }} />
            No tienes permisos para ver la lista de usuarios
          </Box>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Permissions Error */}
      {permissionsError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Error de permisos: {permissionsError}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PeopleIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Gestión de Usuarios
          </Typography>
          {currentUser && (
            <Chip 
              label={`Rol: ${getRoleLabel(currentUser.role)}`}
              size="small"
              color="primary"
              sx={{ ml: 2 }}
            />
          )}
        </Box>
        {hasPermission('users_create') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal('create')}
            sx={{ borderRadius: 2 }}
          >
            Nuevo Usuario
          </Button>
        )}
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid xs={12} md={4}>
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
            <Grid xs={12} md={2}>
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
            <Grid xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as string)}
                  label="Rol"
                >
                  {roleOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} md={2}>
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
            <Grid xs={12} md={2}>
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
                  <TableRow key={user.documentNumber}>
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
                        {hasPermission('users_read') && (
                          <Tooltip title="Ver detalles">
                            <IconButton
                              size="small"
                              onClick={handleViewClick}
                              data-document-number={user.documentNumber}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canEditUser(user.role) && (
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={handleEditClick}
                              data-document-number={user.documentNumber}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {(canEditUser(user.role) || canDeleteUser(user.role)) && (
                          <Tooltip title="Más opciones">
                            <IconButton
                              size="small"
                              onClick={handleMenuClick}
                              data-document-number={user.documentNumber}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Tooltip>
                        )}
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
        {selectedUser && canEditUser(selectedUser.role) && (
          selectedUser.status === 'ACTIVE' ? (
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
          )
        )}
        {selectedUser && canEditUser(selectedUser.role) && canDeleteUser(selectedUser.role) && (
          <Divider />
        )}
        {selectedUser && canDeleteUser(selectedUser.role) && (
          <MenuItem onClick={() => selectedUser && handleDeleteClick(selectedUser)}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Eliminar usuario</ListItemText>
          </MenuItem>
        )}
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
          
          {/* Show permission warning if trying to delete higher-level user */}
          {userToDelete && !canDeleteUser(userToDelete.role) && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Box display="flex" alignItems="center">
                <WarningIcon sx={{ mr: 1 }} />
                No tienes permisos suficientes para eliminar un usuario con rol {getRoleLabel(userToDelete.role)}
              </Box>
            </Alert>
          )}
          
          {userToDelete && canDeleteUser(userToDelete.role) && (
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
            disabled={userToDelete ? !canDeleteUser(userToDelete.role) : true}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* UserModal */}
      <UserModal />
    </Box>
  );
};

export default UserList;