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
  KeyboardArrowUp,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import api from '../../config/api';
import UserForm from './UserForm';
import ViewDialog from '../common/ViewDialog';
import ModalHeader from '../common/ModalHeader';
import PageHeader from '../common/PageHeader';
import PageHeaderActionButton from '../common/PageHeaderActionButton';

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
  process?: {
    id: number;
    name: string;
    commentary?: string;
  } | null;
}

type ColumnKey =
  | 'usuarioCompleto'
  | 'username'
  | 'firstName'
  | 'lastName'
  | 'documentType'
  | 'documentNumber'
  | 'email'
  | 'telefono'
  | 'rol'
  | 'empresa'
  | 'estado'
  | 'sede'
  | 'proceso'
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
  { key: 'usuarioCompleto', label: 'Usuario', defaultVisible: true, order: 1 },
  { key: 'username', label: 'Nombre de Usuario', defaultVisible: true, order: 2 },
  { key: 'firstName', label: 'Nombre', defaultVisible: true, order: 3 },
  { key: 'lastName', label: 'Apellido', defaultVisible: true, order: 4 },
  { key: 'documentType', label: 'Tipo de Documento', defaultVisible: true, order: 5 },
  { key: 'documentNumber', label: 'Número de Documento', defaultVisible: true, order: 6 },
  { key: 'email', label: 'Email', defaultVisible: true, order: 7 },
  { key: 'telefono', label: 'Teléfono', defaultVisible: true, order: 8 },
  { key: 'rol', label: 'Rol', defaultVisible: true, order: 9 },
  { key: 'empresa', label: 'Empresa', defaultVisible: true, order: 10 },
  { key: 'estado', label: 'Estado Usuario', defaultVisible: true, order: 11 },
  { key: 'creado', label: 'Creado', defaultVisible: true, order: 12 },
  { key: 'sede', label: 'Sede', defaultVisible: false, order: 13 },
  { key: 'proceso', label: 'Proceso', defaultVisible: false, order: 14 },
  { key: 'cargo', label: 'Cargo', defaultVisible: false, order: 15 },
  { key: 'ultimoAcceso', label: 'Último acceso', defaultVisible: false, order: 16 },
  { key: 'actualizado', label: 'Actualizado', defaultVisible: false, order: 17 },
  { key: 'pais', label: 'País', defaultVisible: false, order: 18 },
  { key: 'departamento', label: 'Estado/Departamento', defaultVisible: false, order: 19 },
  { key: 'ciudad', label: 'Ciudad', defaultVisible: false, order: 20 },
  { key: 'direccion1', label: 'Dirección 1', defaultVisible: false, order: 21 },
  { key: 'direccion2', label: 'Dirección 2', defaultVisible: false, order: 22 },
  { key: 'comentario', label: 'Comentario', defaultVisible: false, order: 23 },
  { key: 'acciones', label: 'Acciones', defaultVisible: true, order: 24 },
];

const COLUMNS_CONFIG_STORAGE_KEY = 'itd_userlist_columns_config';

const UserList: React.FC = React.memo(() => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [columnsConfig, setColumnsConfig] = useState<ColumnConfig[]>(COLUMN_OPTIONS);
  const [columnsDialogOpen, setColumnsDialogOpen] = useState(false);
  const [bulkRole, setBulkRole] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [showDisabledUsers, setShowDisabledUsers] = useState(false);
  const [filterCompany, setFilterCompany] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCity, setFilterCity] = useState<string>('');
  const [filterHeadquarters, setFilterHeadquarters] = useState<string>('');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [importMenuAnchor, setImportMenuAnchor] = useState<null | HTMLElement>(null);

  const loadUsers = useCallback(async (params?: { search?: string }) => {
    try {
      setLoading(true);
      const response = await api.get('/users', { 
        params,
        // Optimización: agregar timeout para evitar requests muy lentos
        timeout: 10000
      });
      const list = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.users)
          ? response.data.users
          : [];
      
      console.debug('🔄 UserList: Usuarios cargados:', list.length);
      if (list.length > 0) {
        console.debug('🔄 UserList: Primer usuario:', list[0]);
        console.debug('🔄 UserList: Proceso del primer usuario:', list[0].process);
        console.debug('🔄 UserList: Cargo del primer usuario:', list[0].jobTitle);
        console.debug('🔄 UserList: Todos los campos del primer usuario:', Object.keys(list[0]));
        
        // Verificar específicamente usuarios con processId
        const usersWithProcess = list.filter(user => user.process);
        console.debug('🔄 UserList: Usuarios con proceso:', usersWithProcess.length);
        usersWithProcess.forEach((user, index) => {
          console.debug(`🔄 UserList: Usuario ${index + 1} con proceso:`, {
            name: `${user.firstName} ${user.lastName}`,
            process: user.process,
            jobTitle: user.jobTitle
          });
        });
      }
      
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

  // Limpiar configuración anterior para aplicar nuevos defaults
  useEffect(() => {
    const savedConfig = localStorage.getItem(COLUMNS_CONFIG_STORAGE_KEY);
    if (!savedConfig) {
      // Si no hay configuración guardada, usar los nuevos defaults
      setColumnsConfig(COLUMN_OPTIONS);
    }
  }, []);

  // Debounce para búsqueda automática
  useEffect(() => {
    if (searchTerm) setSearching(true);
    
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setSearching(false);
    }, 300); // 300ms de debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Ejecutar búsqueda cuando cambie el término con debounce
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) return; // Solo ejecutar si ya terminó el debounce
    
    const params: any = { search: debouncedSearchTerm.trim() || undefined };
    if (showDisabledUsers) params.deleted = true;
    if (filterCompany) params.company = filterCompany;
    if (filterStatus) params.status = filterStatus;
    if (filterCity) params.city = filterCity;
    if (filterHeadquarters) params.headquarters = filterHeadquarters;

    loadUsers(params);
  }, [debouncedSearchTerm, showDisabledUsers, filterCompany, filterStatus, filterCity, filterHeadquarters, loadUsers]);



  const handleOpenModal = useCallback((user?: User, edit = false) => {
    console.debug('🔄 UserList: Abriendo modal con usuario:', user);
    console.debug('🔄 UserList: Datos de proceso:', user?.process);
    console.debug('🔄 UserList: Datos de cargo:', user?.jobTitle);
    setSelectedUser(user || null);
    setIsEditMode(edit);
    setIsBulkEditMode(false);
    setModalOpen(true);
  }, []);

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  const handleEditFromView = () => {
    setViewDialogOpen(false);
    setIsEditMode(true);
    setModalOpen(true);
  };

  // Memoizar usuarios seleccionados para evitar recálculos
  const selectedUsers = useMemo(() => {
    return users.filter(user => selectedIds.has(user.documentNumber));
  }, [users, selectedIds]);

  const handleOpenBulkEditModal = useCallback(() => {
    if (selectedUsers.length === 0) {
      setMessage({ type: 'error', text: 'Por favor selecciona al menos un usuario para modificar' });
      return;
    }
    
    if (selectedUsers.length === 1) {
      // Un solo usuario seleccionado - usar modal de edición individual
      setSelectedUser(selectedUsers[0]);
      setIsEditMode(true);
      setIsBulkEditMode(false);
    } else {
      // Múltiples usuarios - usar modal de edición múltiple
      setSelectedUser(null);
      setIsEditMode(false);
      setIsBulkEditMode(true);
    }
    
    setModalOpen(true);
  }, [selectedUsers]);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSelectedUser(null);
    setIsEditMode(false);
    setIsBulkEditMode(false);
  }, []);

  const handleUserSaved = useCallback(() => {
    handleCloseModal();
    loadUsers();
    
    // Limpiar selecciones después de edición múltiple
    if (isBulkEditMode) {
      setSelectedIds(new Set());
    }
    
    const successMessage = isBulkEditMode 
      ? 'Usuarios actualizados exitosamente' 
      : isEditMode 
        ? 'Usuario actualizado exitosamente' 
        : 'Usuario creado exitosamente';
        
    setMessage({ type: 'success', text: successMessage });
  }, [handleCloseModal, loadUsers, isEditMode, isBulkEditMode]);

  const handleDeleteUser = useCallback(async (userId: string) => {
    // Prevent disabling protected and SUPER_ADMIN users
    const target = users.find(u => u.documentNumber === userId);
    if (target?.role === 'SUPER_ADMIN') {
      setMessage({ type: 'error', text: 'No se permite deshabilitar usuarios SUPER_ADMIN' });
      return;
    }
    if (target?.isDeletionProtected) {
      setMessage({ type: 'error', text: 'Este usuario está protegido contra eliminación' });
      return;
    }
    if (userId === currentUser?.documentNumber) {
      setMessage({ type: 'error', text: 'No puedes deshabilitar tu propio usuario' });
      return;
    }
    if (target?.status === 'INACTIVE') {
      setMessage({ type: 'error', text: 'El usuario ya está deshabilitado' });
      return;
    }
    if (!window.confirm('¿Estás seguro de que deseas deshabilitar este usuario? Esta acción cambiará su estado a inactivo.')) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      loadUsers();
      setMessage({ type: 'success', text: 'Usuario deshabilitado exitosamente' });
    } catch (error: any) {
        console.error('Error disabling user:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al deshabilitar usuario' 
      });
    }
  }, [loadUsers, users, currentUser]);

  const handleEnableUser = useCallback(async (userId: string) => {
    const target = users.find(u => u.documentNumber === userId);
    if (target?.status === 'ACTIVE') {
      setMessage({ type: 'error', text: 'El usuario ya está activo' });
      return;
    }
    if (!window.confirm('¿Estás seguro de que deseas habilitar este usuario?')) {
      return;
    }

    try {
      await api.put(`/users/${userId}`, { status: 'ACTIVE' });
      loadUsers();
      setMessage({ type: 'success', text: 'Usuario habilitado exitosamente' });
    } catch (error: any) {
        console.error('Error enabling user:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al habilitar usuario' 
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
    console.debug('CHECKBOX CLICKED:', id);
    setSelectedIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(id)) {
        newSelected.delete(id);
        console.debug('REMOVED:', id);
      } else {
        newSelected.add(id);
        console.debug('ADDED:', id);
      }
      console.debug('TOTAL SELECTED:', newSelected.size);
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
          // Skip deleting SUPER_ADMIN, protected users, and self
          if (u?.role === 'SUPER_ADMIN') return;
          if (u?.isDeletionProtected) return;
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


  const exportToCSV = (language: 'es' | 'en' = 'es') => {
    // Mapeo de campos a headers según el idioma
    const fieldToHeader: { [key: string]: { es: string; en: string } } = {
      'usuarioCompleto': { es: 'Usuario', en: 'User' },
      'username': { es: 'Nombre de Usuario', en: 'Username' },
      'firstName': { es: 'Nombre', en: 'First Name' },
      'lastName': { es: 'Apellido', en: 'Last Name' },
      'documentType': { es: 'Tipo de Documento', en: 'Document Type' },
      'documentNumber': { es: 'Número de Documento', en: 'Document Number' },
      'email': { es: 'Email', en: 'Email' },
      'telefono': { es: 'Teléfono', en: 'Phone' },
      'rol': { es: 'Rol', en: 'Role' },
      'empresa': { es: 'Empresa', en: 'Company' },
      'estado': { es: 'Estado', en: 'Status' },
      'sede': { es: 'Sede', en: 'Headquarters' },
      'cargo': { es: 'Cargo', en: 'Job Title' },
      'ultimoAcceso': { es: 'Último Acceso', en: 'Last Access' },
      'creado': { es: 'Creado', en: 'Created' },
      'actualizado': { es: 'Actualizado', en: 'Updated' },
      'pais': { es: 'País', en: 'Country' },
      'departamento': { es: 'Departamento', en: 'State' },
      'ciudad': { es: 'Ciudad', en: 'City' },
      'direccion1': { es: 'Dirección 1', en: 'Address 1' },
      'direccion2': { es: 'Dirección 2', en: 'Address 2' },
      'comentario': { es: 'Comentario', en: 'Commentary' }
    };

    const headers = getVisibleColumns.map(col => fieldToHeader[col.key]?.[language] || col.label).join(',');
    const rows = users.map(user => {
      return getVisibleColumns.map(col => {
        switch (col.key) {
          case 'usuarioCompleto': return `"${user.firstName} ${user.lastName}"`;
          case 'username': return `"${user.username || '-'}"`;
          case 'firstName': return `"${user.firstName}"`;
          case 'lastName': return `"${user.lastName}"`;
          case 'documentType': return `"${user.documentType}"`;
          case 'documentNumber': return `"${user.documentNumber}"`;
          case 'email': return `"${user.email}"`;
          case 'telefono': return `"${user.phone || '-'}"`;
          case 'rol': return `"${user.role}"`;
          case 'empresa': return `"${user.company?.name || '-'}"`;
          case 'estado': return `"${user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}"`;
          case 'sede': return `"${user.headquarters?.name || '-'}"`;
          case 'proceso': return `"${user.process?.name || '-'}"`;
          case 'cargo': return `"${user.jobTitle?.name || '-'}"`;
          case 'ultimoAcceso': return `"${user.lastLogin || '-'}"`;
          case 'creado': return `"${user.createdAt}"`;
          case 'actualizado': return `"${user.updatedAt}"`;
          case 'pais': return `"${user.residenceCountry || '-'}"`;
          case 'departamento': return `"${user.residenceState || '-'}"`;
          case 'ciudad': return `"${user.residenceCity || '-'}"`;
          case 'direccion1': return `"${user.addressLine1 || '-'}"`;
          case 'direccion2': return `"${user.addressLine2 || '-'}"`;
          case 'comentario': return `"${user.commentary || '-'}"`;
          default: return '""';
        }
      }).join(',');
    }).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `usuarios_${language}_${new Date().toISOString().split('T')[0]}.csv`;
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
                      case 'usuarioCompleto': return `<td>${user.firstName} ${user.lastName}</td>`;
                      case 'username': return `<td>${user.username || '-'}</td>`;
                      case 'firstName': return `<td>${user.firstName}</td>`;
                      case 'lastName': return `<td>${user.lastName}</td>`;
                      case 'documentType': return `<td>${user.documentType}</td>`;
                      case 'documentNumber': return `<td>${user.documentNumber}</td>`;
                      case 'email': return `<td>${user.email}</td>`;
                      case 'telefono': return `<td>${user.phone || '-'}</td>`;
                      case 'rol': return `<td>${user.role}</td>`;
                      case 'empresa': return `<td>${user.company?.name || '-'}</td>`;
                      case 'estado': return `<td>${user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</td>`;
                      case 'sede': return `<td>${user.headquarters?.name || '-'}</td>`;
                      case 'proceso': return `<td>${user.process?.name || '-'}</td>`;
                      case 'cargo': return `<td>${user.jobTitle?.name || '-'}</td>`;
                      case 'ultimoAcceso': return `<td>${user.lastLogin || '-'}</td>`;
                      case 'creado': return `<td>${user.createdAt}</td>`;
                      case 'actualizado': return `<td>${user.updatedAt}</td>`;
                      case 'pais': return `<td>${user.residenceCountry || '-'}</td>`;
                      case 'departamento': return `<td>${user.residenceState || '-'}</td>`;
                      case 'ciudad': return `<td>${user.residenceCity || '-'}</td>`;
                      case 'direccion1': return `<td>${user.addressLine1 || '-'}</td>`;
                      case 'direccion2': return `<td>${user.addressLine2 || '-'}</td>`;
                      case 'comentario': return `<td>${user.commentary || '-'}</td>`;
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


  const handleBulkDelete = async () => {
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

  const downloadTemplate = (language: 'es' | 'en') => {
    // Headers obligatorios primero, opcionales después
    const headers = language === 'es' ? [
      // OBLIGATORIOS
      'username', 'nombre', 'apellido', 'email', 'tipo de documento', 'numero de documento', 'contraseña',
      // OPCIONALES
      'rol', 'telefono', 'estado', 'empresa', 'sede', 'cargo', 
      'pais', 'departamento', 'ciudad', 'direccion1', 'direccion2', 'comentario'
    ] : [
      // REQUIRED
      'username', 'firstName', 'lastName', 'email', 'documentType', 'documentNumber', 'password',
      // OPTIONAL
      'role', 'phone', 'status', 'company', 'headquarters', 'jobTitle', 
      'residenceCountry', 'residenceState', 'residenceCity', 'addressLine1', 'addressLine2', 'commentary'
    ];

    // Agregar una fila de ejemplo con comentarios
    const exampleRow = language === 'es' ? [
      'jperez', 'Juan', 'Pérez', 'juan.perez@email.com', 'CEDULA', '12345678', 'MiPassword123',
      'USER', '+57300123456', 'ACTIVE', 'Mi Empresa', 'Sede Principal', 'Desarrollador',
      'Colombia', 'Cundinamarca', 'Bogotá', 'Calle 123 #45-67', 'Apt 101', 'Usuario de ejemplo'
    ] : [
      'jperez', 'Juan', 'Perez', 'juan.perez@email.com', 'CEDULA', '12345678', 'MyPassword123',
      'USER', '+57300123456', 'ACTIVE', 'My Company', 'Main Office', 'Developer',
      'Colombia', 'Cundinamarca', 'Bogota', 'Street 123 #45-67', 'Apt 101', 'Example user'
    ];

    const csvContent = headers.join(',') + '\n' + exampleRow.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `plantilla_usuarios_${language}_con_ejemplo.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',');
        
        // Validate headers
        const requiredHeaders = ['firstName', 'lastName', 'email', 'documentType', 'documentNumber'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          setMessage({ 
            type: 'error', 
            text: `Campos requeridos faltantes: ${missingHeaders.join(', ')}` 
          });
          return;
        }

        // Process CSV data
        const usersData = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',');
          const user: any = {};
          headers.forEach((header, index) => {
            user[header.trim()] = values[index]?.trim() || '';
          });
          return user;
        });

                          console.log('Users to import:', usersData);
                  
                  // Validación detallada de datos requeridos
                  const validationErrors: string[] = [];
                  const validUsers = usersData.filter((user, index) => {
                    const rowNumber = index + 2; // +2 porque index empieza en 0 y la primera línea son headers
                    const userErrors: string[] = [];
                    
                    // CAMPOS OBLIGATORIOS (validación estricta)
                    if (!user.username || user.username.trim() === '') {
                      userErrors.push('username');
                    }
                    if (!user.firstName || user.firstName.trim() === '') {
                      userErrors.push('firstName/nombre');
                    }
                    if (!user.lastName || user.lastName.trim() === '') {
                      userErrors.push('lastName/apellido');
                    }
                    if (!user.email || user.email.trim() === '') {
                      userErrors.push('email');
                    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
                      userErrors.push('email (formato inválido)');
                    }
                    if (!user.documentType || user.documentType.trim() === '') {
                      userErrors.push('documentType/tipo de documento');
                    }
                    if (!user.documentNumber || user.documentNumber.trim() === '') {
                      userErrors.push('documentNumber/número de documento');
                    }
                    if (!user.password || user.password.trim() === '') {
                      userErrors.push('password/contraseña');
                    }
                    
                    // ASIGNAR ROL POR DEFECTO si no se proporciona
                    if (!user.role || user.role.trim() === '') {
                      user.role = 'USER'; // Rol por defecto
                    }
                    
                    // VALIDACIONES OPCIONALES (solo si se proporcionan los campos)
                    
                    // Validar tipo de documento si se proporciona
                    if (user.documentType) {
                      const validDocumentTypes = ['CEDULA', 'CEDULA_EXTRANJERIA', 'TARJETA_IDENTIDAD', 'PASSPORT', 'NIT', 'RUT'];
                      if (!validDocumentTypes.includes(user.documentType.toUpperCase())) {
                        // Asignar valor por defecto si es inválido
                        user.documentType = 'CEDULA';
                        console.warn(`Tipo de documento inválido en fila ${rowNumber}, asignado 'CEDULA' por defecto`);
                      }
                    }
                    
                    // Validar rol si se proporciona (si no, ya se asignó USER por defecto)
                    if (user.role) {
                      const validRoles = ['SUPER_ADMIN', 'ADMIN', 'USER', 'SUPERVISOR'];
                      if (!validRoles.includes(user.role.toUpperCase())) {
                        user.role = 'USER';
                        console.warn(`Rol inválido en fila ${rowNumber}, asignado 'USER' por defecto`);
                      }
                    }
                    
                    // Validar estado si se proporciona (opcional)
                    if (user.status) {
                      const validStatuses = ['ACTIVE', 'INACTIVE', 'ACTIVO', 'INACTIVO'];
                      if (!validStatuses.includes(user.status.toUpperCase())) {
                        user.status = 'ACTIVE';
                        console.warn(`Estado inválido en fila ${rowNumber}, asignado 'ACTIVE' por defecto`);
                      }
                      // Normalizar a formato estándar
                      if (user.status.toUpperCase() === 'ACTIVO') user.status = 'ACTIVE';
                      if (user.status.toUpperCase() === 'INACTIVO') user.status = 'INACTIVE';
                    }
                    
                    if (userErrors.length > 0) {
                      validationErrors.push(`Fila ${rowNumber} (${user.firstName || 'Sin nombre'} ${user.lastName || 'Sin apellido'}): ${userErrors.join(', ')}`);
                      return false;
                    }
                    
                    return true;
                  });

                  if (validUsers.length === 0) {
                    const errorMessage = validationErrors.length > 0 
                      ? `Errores de validación encontrados:\n${validationErrors.slice(0, 10).join('\n')}${validationErrors.length > 10 ? `\n... y ${validationErrors.length - 10} errores más` : ''}`
                      : 'No se encontraron usuarios válidos para importar. Verifica que todos los campos requeridos estén completos.';
                    
                    setMessage({ 
                      type: 'error', 
                      text: errorMessage
                    });
                    return;
                  }

                  if (validUsers.length !== usersData.length) {
                    const warningMessage = `${validUsers.length} de ${usersData.length} usuarios son válidos. Se importarán solo los usuarios válidos.\n\nErrores encontrados:\n${validationErrors.slice(0, 5).join('\n')}${validationErrors.length > 5 ? `\n... y ${validationErrors.length - 5} errores más` : ''}`;
                    
                    setMessage({ 
                      type: 'warning', 
                      text: warningMessage
                    });
                  }

                  // Importar usuarios uno por uno
                  try {
                    setLoading(true);
                    let successCount = 0;
                    let errorCount = 0;
                    const importPromises = [];

                    for (const userData of validUsers) {
                      try {
                        // Preparar datos para la API
                        const importData = {
                          username: userData.username,
                          firstName: userData.firstName,
                          lastName: userData.lastName,
                          email: userData.email,
                          documentType: userData.documentType.toUpperCase(),
                          documentNumber: userData.documentNumber,
                          phone: userData.phone || null,
                          role: (userData.role || 'USER').toUpperCase(),
                          status: userData.status || 'ACTIVE',
                          company: userData.company || null,
                          headquarters: userData.headquarters || null,
                          jobTitle: userData.jobTitle || null,
                          residenceCountry: userData.residenceCountry || null,
                          residenceState: userData.residenceState || null,
                          residenceCity: userData.residenceCity || null,
                          addressLine1: userData.addressLine1 || null,
                          addressLine2: userData.addressLine2 || null,
                          commentary: userData.commentary || null,
                          password: userData.password || 'Password123!' // Usar password del CSV o temporal
                        };

                        const importPromise = api.post('/users', importData)
                          .then(() => {
                            successCount++;
                            console.log(`Usuario importado exitosamente: ${userData.firstName} ${userData.lastName}`);
                          })
                          .catch((error) => {
                            console.error('Error importing user:', userData, error);
                            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.response?.data?.errors || error.message || 'Error desconocido';
                            console.error(`Error específico para ${userData.firstName} ${userData.lastName}:`, errorMessage);
                            console.error('Response completa del error:', error.response?.data);
                            console.error('Status del error:', error.response?.status);
                            errorCount++;
                          });

                        importPromises.push(importPromise);
                      } catch (error) {
                        console.error('Error preparing user data:', userData, error);
                        errorCount++;
                      }
                    }

                    // Esperar a que todas las importaciones terminen
                    Promise.all(importPromises).then(() => {
                      let messageText = `Importación completada: ${successCount} usuarios importados exitosamente`;
                      
                      if (errorCount > 0) {
                        messageText += `, ${errorCount} errores`;
                        if (successCount === 0) {
                          setMessage({ 
                            type: 'error', 
                            text: `Importación fallida: ${errorCount} errores. Revisa la consola del navegador (F12) para ver los errores específicos del backend.` 
                          });
                        } else {
                          setMessage({ 
                            type: 'warning', 
                            text: messageText + '. Revisa la consola del navegador (F12) para detalles de errores.' 
                          });
                        }
                      } else {
                        setMessage({ 
                          type: 'success', 
                          text: messageText 
                        });
                      }

                      // Recargar la lista de usuarios después de un breve delay
                      setTimeout(() => {
                        loadUsers();
                      }, 1000);
                    });

                  } catch (error) {
                    console.error('Error during import:', error);
                    setMessage({ 
                      type: 'error', 
                      text: 'Error durante la importación de usuarios' 
                    });
                  } finally {
                    setLoading(false);
                  }
        
      } catch (error) {
        console.error('Error processing CSV:', error);
        setMessage({ 
          type: 'error', 
          text: 'Error al procesar el archivo CSV' 
        });
      }
    };
    
    reader.readAsText(file);
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
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Gestión de Usuarios"
        subtitle="Administra los usuarios del sistema"
        action={<PageHeaderActionButton label="+ Nuevo Usuario" startIcon={<AddIcon />} onClick={() => handleOpenModal()} />}
      />

      {/* Contenido Principal - Módulo Único */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
      >

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
                {/* Botones que aparecen solo cuando hay usuarios seleccionados */}
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
                      onClick={handleOpenBulkEditModal}
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
                  </>
                )}

                {/* Botones de Importar y Exportar siempre visibles */}
                <IconButton
                  size="small"
                  onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                  sx={{ color: '#FF6B6B' }}
                  title="Exportar"
                >
                  <ExportIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => setImportMenuAnchor(e.currentTarget)}
                  sx={{ color: '#FF6B6B' }}
                  title="Importar"
                >
                  <ImportIcon />
                </IconButton>
      </Box>

              {/* Búsqueda y filtros (derecha) */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                  size="small"
                  placeholder="Buscar usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    endAdornment: searching && <CircularProgress size={20} />
                  }}
                  sx={{ backgroundColor: '#fff', borderRadius: 1, minWidth: 220 }}
                />
                
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
            {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && (
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showDisabledUsers}
                      onChange={(e) => setShowDisabledUsers(e.target.checked)}
                      sx={{
                        color: '#FF69B4',
                        '&.Mui-checked': {
                          color: '#FF69B4',
                        },
                      }}
                    />
                  }
                  label="Mostrar usuarios deshabilitados"
                />
              </Box>
            )}
          </Box>

          <TableContainer component="div" sx={{ borderRadius: 2, overflowX: 'auto', overflowY: 'hidden', bgcolor: 'background.paper' }}>
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
                        case 'usuarioCompleto':
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
                        case 'username':
                          return (
                            <TableCell key={col.key}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                @{user.username || '-'}
                          </Typography>
                    </TableCell>
                          );
                        case 'firstName':
                          return (
                            <TableCell key={col.key}>
                              <Typography variant="body2">{user.firstName}</Typography>
                    </TableCell>
                          );
                        case 'lastName':
                          return (
                            <TableCell key={col.key}>
                              <Typography variant="body2">{user.lastName}</Typography>
                    </TableCell>
                          );
                        case 'documentType':
                          return (
                            <TableCell key={col.key}>
                              <Typography variant="body2">{user.documentType}</Typography>
                            </TableCell>
                          );
                        case 'documentNumber':
                          return (
                            <TableCell key={col.key}>
                              <Typography variant="body2">{user.documentNumber}</Typography>
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
                        case 'proceso':
                          return (
                            <TableCell key={col.key}>
                              <Typography variant="body2">{user.process?.name || '-'}</Typography>
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
                              onClick={() => handleViewUser(user)}
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
                                {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && user.role !== 'SUPER_ADMIN' && user.documentNumber !== currentUser.documentNumber && !user.isDeletionProtected && user.status === 'ACTIVE' && (
                                  <Tooltip title="Deshabilitar">
                            <IconButton
                              size="small"
                                      onClick={() => handleDeleteUser(user.documentNumber)}
                                      sx={{ color: '#F44336' }}
                            >
                                      <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                                {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && user.role !== 'SUPER_ADMIN' && user.documentNumber !== currentUser.documentNumber && user.status === 'INACTIVE' && (
                                  <Tooltip title="Habilitar">
                            <IconButton
                              size="small"
                                      onClick={() => handleEnableUser(user.documentNumber)}
                                      sx={{ color: '#4CAF50' }}
                            >
                                      <RefreshIcon />
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
        </CardContent>
      </Card>

      {/* Diálogo de selección de columnas */}

      <MuiDialog open={columnsDialogOpen} onClose={() => setColumnsDialogOpen(false)} maxWidth="sm" fullWidth>
        <MuiDialogTitle>Configurar Columnas</MuiDialogTitle>
        <MuiDialogContent>
          <FormGroup>
            {columnsConfig.map((col, index) => (
              <Box
                key={col.key}
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
                      checked={col.defaultVisible}
                      onChange={() => handleToggleColumn(col.key)}
                    />
                  }
                  label={col.label}
                  sx={{ flex: 1 }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    disabled={index === 0}
                    onClick={() => {
                      if (index > 0) {
                        handleMoveColumn(index, index - 1);
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
                        handleMoveColumn(index, index + 1);
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
            borderRadius: 1,
            maxHeight: '90vh',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          },
        }}
      >
        <ModalHeader
          title={
            isBulkEditMode 
              ? `Editar ${selectedUsers.length} Usuarios` 
              : isEditMode 
                ? 'Editar Usuario' 
                : 'Crear Nuevo Usuario'
          }
          onClose={handleCloseModal}
          gradientColor="orange"
        />
        <DialogContent sx={{ p: 0 }}>
          <UserForm
            initialData={selectedUser || undefined}
            selectedUsers={isBulkEditMode ? selectedUsers : []}
            onCancel={handleCloseModal}
            onSave={handleUserSaved}
            isEditMode={isEditMode}
            isBulkEdit={isBulkEditMode}
          />
        </DialogContent>
      </Dialog>

      {/* Menú de exportación */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={() => { exportToCSV('es'); setExportMenuAnchor(null); }}>
          Exportar a CSV (Español)
            </MenuItem>
        <MenuItem onClick={() => { exportToCSV('en'); setExportMenuAnchor(null); }}>
          Exportar a CSV (English)
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


      {/* Menú de importación */}
      <Menu
        anchorEl={importMenuAnchor}
        open={Boolean(importMenuAnchor)}
        onClose={() => setImportMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.csv,.xlsx,.xls';
          input.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files[0]) {
              const file = target.files[0];
              const reader = new FileReader();
              reader.onload = (event) => {
                try {
                  const csvContent = event.target?.result as string;
                  const lines = csvContent.split('\n');
                  const headers = lines[0].split(',');
                  
                  // Mapeo completo de headers (español/inglés a formato estándar)
                  const headerMapping: { [key: string]: string } = {
                    // Username/Usuario
                    'username': 'username',
                    'user': 'username',
                    'usuario': 'username',
                    'nombre de usuario': 'username',
                    'nombre usuario': 'username',
                    'user_name': 'username',
                    
                    // Nombres
                    'firstname': 'firstName',
                    'first_name': 'firstName',
                    'nombre': 'firstName',
                    'name': 'firstName',
                    
                    // Apellidos
                    'lastname': 'lastName',
                    'last_name': 'lastName',
                    'apellido': 'lastName',
                    'apellidos': 'lastName',
                    'surname': 'lastName',
                    
                    // Email/Correo
                    'email': 'email',
                    'correo': 'email',
                    'mail': 'email',
                    'e-mail': 'email',
                    'correo electronico': 'email',
                    'correo electrónico': 'email',
                    
                    // Tipo de documento
                    'documenttype': 'documentType',
                    'document_type': 'documentType',
                    'document type': 'documentType',
                    'tipo de documento': 'documentType',
                    'tipo documento': 'documentType',
                    'tipodocumento': 'documentType',
                    'type': 'documentType',
                    'tipo': 'documentType',
                    
                    // Número de documento
                    'documentnumber': 'documentNumber',
                    'document_number': 'documentNumber',
                    'document number': 'documentNumber',
                    'numero de documento': 'documentNumber',
                    'numero documento': 'documentNumber',
                    'numerodocumento': 'documentNumber',
                    'number': 'documentNumber',
                    'numero': 'documentNumber',
                    'id': 'documentNumber',
                    'identification': 'documentNumber',
                    'identificacion': 'documentNumber',
                    
                    // Contraseña/Password
                    'password': 'password',
                    'contraseña': 'password',
                    'contraseÃ±a': 'password', // Con encoding incorrecto
                    'pass': 'password',
                    'pwd': 'password',
                    'clave': 'password',
                    
                    // Rol/Role
                    'role': 'role',
                    'rol': 'role',
                    'cargo_sistema': 'role',
                    'user_role': 'role',
                    
                    // Teléfono (OPCIONAL)
                    'phone': 'phone',
                    'telefono': 'phone',
                    'teléfono': 'phone',
                    'tel': 'phone',
                    'mobile': 'phone',
                    'movil': 'phone',
                    'móvil': 'phone',
                    'celular': 'phone',
                    
                    // Campos opcionales adicionales
                    'status': 'status',
                    'estado': 'status',
                    'active': 'status',
                    'activo': 'status',
                    
                    'company': 'company',
                    'empresa': 'company',
                    'compañia': 'company',
                    'compania': 'company',
                    
                    'headquarters': 'headquarters',
                    'sede': 'headquarters',
                    'sucursal': 'headquarters',
                    'oficina': 'headquarters',
                    
                    'jobtitle': 'jobTitle',
                    'job_title': 'jobTitle',
                    'job title': 'jobTitle',
                    'cargo': 'jobTitle',
                    'puesto': 'jobTitle',
                    'position': 'jobTitle',
                    
                    'country': 'residenceCountry',
                    'pais': 'residenceCountry',
                    'país': 'residenceCountry',
                    'residencecountry': 'residenceCountry',
                    'residence_country': 'residenceCountry',
                    
                    'state': 'residenceState',
                    'departamento': 'residenceState',
                    'estado_residencia': 'residenceState',
                    'province': 'residenceState',
                    'provincia': 'residenceState',
                    'residencestate': 'residenceState',
                    'residence_state': 'residenceState',
                    
                    'city': 'residenceCity',
                    'ciudad': 'residenceCity',
                    'municipio': 'residenceCity',
                    'residencecity': 'residenceCity',
                    'residence_city': 'residenceCity',
                    
                    'address': 'addressLine1',
                    'address1': 'addressLine1',
                    'direccion': 'addressLine1',
                    'direccion1': 'addressLine1',
                    'dirección': 'addressLine1',
                    'dirección1': 'addressLine1',
                    'addressline1': 'addressLine1',
                    'address_line1': 'addressLine1',
                    
                    'address2': 'addressLine2',
                    'direccion2': 'addressLine2',
                    'dirección2': 'addressLine2',
                    'addressline2': 'addressLine2',
                    'address_line2': 'addressLine2',
                    
                    'comment': 'commentary',
                    'comments': 'commentary',
                    'comentario': 'commentary',
                    'comentarios': 'commentary',
                    'observaciones': 'commentary',
                    'notas': 'commentary',
                    'notes': 'commentary',
                    'commentary': 'commentary'
                  };

                  // Normalizar headers
                  const normalizedHeaders = headers.map(header => {
                    const cleanHeader = header.trim().toLowerCase().replace(/\r/g, '');
                    return headerMapping[cleanHeader] || cleanHeader;
                  });

                  console.log('Headers originales:', headers);
                  console.log('Headers normalizados:', normalizedHeaders);

                  // Validar solo los campos obligatorios (más flexible)
                  const requiredHeaders = ['username', 'firstName', 'lastName', 'email', 'documentType', 'documentNumber', 'password'];
                  const missingHeaders = requiredHeaders.filter(h => !normalizedHeaders.includes(h));
                  
                  if (missingHeaders.length > 0) {
                    const headerMappingInfo = {
                      'username': 'username, usuario, user, nombre de usuario',
                      'firstName': 'firstName, nombre, name, first_name',
                      'lastName': 'lastName, apellido, surname, last_name',
                      'email': 'email, correo, mail, e-mail',
                      'documentType': 'documentType, tipo de documento, document_type, tipo',
                      'documentNumber': 'documentNumber, numero de documento, document_number, numero, id',
                      'password': 'password, contraseña, pass, clave'
                    };
                    
                    const missingHeadersInfo = missingHeaders.map(header => 
                      `❌ ${header} (acepta: ${headerMappingInfo[header as keyof typeof headerMappingInfo]})`
                    );
                    
                    setMessage({ 
                      type: 'error', 
                      text: `⚠️ CAMPOS OBLIGATORIOS FALTANTES:\n\n${missingHeadersInfo.join('\n')}\n\n📋 Headers encontrados: ${headers.join(', ')}\n\n✅ Headers reconocidos: ${normalizedHeaders.filter(h => requiredHeaders.includes(h)).join(', ')}\n\n💡 Los demás campos son opcionales y se pueden dejar vacíos.` 
                    });
                    return;
                  }

                  // Process CSV data
                  const usersData = lines.slice(1).filter(line => line.trim()).map(line => {
                    const values = line.split(',').map(val => val.trim().replace(/\r/g, '').replace(/^"|"$/g, ''));
                    const user: any = {};
                    normalizedHeaders.forEach((normalizedHeader, index) => {
                      if (normalizedHeader) {
                        user[normalizedHeader] = values[index] || '';
                      }
                    });
                    // Generar username automáticamente si no existe
                    if (!user.username && user.email) {
                      user.username = user.email.split('@')[0];
                    }
                    return user;
                  });

                  console.log('Users to import:', usersData);
                  
                  // Validación detallada de datos requeridos
                  const validationErrors: string[] = [];
                  const validUsers = usersData.filter((user, index) => {
                    const rowNumber = index + 2; // +2 porque index empieza en 0 y la primera línea son headers
                    const userErrors: string[] = [];
                    
                    // CAMPOS OBLIGATORIOS (validación estricta)
                    if (!user.username || user.username.trim() === '') {
                      userErrors.push('username');
                    }
                    if (!user.firstName || user.firstName.trim() === '') {
                      userErrors.push('firstName/nombre');
                    }
                    if (!user.lastName || user.lastName.trim() === '') {
                      userErrors.push('lastName/apellido');
                    }
                    if (!user.email || user.email.trim() === '') {
                      userErrors.push('email');
                    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
                      userErrors.push('email (formato inválido)');
                    }
                    if (!user.documentType || user.documentType.trim() === '') {
                      userErrors.push('documentType/tipo de documento');
                    }
                    if (!user.documentNumber || user.documentNumber.trim() === '') {
                      userErrors.push('documentNumber/número de documento');
                    }
                    if (!user.password || user.password.trim() === '') {
                      userErrors.push('password/contraseña');
                    }
                    
                    // ASIGNAR ROL POR DEFECTO si no se proporciona
                    if (!user.role || user.role.trim() === '') {
                      user.role = 'USER'; // Rol por defecto
                    }
                    
                    // VALIDACIONES OPCIONALES (solo si se proporcionan los campos)
                    
                    // Validar tipo de documento si se proporciona
                    if (user.documentType) {
                      const validDocumentTypes = ['CEDULA', 'CEDULA_EXTRANJERIA', 'TARJETA_IDENTIDAD', 'PASSPORT', 'NIT', 'RUT'];
                      if (!validDocumentTypes.includes(user.documentType.toUpperCase())) {
                        // Asignar valor por defecto si es inválido
                        user.documentType = 'CEDULA';
                        console.warn(`Tipo de documento inválido en fila ${rowNumber}, asignado 'CEDULA' por defecto`);
                      }
                    }
                    
                    // Validar rol si se proporciona (si no, ya se asignó USER por defecto)
                    if (user.role) {
                      const validRoles = ['SUPER_ADMIN', 'ADMIN', 'USER', 'SUPERVISOR'];
                      if (!validRoles.includes(user.role.toUpperCase())) {
                        user.role = 'USER';
                        console.warn(`Rol inválido en fila ${rowNumber}, asignado 'USER' por defecto`);
                      }
                    }
                    
                    // Validar estado si se proporciona (opcional)
                    if (user.status) {
                      const validStatuses = ['ACTIVE', 'INACTIVE', 'ACTIVO', 'INACTIVO'];
                      if (!validStatuses.includes(user.status.toUpperCase())) {
                        user.status = 'ACTIVE';
                        console.warn(`Estado inválido en fila ${rowNumber}, asignado 'ACTIVE' por defecto`);
                      }
                      // Normalizar a formato estándar
                      if (user.status.toUpperCase() === 'ACTIVO') user.status = 'ACTIVE';
                      if (user.status.toUpperCase() === 'INACTIVO') user.status = 'INACTIVE';
                    }
                    
                    if (userErrors.length > 0) {
                      validationErrors.push(`Fila ${rowNumber} (${user.firstName || 'Sin nombre'} ${user.lastName || 'Sin apellido'}): ${userErrors.join(', ')}`);
                      return false;
                    }
                    
                    return true;
                  });

                  if (validUsers.length === 0) {
                    const errorMessage = validationErrors.length > 0 
                      ? `Errores de validación encontrados:\n${validationErrors.slice(0, 10).join('\n')}${validationErrors.length > 10 ? `\n... y ${validationErrors.length - 10} errores más` : ''}`
                      : 'No se encontraron usuarios válidos para importar. Verifica que todos los campos requeridos estén completos.';
                    
                    setMessage({ 
                      type: 'error', 
                      text: errorMessage
                    });
                    return;
                  }

                  if (validUsers.length !== usersData.length) {
                    const warningMessage = `${validUsers.length} de ${usersData.length} usuarios son válidos. Se importarán solo los usuarios válidos.\n\nErrores encontrados:\n${validationErrors.slice(0, 5).join('\n')}${validationErrors.length > 5 ? `\n... y ${validationErrors.length - 5} errores más` : ''}`;
                    
                    setMessage({ 
                      type: 'warning', 
                      text: warningMessage
                    });
                  }

                  // Importar usuarios uno por uno
                  try {
                    setLoading(true);
                    let successCount = 0;
                    let errorCount = 0;
                    const importPromises = [];

                    for (const userData of validUsers) {
                      try {
                        // Preparar datos para la API
                        const importData = {
                          username: userData.username,
                          firstName: userData.firstName,
                          lastName: userData.lastName,
                          email: userData.email,
                          documentType: userData.documentType.toUpperCase(),
                          documentNumber: userData.documentNumber,
                          phone: userData.phone || null,
                          role: (userData.role || 'USER').toUpperCase(),
                          status: userData.status || 'ACTIVE',
                          company: userData.company || null,
                          headquarters: userData.headquarters || null,
                          jobTitle: userData.jobTitle || null,
                          residenceCountry: userData.residenceCountry || null,
                          residenceState: userData.residenceState || null,
                          residenceCity: userData.residenceCity || null,
                          addressLine1: userData.addressLine1 || null,
                          addressLine2: userData.addressLine2 || null,
                          commentary: userData.commentary || null,
                          password: userData.password || 'Password123!' // Usar password del CSV o temporal
                        };

                        console.log('Token de autenticación:', localStorage.getItem('accessToken'));
                        const importPromise = api.post('/users', importData)
                          .then(() => {
                            successCount++;
                            console.log(`Usuario importado exitosamente: ${userData.firstName} ${userData.lastName}`);
                          })
                          .catch((error) => {
                            console.error('Error importing user:', userData, error);
                            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.response?.data?.errors || error.message || 'Error desconocido';
                            console.error(`Error específico para ${userData.firstName} ${userData.lastName}:`, errorMessage);
                            console.error('Response completa del error:', error.response?.data);
                            console.error('Status del error:', error.response?.status);
                            errorCount++;
                          });

                        importPromises.push(importPromise);
                      } catch (error) {
                        console.error('Error preparing user data:', userData, error);
                        errorCount++;
                      }
                    }

                    // Esperar a que todas las importaciones terminen
                    Promise.all(importPromises).then(() => {
                      let messageText = `Importación completada: ${successCount} usuarios importados exitosamente`;
                      
                      if (errorCount > 0) {
                        messageText += `, ${errorCount} errores`;
                        if (successCount === 0) {
                          setMessage({
                            type: 'error',
                            text: `Importación fallida: ${errorCount} errores. Revisa la consola del navegador (F12) para ver los errores específicos del backend.`
                          });
                        } else {
                          setMessage({
                            type: 'warning',
                            text: messageText + '. Revisa la consola del navegador (F12) para detalles de errores.'
                          });
                        }
                      } else {
                        setMessage({
                          type: 'success',
                          text: messageText
                        });
                      }

                      // Recargar la lista de usuarios después de un breve delay
                      setTimeout(() => {
                        loadUsers();
                      }, 1000);
                    });

                  } catch (error) {
                    console.error('Error during import:', error);
                    setMessage({ 
                      type: 'error', 
                      text: 'Error durante la importación de usuarios' 
                    });
                  } finally {
                    setLoading(false);
                  }
                  
                } catch (error) {
                  console.error('Error processing CSV:', error);
                  setMessage({ 
                    type: 'error', 
                    text: 'Error al procesar el archivo CSV' 
                  });
                }
              };
              reader.readAsText(file);
            }
          };
          input.click();
          setImportMenuAnchor(null);
        }}>
          Cargar archivo
        </MenuItem>
        <MenuItem onClick={() => {
          downloadTemplate('es');
          setImportMenuAnchor(null);
        }}>
          Descargar plantilla (Español)
        </MenuItem>
        <MenuItem onClick={() => {
          downloadTemplate('en');
          setImportMenuAnchor(null);
        }}>
          Descargar plantilla (English)
        </MenuItem>
      </Menu>

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

      {/* View Dialog */}
      {selectedUser && (
        <ViewDialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          onEdit={handleEditFromView}
          title={`Usuario: ${selectedUser.firstName} ${selectedUser.lastName}`}
          data={selectedUser}
          type="user"
        />
      )}
    </Box>
  );
});

export default UserList;
