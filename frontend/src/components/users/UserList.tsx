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
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  Dashboard as DashboardIcon,
  List as ListIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/api';
import UserForm from './UserForm';
import UserDashboard from './UserDashboard';

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
  isDeletionProtected?: boolean;
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
  order: number;
}

const COLUMN_OPTIONS: ColumnConfig[] = [
  { key: 'usuario', label: 'Usuario', defaultVisible: true, order: 1 },
  { key: 'documento', label: 'Documento', defaultVisible: true, order: 2 },
  { key: 'email', label: 'Email', defaultVisible: true, order: 3 },
  { key: 'telefono', label: 'Teléfono', defaultVisible: true, order: 4 },
  { key: 'rol', label: 'Rol', defaultVisible: true, order: 5 },
  { key: 'empresa', label: 'Empresa', defaultVisible: true, order: 6 },
  { key: 'estado', label: 'Estado', defaultVisible: true, order: 7 },
  { key: 'sede', label: 'Sede', defaultVisible: false, order: 8 },
  { key: 'cargo', label: 'Cargo', defaultVisible: false, order: 9 },
  { key: 'ultimoAcceso', label: 'Último acceso', defaultVisible: false, order: 10 },
  { key: 'creado', label: 'Creado', defaultVisible: false, order: 11 },
  { key: 'actualizado', label: 'Actualizado', defaultVisible: false, order: 12 },
  { key: 'pais', label: 'País', defaultVisible: false, order: 13 },
  { key: 'departamento', label: 'Departamento/Estado', defaultVisible: false, order: 14 },
  { key: 'ciudad', label: 'Ciudad', defaultVisible: false, order: 15 },
  { key: 'direccion1', label: 'Dirección 1', defaultVisible: false, order: 16 },
  { key: 'direccion2', label: 'Dirección 2', defaultVisible: false, order: 17 },
  { key: 'comentario', label: 'Comentario', defaultVisible: false, order: 18 },
  { key: 'acciones', label: 'Acciones', defaultVisible: true, order: 19 },
];

const COLUMNS_CONFIG_STORAGE_KEY = 'itd_userlist_columns_config';

const UserList: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [columnsConfig, setColumnsConfig] = useState<ColumnConfig[]>(COLUMN_OPTIONS);
  const [columnsDialogOpen, setColumnsDialogOpen] = useState(false);
  const [bulkRole, setBulkRole] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeletedUsers, setShowDeletedUsers] = useState(false);
  const [filterCompany, setFilterCompany] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCity, setFilterCity] = useState<string>('');
  const [filterHeadquarters, setFilterHeadquarters] = useState<string>('');
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [bulkEditData, setBulkEditData] = useState({
    company: '',
    headquarters: '',
    jobTitle: '',
    residenceCountry: '',
    residenceState: '',
    residenceCity: '',
    commentary: '',
    role: ''
  });
  const [activeTab, setActiveTab] = useState<'list' | 'dashboard'>('list');

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

  useEffect(() => {
    try { 
      localStorage.setItem(COLUMNS_CONFIG_STORAGE_KEY, JSON.stringify(columnsConfig)); 
    } catch (e) {
      console.warn('Could not save column configuration:', e);
    }
  }, [columnsConfig]);



  const handleOpenModal = useCallback((user?: User, edit = false) => {
    setSelectedUser(user || null);
    setIsEditMode(edit);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
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
    const target = users.find(u => u.documentNumber === userId);
    
    // Check if user is deletion protected
    if (target?.isDeletionProtected) {
      setMessage({ type: 'error', text: 'Este usuario está protegido contra eliminación' });
      return;
    }
    
    // Prevent deleting SUPER_ADMIN users
    if (target?.role === 'SUPER_ADMIN') {
      setMessage({ type: 'error', text: 'No se permite eliminar usuarios SUPER_ADMIN' });
      return;
    }
    
    if (!window.confirm('¿Estás seguro de que deseas desactivar este usuario?')) {
      return;
    }

    try {
      // Use soft delete endpoint (DELETE still works but now does soft delete)
      await api.delete(`/users/${userId}`);
      loadUsers();
      setMessage({ type: 'success', text: 'Usuario desactivado exitosamente' });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al desactivar usuario' 
      });
    }
  }, [loadUsers, users]);

  const allSelectedOnPage = useMemo(() => {
    if (users.length === 0) return false;
    return users.every(u => selectedIds.has(u.documentNumber));
  }, [users, selectedIds]);

  const someSelectedOnPage = useMemo(() => {
    return users.some(u => selectedIds.has(u.documentNumber)) && !allSelectedOnPage;
  }, [users, selectedIds, allSelectedOnPage]);

  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (allSelectedOnPage) {
        // Deseleccionar todos los usuarios de la página actual
        users.forEach(u => newSelected.delete(u.documentNumber));
      } else {
        // Seleccionar todos los usuarios de la página actual
        users.forEach(u => newSelected.add(u.documentNumber));
      }
      return newSelected;
    });
  }, [allSelectedOnPage, users]);

  const toggleSelectOne = useCallback((id: string) => {
    console.log('CHECKBOX CLICKED:', id);
    setSelectedIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(id)) {
        newSelected.delete(id);
        console.log('REMOVED:', id);
      } else {
        newSelected.add(id);
        console.log('ADDED:', id);
      }
      console.log('TOTAL SELECTED:', newSelected.size);
      return newSelected;
    });
  }, []);

  const handleToggleColumn = useCallback((key: ColumnKey) => {
    setColumnsConfig(prev => 
      prev.map(col => 
        col.key === key ? { ...col, defaultVisible: !col.defaultVisible } : col
      )
    );
  }, []);

  const handleMoveColumn = useCallback((fromIndex: number, toIndex: number) => {
    setColumnsConfig(prev => {
      const newConfig = [...prev];
      const [movedItem] = newConfig.splice(fromIndex, 1);
      newConfig.splice(toIndex, 0, movedItem);
      
      // Actualizar el orden
      newConfig.forEach((col, index) => {
        col.order = index + 1;
      });
      
      return newConfig;
    });
  }, []);

  const getVisibleColumns = useMemo(() => {
    return columnsConfig
      .filter(col => col.defaultVisible)
      .sort((a, b) => a.order - b.order);
  }, [columnsConfig]);



  const openColumnsDialog = useCallback(() => {
    setColumnsDialogOpen(true);
  }, []);

  const resetColumns = useCallback(() => {
    setColumnsConfig(COLUMN_OPTIONS);
  }, []);

  const closeColumnsDialog = useCallback(() => {
    setColumnsDialogOpen(false);
  }, []);

  const runBulk = async (action: 'activate' | 'deactivate' | 'delete' | 'role') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setMessage(null);
    try {
      const promises: Promise<any>[] = [];
      if (action === 'delete') {
        ids.forEach(id => {
          const u = users.find(x => x.documentNumber === id);
          // Skip deleting SUPER_ADMIN and self
          if (u?.role === 'SUPER_ADMIN') return;
          if (id === currentUser?.documentNumber) return;
          promises.push(api.delete(`/users/${id}`));
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
    const params: any = { search: searchTerm.trim() || undefined };
    if (showDeletedUsers) params.deleted = true;
    if (filterCompany) params.company = filterCompany;
    if (filterStatus) params.status = filterStatus;
    if (filterCity) params.city = filterCity;
    if (filterHeadquarters) params.headquarters = filterHeadquarters;
    loadUsers(params);
  };

  const exportToCSV = () => {
    const headers = getVisibleColumns.map(col => col.label).join(',');
    const rows = users.map(user => {
      return getVisibleColumns.map(col => {
        switch (col.key) {
          case 'usuario': return `"${user.firstName} ${user.lastName}"`;
          case 'documento': return `"${user.documentType}: ${user.documentNumber}"`;
          case 'email': return `"${user.email}"`;
          case 'telefono': return `"${user.phone || '-'}"`;
          case 'rol': return `"${user.role}"`;
          case 'empresa': return `"${user.company?.name || '-'}"`;
          case 'estado': return `"${user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}"`;
          default: return '""';
        }
      }).join(',');
    }).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    // Implementación básica de PDF
    const content = users.map(user => 
      `${user.firstName} ${user.lastName} - ${user.email} - ${user.role}`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `usuarios_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  const exportToHTML = () => {
    const htmlContent = `
      <html>
        <head>
          <title>Lista de Usuarios</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Lista de Usuarios</h1>
          <table>
            <thead>
              <tr>
                ${getVisibleColumns.map(col => `<th>${col.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${users.map(user => `
                <tr>
                  ${getVisibleColumns.map(col => {
                    switch (col.key) {
                      case 'usuario': return `<td>${user.firstName} ${user.lastName}</td>`;
                      case 'documento': return `<td>${user.documentType}: ${user.documentNumber}</td>`;
                      case 'email': return `<td>${user.email}</td>`;
                      case 'telefono': return `<td>${user.phone || '-'}</td>`;
                      case 'rol': return `<td>${user.role}</td>`;
                      case 'empresa': return `<td>${user.company?.name || '-'}</td>`;
                      case 'estado': return `<td>${user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</td>`;
                      default: return `<td>-</td>`;
                    }
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `usuarios_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
  };

  const handleBulkEdit = async () => {
    const selectedUsers = users.filter(user => selectedIds.has(user.documentNumber));
    const updates = selectedUsers.map(user => ({
      documentNumber: user.documentNumber,
      ...bulkEditData
    }));

    try {
      await Promise.all(updates.map(update => 
        api.put(`/users/${update.documentNumber}`, update)
      ));
      setMessage({ type: 'success', text: 'Usuarios actualizados exitosamente' });
      setBulkEditDialogOpen(false);
      setBulkEditData({
        company: '',
        headquarters: '',
        jobTitle: '',
        residenceCountry: '',
        residenceState: '',
        residenceCity: '',
        commentary: '',
        role: ''
      });
      loadUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al actualizar usuarios' });
    }
  };

  const handleBulkDelete = async () => {
    const selectedUsers = users.filter(user => selectedIds.has(user.documentNumber));
    const superAdmins = selectedUsers.filter(user => user.role === 'SUPER_ADMIN');
    
    if (superAdmins.length > 0) {
      setMessage({ type: 'error', text: 'No se pueden eliminar usuarios SUPER_ADMIN' });
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar ${selectedUsers.length} usuarios?`)) {
      return;
    }

    try {
      await Promise.all(selectedUsers.map(user => 
        api.delete(`/users/${user.documentNumber}`)
      ));
      setMessage({ type: 'success', text: 'Usuarios eliminados exitosamente' });
      setSelectedIds(new Set());
      loadUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al eliminar usuarios' });
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

          {/* Pestañas */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={activeTab === 'list' ? 'contained' : 'outlined'}
                startIcon={<ListIcon />}
                onClick={() => setActiveTab('list')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Lista de Usuarios
              </Button>
              <Button
                variant={activeTab === 'dashboard' ? 'contained' : 'outlined'}
                startIcon={<DashboardIcon />}
                onClick={() => setActiveTab('dashboard')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Dashboard
              </Button>
            </Box>
          </Box>

          {/* Contenido de las pestañas */}
          {activeTab === 'dashboard' ? (
            <UserDashboard />
          ) : (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#333', fontWeight: 600 }}>
                  Lista de Usuarios ({users.length})
                </Typography>
              </Box>

            {/* Barra de acciones y búsqueda */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              {/* Botones de acciones masivas (izquierda) */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {selectedIds.size > 0 && (
                  <>
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="success" 
                      onClick={() => runBulk('activate')}
                    >
                      Activar ({selectedIds.size})
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      color="warning" 
                      onClick={() => runBulk('deactivate')}
                    >
                      Desactivar
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      color="primary" 
                      onClick={() => setBulkEditDialogOpen(true)}
                    >
                      Modificar
                    </Button>
                    <Button 
                      size="small" 
                      color="error" 
                      variant="outlined" 
                      onClick={handleBulkDelete}
                    >
                      Eliminar
                    </Button>
                    <IconButton
                      size="small"
                      onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                      sx={{ color: '#FF6B6B' }}
                      title="Exportar"
                    >
                      <ExportIcon />
                    </IconButton>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        // Aquí se implementaría la funcionalidad de importar
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.csv,.xlsx,.xls';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            console.log('Archivo seleccionado para importar:', file.name);
                            // Aquí se procesaría el archivo
                          }
                        };
                        input.click();
                      }}
                      sx={{ color: '#FF6B6B', borderColor: '#FF6B6B' }}
                    >
                      Importar
                    </Button>
                  </>
                )}
              </Box>

              {/* Búsqueda y filtros (derecha) */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  size="small"
                  placeholder="Buscar usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  sx={{ backgroundColor: '#fff', borderRadius: 1, minWidth: 220 }}
                />
                <Button size="small" variant="outlined" onClick={handleSearch}>
                  Buscar
                </Button>
                
                {/* Filtro desplegable */}
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <MuiSelect
                    value=""
                    displayEmpty
                    onChange={(e) => {
                      // Aquí se manejaría el filtro seleccionado
                      console.log('Filtro seleccionado:', e.target.value);
                    }}
                    sx={{ backgroundColor: '#fff' }}
                  >
                    <MuiMenuItem value="" disabled>
                      <em>Filtrar por...</em>
                    </MuiMenuItem>
                    <MuiMenuItem value="estado">Estado</MuiMenuItem>
                    <MuiMenuItem value="empresa">Empresa</MuiMenuItem>
                    <MuiMenuItem value="rol">Rol</MuiMenuItem>
                    <MuiMenuItem value="ciudad">Ciudad</MuiMenuItem>
                    <MuiMenuItem value="sede">Sede</MuiMenuItem>
                    <MuiMenuItem value="cargo">Cargo</MuiMenuItem>
                    <MuiMenuItem value="pais">País</MuiMenuItem>
                    <MuiMenuItem value="departamento">Departamento</MuiMenuItem>
                  </MuiSelect>
                </FormControl>

                <Tooltip title="Columnas visibles">
                  <IconButton onClick={openColumnsDialog} sx={{ color: '#FF6B6B' }}>
                    <WrenchIcon />
                  </IconButton>
                </Tooltip>
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={() => loadUsers()}
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

            {/* Checkbox para usuarios eliminados */}
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showDeletedUsers}
                    onChange={(e) => setShowDeletedUsers(e.target.checked)}
                  />
                }
                label="Mostrar usuarios eliminados"
              />
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
                          onChange={(e) => {
                            console.log('HEADER CHECKBOX CHANGE:', e.target.checked);
                            toggleSelectAllOnPage();
                          }}
                          onClick={(e) => {
                            console.log('HEADER CHECKBOX CLICK');
                            e.stopPropagation();
                          }}
                          inputProps={{
                            'aria-label': 'Seleccionar todos los usuarios',
                            onClick: (e: any) => {
                              console.log('HEADER INPUT CLICK');
                              toggleSelectAllOnPage();
                            }
                          }}
                        />
                      </TableCell>

                      {getVisibleColumns.map((col) => (
                        <TableCell key={col.key} sx={{ fontWeight: 600 }}>
                          {col.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>

                    {users.map((user) => (
                      <TableRow key={user.documentNumber}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedIds.has(user.documentNumber)}
                            onChange={(e) => {
                              console.log('CHECKBOX CHANGE EVENT:', user.documentNumber, e.target.checked);
                              toggleSelectOne(user.documentNumber);
                            }}
                            onClick={(e) => {
                              console.log('CHECKBOX CLICK EVENT:', user.documentNumber);
                              e.stopPropagation();
                            }}
                            inputProps={{
                              'aria-label': `Seleccionar usuario ${user.firstName} ${user.lastName}`,
                              onClick: (e: any) => {
                                console.log('INPUT CLICK EVENT:', user.documentNumber);
                                toggleSelectOne(user.documentNumber);
                              }
                            }}
                          />
                        </TableCell>
                        {getVisibleColumns.map((col) => {
                          switch (col.key) {
                            case 'usuario':
                              return (
                                <TableCell key={col.key}>
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
                          );
                        case 'documento':
                          return (
                            <TableCell key={col.key}>
                              <Typography variant="body2">
                                {user.documentType}: {user.documentNumber}
                              </Typography>
                            </TableCell>
                          );
                        case 'email':
                          return (
                            <TableCell key={col.key}>
                              <Typography variant="body2">{user.email}</Typography>
                            </TableCell>
                          );
                        case 'telefono':
                          return (
                            <TableCell key={col.key}>
                              <Typography variant="body2">{user.phone || '-'}</Typography>
                            </TableCell>
                          );
                        case 'rol':
                          return (
                            <TableCell key={col.key}>
                              <Chip
                                label={user.role}
                                color={getRoleColor(user.role) as any}
                                size="small"
                                sx={{ fontWeight: 500 }}
                              />
                            </TableCell>
                          );
                        case 'empresa':
                          return (
                            <TableCell key={col.key}>
                              <Typography variant="body2">
                                {user.company?.name || '-'}
                              </Typography>
                            </TableCell>
                          );
                        case 'sede':
                          return (
                            <TableCell key={col.key}>
                              <Typography variant="body2">{user.headquarters?.name || '-'}</Typography>
                            </TableCell>
                          );
                        case 'cargo':
                          return (
                            <TableCell key={col.key}>
                              <Typography variant="body2">{user.jobTitle?.name || '-'}</Typography>
                            </TableCell>
                          );
                        case 'pais':
                          return (
                            <TableCell key={col.key}>
                              <Typography variant="body2">{user.residenceCountry || '-'}</Typography>
                            </TableCell>
                          );
                        case 'departamento':
                          return (
                            <TableCell key={col.key}>
                              <Typography variant="body2">{user.residenceState || '-'}</Typography>
                            </TableCell>
                          );
                        case 'ciudad':
                          return (
                            <TableCell key={col.key}>
                              <Typography variant="body2">{user.residenceCity || '-'}</Typography>
                            </TableCell>
                          );
                        case 'direccion1':
                          return (
                            <TableCell key={col.key}>
                              <Typography variant="body2">{user.addressLine1 || '-'}</Typography>
                            </TableCell>
                          );
                        case 'direccion2':
                          return (
                            <TableCell key={col.key}>
                              <Typography variant="body2">{user.addressLine2 || '-'}</Typography>
                            </TableCell>
                          );
                        case 'comentario':
                          return (
                            <TableCell key={col.key}>
                              <Typography variant="body2">{user.commentary || '-'}</Typography>
                            </TableCell>
                          );
                        case 'estado':
                          return (
                            <TableCell key={col.key}>
                              <Chip
                                label={user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                                color={getStatusColor(user.status) as any}
                                size="small"
                              />
                            </TableCell>
                          );
                        case 'ultimoAcceso':
                          return (
                            <TableCell key={col.key}>
                              <Typography variant="body2">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '-'}</Typography>
                            </TableCell>
                          );
                        case 'creado':
                          return (
                            <TableCell key={col.key}>
                              <Typography variant="body2">{new Date(user.createdAt).toLocaleDateString()}</Typography>
                            </TableCell>
                          );
                        case 'actualizado':
                          return (
                            <TableCell key={col.key}>
                              <Typography variant="body2">{new Date(user.updatedAt).toLocaleDateString()}</Typography>
                            </TableCell>
                          );
                        case 'acciones':
                          return (
                            <TableCell key={col.key}>
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
                                {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && user.role !== 'SUPER_ADMIN' && user.documentNumber !== currentUser.documentNumber && (
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
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de selección de columnas */}

      <MuiDialog
        open={columnsDialogOpen}
        onClose={(event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            closeColumnsDialog();
          }
        }}
        maxWidth="sm"
        fullWidth
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
        keepMounted
        PaperProps={{ sx: { borderRadius: 3 } }}
        aria-labelledby="columns-dialog-title"
        aria-describedby="columns-dialog-description"
      >
        <MuiDialogTitle id="columns-dialog-title">
          Configurar Columnas Visibles
        </MuiDialogTitle>
        <MuiDialogContent dividers>
          <Box id="columns-dialog-description" sx={{ mb: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
            Arrastra las columnas para reordenarlas y activa/desactiva las que deseas mostrar en la tabla de usuarios.
          </Box>
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {columnsConfig.map((col, index) => (
              <React.Fragment key={col.key}>
                <ListItem
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        size="small"
                        variant={col.defaultVisible ? "contained" : "outlined"}
                        onClick={() => handleToggleColumn(col.key)}
                        sx={{ 
                          minWidth: 'auto',
                          px: 1,
                          backgroundColor: col.defaultVisible ? '#FF6B6B' : '#f5f5f5',
                          color: col.defaultVisible ? 'white' : '#666',
                          borderColor: col.defaultVisible ? '#FF6B6B' : '#ddd',
                          '&:hover': {
                            backgroundColor: col.defaultVisible ? '#FF5A5A' : '#e0e0e0',
                            borderColor: col.defaultVisible ? '#FF5A5A' : '#ccc',
                          }
                        }}
                      >
                        {col.defaultVisible ? 'ON' : 'OFF'}
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (index > 0) {
                            handleMoveColumn(index, index - 1);
                          }
                        }}
                        disabled={index === 0}
                        sx={{ color: '#666' }}
                      >
                        ↑
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (index < columnsConfig.length - 1) {
                            handleMoveColumn(index, index + 1);
                          }
                        }}
                        disabled={index === columnsConfig.length - 1}
                        sx={{ color: '#666' }}
                      >
                        ↓
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemIcon>
                    <DragIcon sx={{ color: '#999' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={col.label}
                    secondary={`Orden: ${col.order}`}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontWeight: col.defaultVisible ? 600 : 400,
                        color: col.defaultVisible ? '#333' : '#666',
                      },
                    }}
                  />
                </ListItem>
                {index < columnsConfig.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </MuiDialogContent>
        <MuiDialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
                        onClick={resetColumns}
            variant="outlined"
            size="small"
          >
            Restablecer
          </Button>
          <Button
            variant="contained"
            onClick={closeColumnsDialog}
            size="small"
            sx={{
              bgcolor: '#FF69B4',
              '&:hover': {
                bgcolor: '#FF1493',
              },
            }}
          >
            Cerrar
          </Button>
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
            initialData={selectedUser || undefined}
            onCancel={handleCloseModal}
            onSave={handleUserSaved}
            isEditMode={isEditMode}
          />
        </DialogContent>
      </Dialog>

      {/* Menú de exportación */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={() => { exportToCSV(); setExportMenuAnchor(null); }}>
          Exportar a CSV
        </MenuItem>
        <MenuItem onClick={() => { exportToPDF(); setExportMenuAnchor(null); }}>
          Exportar a PDF
        </MenuItem>
        <MenuItem onClick={() => { exportToHTML(); setExportMenuAnchor(null); }}>
          Exportar a HTML
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { 
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.csv,.xlsx,.xls';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              console.log('Archivo seleccionado para importar:', file.name);
              // Aquí se procesaría el archivo
              setMessage({ type: 'success', text: `Archivo ${file.name} seleccionado para importar` });
            }
          };
          input.click();
          setExportMenuAnchor(null);
        }}>
          Importar desde archivo
        </MenuItem>
      </Menu>

      {/* Diálogo de modificación masiva */}
      <Dialog
        open={bulkEditDialogOpen}
        onClose={() => setBulkEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#FF6B6B', color: 'white' }}>
          Modificar Usuarios Seleccionados
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Empresa"
                value={bulkEditData.company}
                onChange={(e) => setBulkEditData(prev => ({ ...prev, company: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sede"
                value={bulkEditData.headquarters}
                onChange={(e) => setBulkEditData(prev => ({ ...prev, headquarters: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cargo"
                value={bulkEditData.jobTitle}
                onChange={(e) => setBulkEditData(prev => ({ ...prev, jobTitle: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Rol</InputLabel>
                <MuiSelect
                  value={bulkEditData.role}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, role: e.target.value }))}
                  label="Rol"
                >
                  <MuiMenuItem value="">No cambiar</MuiMenuItem>
                  <MuiMenuItem value="SUPER_ADMIN">Super Admin</MuiMenuItem>
                  <MuiMenuItem value="ADMIN">Admin</MuiMenuItem>
                  <MuiMenuItem value="SUPERVISOR">Supervisor</MuiMenuItem>
                  <MuiMenuItem value="USER">User</MuiMenuItem>
                </MuiSelect>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="País"
                value={bulkEditData.residenceCountry}
                onChange={(e) => setBulkEditData(prev => ({ ...prev, residenceCountry: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Departamento/Estado"
                value={bulkEditData.residenceState}
                onChange={(e) => setBulkEditData(prev => ({ ...prev, residenceState: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ciudad"
                value={bulkEditData.residenceCity}
                onChange={(e) => setBulkEditData(prev => ({ ...prev, residenceCity: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Comentario"
                value={bulkEditData.commentary}
                onChange={(e) => setBulkEditData(prev => ({ ...prev, commentary: e.target.value }))}
                multiline
                rows={3}
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkEditDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleBulkEdit}
            variant="contained"
            sx={{ bgcolor: '#FF6B6B', '&:hover': { bgcolor: '#FF5A5A' } }}
          >
            Aplicar Cambios
          </Button>
        </DialogActions>
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
