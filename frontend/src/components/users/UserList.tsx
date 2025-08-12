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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Build as WrenchIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/api';
import UserForm from './UserForm';

interface User {
  documentNumber: string;
  documentType: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  username: string | null;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  residenceCountry?: string | null;
  residenceState?: string | null;
  residenceCity?: string | null;
  commentary?: string | null;
  company?: {
    id: number;
    name: string;
    nit: string;
  } | null;
  headquarters?: {
    id: number;
    name: string;
    code: string;
  } | null;
  jobTitle?: {
    id: number;
    name: string;
    code: string;
    process?: {
      name: string;
    };
  } | null;
}

type ColumnKey =
  | 'usuario'
  | 'documento'
  | 'email'
  | 'telefono'
  | 'rol'
  | 'empresa'
  | 'estado'
  | 'sede'
  | 'cargo'
  | 'ultimoAcceso'
  | 'creado'
  | 'actualizado'
  | 'pais'
  | 'departamento'
  | 'ciudad'
  | 'direccion1'
  | 'direccion2'
  | 'comentario'
  | 'acciones';

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
}

const COLUMN_OPTIONS: ColumnConfig[] = [
  { key: 'usuario', label: 'Usuario', defaultVisible: true },
  { key: 'documento', label: 'Documento', defaultVisible: true },
  { key: 'email', label: 'Email', defaultVisible: true },
  { key: 'telefono', label: 'Teléfono', defaultVisible: true },
  { key: 'rol', label: 'Rol', defaultVisible: true },
  { key: 'empresa', label: 'Empresa', defaultVisible: true },
  { key: 'estado', label: 'Estado', defaultVisible: true },
  { key: 'sede', label: 'Sede', defaultVisible: false },
  { key: 'cargo', label: 'Cargo', defaultVisible: false },
  { key: 'ultimoAcceso', label: 'Último acceso', defaultVisible: false },
  { key: 'creado', label: 'Creado', defaultVisible: false },
  { key: 'actualizado', label: 'Actualizado', defaultVisible: false },
  { key: 'pais', label: 'País', defaultVisible: false },
  { key: 'departamento', label: 'Departamento/Estado', defaultVisible: false },
  { key: 'ciudad', label: 'Ciudad', defaultVisible: false },
  { key: 'direccion1', label: 'Dirección 1', defaultVisible: false },
  { key: 'direccion2', label: 'Dirección 2', defaultVisible: false },
  { key: 'comentario', label: 'Comentario', defaultVisible: false },
  { key: 'acciones', label: 'Acciones', defaultVisible: true },
];

const VISIBLE_COLUMNS_STORAGE_KEY = 'itd_userlist_columns';

const UserList: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [columnsVisibility, setColumnsVisibility] = useState<Record<ColumnKey, boolean>>(() => {
    try {
      const saved = localStorage.getItem(VISIBLE_COLUMNS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    const initial: Record<ColumnKey, boolean> = COLUMN_OPTIONS.reduce((acc, c) => {
      acc[c.key] = c.defaultVisible;
      return acc;
    }, {} as Record<ColumnKey, boolean>);
    return initial;
  });
  const [columnsDialogOpen, setColumnsDialogOpen] = useState(false);
  const [bulkRole, setBulkRole] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadUsers = useCallback(async (params?: { search?: string }) => {
    try {
      setLoading(true);
      const response = await api.get('/users', { params });
      const list = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.users)
          ? response.data.users
          : [];
      setUsers(list);
    } catch (error: any) {
      console.error('Error loading users:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al cargar usuarios' 
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleOpenModal = useCallback((user?: User, edit = false) => {
    setSelectedUser(user || null);
    setIsEditMode(edit);
    setModalOpen(true);
    // Blur any focused element to prevent aria-hidden warnings
    document.activeElement?.blur();
  }, []);

  const handleCloseModal = useCallback(() => {
    // Evita que quede foco en elementos dentro del diálogo al cerrar
    try { (document.activeElement as HTMLElement | null)?.blur?.(); } catch {}
    setModalOpen(false);
    setSelectedUser(null);
    setIsEditMode(false);
  }, []);

  const handleUserSaved = useCallback(() => {
    handleCloseModal();
    loadUsers();
    setMessage({ type: 'success', text: isEditMode ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente' });
  }, [handleCloseModal, loadUsers, isEditMode]);

  const handleDeleteUser = useCallback(async (userId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      loadUsers();
      setMessage({ type: 'success', text: 'Usuario eliminado exitosamente' });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al eliminar usuario' 
      });
    }
  }, [loadUsers]);

  const allSelectedOnPage = useMemo(() => {
    if (users.length === 0) return false;
    return users.every(u => selectedIds.has(u.documentNumber));
  }, [users, selectedIds]);

  const someSelectedOnPage = useMemo(() => {
    return users.some(u => selectedIds.has(u.documentNumber)) && !allSelectedOnPage;
  }, [users, selectedIds, allSelectedOnPage]);

  const toggleSelectAllOnPage = () => {
    const next = new Set(selectedIds);
    if (allSelectedOnPage) {
      users.forEach(u => next.delete(u.documentNumber));
    } else {
      users.forEach(u => next.add(u.documentNumber));
    }
    setSelectedIds(next);
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleToggleColumn = (key: ColumnKey) => {
    const next = { ...columnsVisibility, [key]: !columnsVisibility[key] };
    setColumnsVisibility(next);
    try { localStorage.setItem(VISIBLE_COLUMNS_STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const visible = (key: ColumnKey) => columnsVisibility[key];

  const openColumnsDialog = () => {
    try { (document.activeElement as HTMLElement | null)?.blur?.(); } catch {}
    setColumnsDialogOpen(true);
  };

  const runBulk = async (action: 'activate' | 'deactivate' | 'delete' | 'role') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setMessage(null);
    try {
      const promises: Promise<any>[] = [];
      if (action === 'delete') {
        ids.forEach(id => {
          if (id !== currentUser?.documentNumber) {
            promises.push(api.delete(`/users/${id}`));
          }
        });
      } else if (action === 'activate' || action === 'deactivate') {
        const desired = action === 'activate' ? 'ACTIVE' : 'INACTIVE';
        ids.forEach(id => {
          const u = users.find(x => x.documentNumber === id);
          if (u && u.status !== desired) {
            // backend solo expone PATCH que alterna; solo llamamos si hay que cambiar
            promises.push(api.patch(`/users/${id}/status`));
          }
        });
      } else if (action === 'role') {
        if (!bulkRole) return;
        ids.forEach(id => promises.push(api.put(`/users/${id}`, { role: bulkRole })));
      }
      const results = await Promise.allSettled(promises);
      const failed = results.filter(r => r.status === 'rejected').length;
      await loadUsers();
      setSelectedIds(new Set());
      if (failed === 0) {
        setMessage({ type: 'success', text: 'Acción masiva aplicada correctamente' });
      } else {
        setMessage({ type: 'error', text: `Acción aplicada con ${failed} errores` });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error en acción masiva' });
    }
  };

  const handleSearch = () => {
    loadUsers({ search: searchTerm.trim() || undefined });
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
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE' ? 'success' : 'error';
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 0,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
      }}
    >
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          mx: 0,
          ml: 0,
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)',
            p: { xs: 2, md: 3 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'white',
          }}
        >
    <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Gestión de Usuarios
          </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Administra los usuarios del sistema
            </Typography>
        </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            Nuevo Usuario
          </Button>
      </Box>

        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {message && (
            <Alert 
              severity={message.type} 
              sx={{ mb: 3 }}
              onClose={() => setMessage(null)}
            >
              {message.text}
            </Alert>
          )}

          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: '#333', fontWeight: 600 }}>
              Lista de Usuarios ({users.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {selectedIds.size > 0 && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mr: 1 }}>
                  <Button size="small" variant="contained" color="success" onClick={() => runBulk('activate')}>Activar</Button>
                  <Button size="small" variant="outlined" color="warning" onClick={() => runBulk('deactivate')}>Desactivar</Button>
                  <MuiSelect
                    size="small"
                    value={bulkRole}
                    onChange={(e) => setBulkRole(e.target.value)}
                    displayEmpty
                    sx={{ minWidth: 160, backgroundColor: '#fff' }}
                    MenuProps={{ disablePortal: true }}
                  >
                    <MuiMenuItem value=""><em>Cambiar rol…</em></MuiMenuItem>
                    <MuiMenuItem value="SUPER_ADMIN">Super Admin</MuiMenuItem>
                    <MuiMenuItem value="ADMIN">Admin</MuiMenuItem>
                    <MuiMenuItem value="SUPERVISOR">Supervisor</MuiMenuItem>
                    <MuiMenuItem value="USER">User</MuiMenuItem>
                  </MuiSelect>
                  <Button size="small" variant="outlined" startIcon={<DoneAllIcon />} onClick={() => runBulk('role')}>Aplicar</Button>
                  <Button size="small" color="error" variant="outlined" onClick={() => runBulk('delete')}>Eliminar</Button>
                </Box>
              )}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mr: 1 }}>
                <TextField
                  size="small"
                  placeholder="Buscar usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  sx={{ backgroundColor: '#fff', borderRadius: 1, minWidth: 220 }}
                />
                <Button size="small" variant="outlined" onClick={handleSearch}>Buscar</Button>
              </Box>
              <Tooltip title="Columnas visibles">
                <IconButton onClick={openColumnsDialog} sx={{ color: '#FF6B6B' }}>
                  <WrenchIcon />
                </IconButton>
              </Tooltip>
              <Button
                startIcon={<RefreshIcon />}
                onClick={loadUsers}
                variant="outlined"
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

          <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto', overflowY: 'hidden' }}>
          <Table>
            <TableHead>
                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={someSelectedOnPage}
                      checked={allSelectedOnPage}
                      onChange={toggleSelectAllOnPage}
                    />
                  </TableCell>
                  {visible('usuario') && <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>}
                  {visible('documento') && <TableCell sx={{ fontWeight: 600 }}>Documento</TableCell>}
                  {visible('email') && <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>}
                  {visible('telefono') && <TableCell sx={{ fontWeight: 600 }}>Teléfono</TableCell>}
                  {visible('rol') && <TableCell sx={{ fontWeight: 600 }}>Rol</TableCell>}
                  {visible('empresa') && <TableCell sx={{ fontWeight: 600 }}>Empresa</TableCell>}
                  {visible('sede') && <TableCell sx={{ fontWeight: 600 }}>Sede</TableCell>}
                  {visible('cargo') && <TableCell sx={{ fontWeight: 600 }}>Cargo</TableCell>}
                  {visible('pais') && <TableCell sx={{ fontWeight: 600 }}>País</TableCell>}
                  {visible('departamento') && <TableCell sx={{ fontWeight: 600 }}>Departamento/Estado</TableCell>}
                  {visible('ciudad') && <TableCell sx={{ fontWeight: 600 }}>Ciudad</TableCell>}
                  {visible('direccion1') && <TableCell sx={{ fontWeight: 600 }}>Dirección 1</TableCell>}
                  {visible('direccion2') && <TableCell sx={{ fontWeight: 600 }}>Dirección 2</TableCell>}
                  {visible('comentario') && <TableCell sx={{ fontWeight: 600 }}>Comentario</TableCell>}
                  {visible('estado') && <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>}
                  {visible('ultimoAcceso') && <TableCell sx={{ fontWeight: 600 }}>Último acceso</TableCell>}
                  {visible('creado') && <TableCell sx={{ fontWeight: 600 }}>Creado</TableCell>}
                  {visible('actualizado') && <TableCell sx={{ fontWeight: 600 }}>Actualizado</TableCell>}
                  {visible('acciones') && <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
                {users.map((user) => (
                  <TableRow key={user.documentNumber} sx={{ '&:hover': { backgroundColor: '#f8f9fa' } }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.has(user.documentNumber)}
                        onChange={() => toggleSelectOne(user.documentNumber)}
                      />
                    </TableCell>
                    {visible('usuario') && (
                      <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            backgroundColor: '#FF6B6B',
                            fontSize: '1rem',
                          }}
                        >
                          {user.firstName?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            @{user.username || user.email}
                          </Typography>
                        </Box>
                      </Box>
                      </TableCell>
                    )}
                    {visible('documento') && (
                      <TableCell>
                      <Typography variant="body2">
                        {user.documentType}: {user.documentNumber}
                          </Typography>
                      </TableCell>
                    )}
                    {visible('email') && (
                      <TableCell>
                      <Typography variant="body2">{user.email}</Typography>
                      </TableCell>
                    )}
                    {visible('telefono') && (
                      <TableCell>
                      <Typography variant="body2">{user.phone || '-'}</Typography>
                      </TableCell>
                    )}
                    {visible('rol') && (
                      <TableCell>
                      <Chip
                        label={user.role}
                        color={getRoleColor(user.role) as any}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                      </TableCell>
                    )}
                    {visible('empresa') && (
                      <TableCell>
                      <Typography variant="body2">
                        {user.company?.name || '-'}
                      </Typography>
                      </TableCell>
                    )}
                    {visible('sede') && (
                      <TableCell>
                        <Typography variant="body2">{user.headquarters?.name || '-'}</Typography>
                      </TableCell>
                    )}
                    {visible('cargo') && (
                      <TableCell>
                        <Typography variant="body2">{user.jobTitle?.name || '-'}</Typography>
                      </TableCell>
                    )}
                    {visible('pais') && (
                      <TableCell>
                        <Typography variant="body2">{user.residenceCountry || '-'}</Typography>
                      </TableCell>
                    )}
                    {visible('departamento') && (
                      <TableCell>
                        <Typography variant="body2">{user.residenceState || '-'}</Typography>
                      </TableCell>
                    )}
                    {visible('ciudad') && (
                      <TableCell>
                        <Typography variant="body2">{user.residenceCity || '-'}</Typography>
                      </TableCell>
                    )}
                    {visible('direccion1') && (
                      <TableCell>
                        <Typography variant="body2">{user.addressLine1 || '-'}</Typography>
                      </TableCell>
                    )}
                    {visible('direccion2') && (
                      <TableCell>
                        <Typography variant="body2">{user.addressLine2 || '-'}</Typography>
                      </TableCell>
                    )}
                    {visible('comentario') && (
                      <TableCell>
                        <Typography variant="body2">{user.commentary || '-'}</Typography>
                      </TableCell>
                    )}
                    {visible('estado') && (
                      <TableCell>
                      <Chip
                        label={user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                        color={getStatusColor(user.status) as any}
                        size="small"
                      />
                      </TableCell>
                    )}
                    {visible('ultimoAcceso') && (
                      <TableCell>
                        <Typography variant="body2">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '-'}</Typography>
                      </TableCell>
                    )}
                    {visible('creado') && (
                      <TableCell>
                        <Typography variant="body2">{new Date(user.createdAt).toLocaleDateString()}</Typography>
                      </TableCell>
                    )}
                    {visible('actualizado') && (
                      <TableCell>
                        <Typography variant="body2">{new Date(user.updatedAt).toLocaleDateString()}</Typography>
                      </TableCell>
                    )}
                    {visible('acciones') && (
                      <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Ver detalles">
                            <IconButton
                              size="small"
                            onClick={() => handleOpenModal(user, false)}
                            sx={{ color: '#2196F3' }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                            onClick={() => handleOpenModal(user, true)}
                            sx={{ color: '#FF9800' }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        {currentUser?.role === 'SUPER_ADMIN' && user.documentNumber !== currentUser.documentNumber && (
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteUser(user.documentNumber)}
                              sx={{ color: '#F44336' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

          {users.length === 0 && !loading && (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                color: 'text.secondary',
              }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>
                No hay usuarios registrados
              </Typography>
              <Typography variant="body2">
                Comienza creando el primer usuario del sistema
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de selección de columnas */}
      <MuiDialog
        open={columnsDialogOpen}
        onClose={() => setColumnsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        disableAutoFocus
        disableEnforceFocus
        disableEscapeKeyDown
        disableRestoreFocus
        keepMounted
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <MuiDialogTitle>Columnas visibles</MuiDialogTitle>
        <MuiDialogContent dividers>
          <FormGroup>
            {COLUMN_OPTIONS.map(col => (
              <FormControlLabel
                key={col.key}
                control={<Checkbox checked={columnsVisibility[col.key]} onChange={() => handleToggleColumn(col.key)} />}
                label={col.label}
              />)
            )}
          </FormGroup>
        </MuiDialogContent>
        <MuiDialogActions>
          <Button onClick={() => {
            // Restaurar predeterminadas
            const defaults = COLUMN_OPTIONS.reduce((acc, c) => {
              acc[c.key] = c.defaultVisible; return acc;
            }, {} as Record<ColumnKey, boolean>);
            setColumnsVisibility(defaults);
            try { localStorage.setItem(VISIBLE_COLUMNS_STORAGE_KEY, JSON.stringify(defaults)); } catch {}
            setColumnsDialogOpen(false);
          }}>Restablecer</Button>
          <Button variant="contained" onClick={() => setColumnsDialogOpen(false)}>Cerrar</Button>
        </MuiDialogActions>
      </MuiDialog>

      {/* Modal para crear/editar usuario */}
      <Dialog
        open={modalOpen}
        onClose={(event, reason) => {
          // Evita aria-hidden warnings manteniendo controlado el foco
          if (reason === 'backdropClick') return;
          handleCloseModal();
        }}
        maxWidth="md"
        fullWidth
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
        disableEscapeKeyDown
        keepMounted
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)',
            color: 'white',
            fontWeight: 600,
          }}
        >
          {isEditMode ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <UserForm
            initialData={selectedUser}
            onCancel={handleCloseModal}
            onSave={handleUserSaved}
            isEditMode={isEditMode}
          />
        </DialogContent>
      </Dialog>

      {/* FAB para crear usuario */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => handleOpenModal()}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #FF5A5A 0%, #FF7D5A 100%)',
          },
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default UserList;
