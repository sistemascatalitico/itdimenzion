import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  Chip,
  Tooltip,
  IconButton,
  Dialog,
} from '@mui/material';
import {
  NotificationImportant as RecommendedIcon,
  Lock as LockIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../../../config/api';
import EntitySelectorWithActions from './EntitySelectorWithActions';
import UserForm from '../../users/UserForm';
import CompanyForm from '../../companies/CompanyForm';
import HeadquartersForm from '../../companies/HeadquartersForm';
import ProcessForm from '../../companies/ProcessForm';
import JobTitleForm from '../../companies/JobTitleForm';
import SupplierForm from '../../suppliers/SupplierForm';
import AssetManufacturerForm from '../AssetManufacturerForm';
import AssetModelForm from '../AssetModelForm';
import assetCatalogService from '../../../services/assetCatalogService';
import { companyService, Company } from '../../../services/companyService';
import { headquartersService, Headquarters } from '../../../services/headquartersService';
import { processService, Process } from '../../../services/processService';
import { jobTitleService, JobTitle } from '../../../services/jobTitleService';

interface UniversalFieldsTabProps {
  fields: any[];
  values: Record<string, any>;
  errors: Record<string, string>;
  onChange: (key: string, value: any) => void;
  preFilled?: {
    categoryId?: number | null;
    groupId?: number | null;
    typeId?: number | null;
  };
  // Valores de jerarquía desde el paso 1 (para filtrado)
  hierarchyValues?: {
    categoryId?: number | null;
    groupId?: number | null;
    typeId?: number | null;
  };
  loading?: boolean;
}

const UniversalFieldsTab: React.FC<UniversalFieldsTabProps> = ({
  fields,
  values,
  errors,
  onChange,
  preFilled,
  hierarchyValues,
  loading = false,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados para modales
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [headquartersModalOpen, setHeadquartersModalOpen] = useState(false);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [jobTitleModalOpen, setJobTitleModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [manufacturerModalOpen, setManufacturerModalOpen] = useState(false);
  const [modelModalOpen, setModelModalOpen] = useState(false);

  // Estados para datos
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [headquarters, setHeadquarters] = useState<Headquarters[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Campos recomendados (marcados con 🔔)
  const recommendedFields = ['assetCode', 'serialNumber', 'assignedUserId', 'processId', 'jobTitleId', 'purchaseDate', 'warrantyExpiration'];
  
  // Campos bloqueados (readonly)
  const lockedFields = ['jobTitleId']; // Se bloquea si viene del usuario

  // Cargar datos
  const loadUsers = useCallback(async () => {
    try {
      // Usar exactamente los mismos parámetros que UserList.tsx (línea 211)
      const response = await api.get('/users', { 
        params: { 
          status: 'ACTIVE'
        },
        timeout: 10000
      });
      
      // El endpoint devuelve { users: [...], pagination: {...}, managedRoles: [...] }
      // Ver enhancedUsers.ts línea 209-218
      const list = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.users)
          ? response.data.users
          : Array.isArray(response.data?.data)
            ? response.data.data
            : [];
      
      setUsers(list);
      console.log('✅ Usuarios cargados:', list.length);
      console.log('✅ Estructura de respuesta:', {
        hasData: !!response.data,
        hasUsers: !!response.data?.users,
        hasDataProp: !!response.data?.data,
        isArray: Array.isArray(response.data),
        keys: response.data ? Object.keys(response.data) : [],
        pagination: response.data?.pagination,
        managedRoles: response.data?.managedRoles
      });
      
      if (list.length > 0) {
        console.log('✅ Primer usuario ejemplo:', {
          name: `${list[0].firstName} ${list[0].lastName}`,
          company: list[0].company,
          headquarters: list[0].headquarters,
          companyId: list[0].company?.id,
          headquartersId: list[0].headquarters?.id,
          process: list[0].process,
          jobTitle: list[0].jobTitle
        });
      } else {
        console.warn('⚠️ No se cargaron usuarios. Verifica:');
        console.warn('  - ¿Hay usuarios activos en la base de datos?');
        console.warn('  - ¿El usuario actual tiene permisos para ver usuarios?');
        console.warn('  - Respuesta completa:', response.data);
      }
    } catch (error: any) {
      console.error('❌ Error loading users:', error);
      console.error('❌ Error response:', error.response?.data);
    }
  }, []);

  const loadCompanies = useCallback(async () => {
    try {
      const data = await companyService.getAll();
      setCompanies(data);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  }, []);

  const loadHeadquarters = useCallback(async () => {
    try {
      const data = await headquartersService.getAll();
      setHeadquarters(data);
    } catch (error) {
      console.error('Error loading headquarters:', error);
    }
  }, []);

  const loadProcesses = useCallback(async () => {
    try {
      const data = await processService.getAll();
      setProcesses(data);
    } catch (error) {
      console.error('Error loading processes:', error);
    }
  }, []);

  const loadJobTitles = useCallback(async () => {
    try {
      const data = await jobTitleService.getAll();
      setJobTitles(data);
    } catch (error) {
      console.error('Error loading job titles:', error);
    }
  }, []);

  const loadSuppliers = useCallback(async () => {
    try {
      const response = await api.get('/suppliers', { params: { status: 'ACTIVE' } });
      setSuppliers(Array.isArray(response.data) ? response.data : response.data?.data || []);
    } catch (error: any) {
      // Si el endpoint no existe (404), simplemente no cargar suppliers
      if (error.response?.status === 404) {
        console.log('Suppliers endpoint not available, skipping...');
        setSuppliers([]);
      } else {
        console.error('Error loading suppliers:', error);
      }
    }
  }, []);

  const loadManufacturers = useCallback(async () => {
    try {
      // Usar categoryId del paso 1 (hierarchyValues) o preFilled, nunca de values
      const categoryId = hierarchyValues?.categoryId || preFilled?.categoryId || null;
      
      if (!categoryId) {
        // Si no hay categoría, no cargar fabricantes
        setManufacturers([]);
        return;
      }
      
      const data = await assetCatalogService.getManufacturers({ 
        status: 'ACTIVE',
        category: categoryId  // El backend espera 'category', no 'categoryId'
      });
      setManufacturers(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('Error loading manufacturers:', error);
      setManufacturers([]);
    }
  }, [hierarchyValues?.categoryId, preFilled?.categoryId]);

  const loadModels = useCallback(async () => {
    try {
      const typeId = hierarchyValues?.typeId || preFilled?.typeId || null;
      const manufacturerId = values.manufacturerId || null;

      if (!manufacturerId && !typeId) {
        setModels([]);
        return;
      }

      const params: Record<string, any> = { status: 'ACTIVE' };

      if (manufacturerId) {
        params.manufacturerId = manufacturerId;
      }
      if (typeId && !manufacturerId) {
        params.typeId = typeId;
      }

      const data = await assetCatalogService.getModels(params);
      const modelsList = Array.isArray(data) ? data : data?.data || [];

      setModels(modelsList);
    } catch (error) {
      console.error('Error loading models:', error);
      setModels([]);
    }
  }, [hierarchyValues?.typeId, preFilled?.typeId, values.manufacturerId]);

  // Cargar todos los datos al montar
  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      loadUsers(),
      loadCompanies(),
    loadHeadquarters(),
    loadProcesses(),
    loadJobTitles(),
    loadSuppliers(),
    loadManufacturers(),
    loadModels()
    ]).finally(() => setLoadingData(false));
  }, [loadUsers, loadCompanies, loadHeadquarters, loadProcesses, loadJobTitles, loadSuppliers, loadManufacturers, loadModels]);

  // Auto-completar desde Usuario
  useEffect(() => {
    if (values.assignedUserId) {
      const selectedUser = users.find(u => u.id === values.assignedUserId || u.documentNumber === values.assignedUserId);
      if (selectedUser) {
        if (selectedUser.company?.id && !values.companyId) {
          onChange('companyId', selectedUser.company.id);
        }
        if (selectedUser.headquarters?.id && !values.headquartersId) {
          onChange('headquartersId', selectedUser.headquarters.id);
        }
        if (selectedUser.process?.id && !values.processId) {
          onChange('processId', selectedUser.process.id);
        }
        if (selectedUser.jobTitle?.id && !values.jobTitleId) {
          onChange('jobTitleId', selectedUser.jobTitle.id);
        }
      }
    }
  }, [values.assignedUserId, users, values.companyId, values.headquartersId, values.processId, values.jobTitleId, onChange]);

  // Recargar modelos cuando cambia typeId o manufacturerId
  useEffect(() => {
    const typeId = hierarchyValues?.typeId || preFilled?.typeId;
    if (typeId) {
      loadModels();
    } else {
      setModels([]);
    }
  }, [hierarchyValues?.typeId, preFilled?.typeId, values.manufacturerId, loadModels]);

  // Recargar fabricantes cuando cambia categoryId
  useEffect(() => {
    const categoryId = hierarchyValues?.categoryId || preFilled?.categoryId;
    if (categoryId) {
      loadManufacturers();
    } else {
      setManufacturers([]);
    }
  }, [hierarchyValues?.categoryId, preFilled?.categoryId, loadManufacturers]);
  
  // Recargar modelos cuando cambia manufacturerId
  useEffect(() => {
    if (values.manufacturerId) {
      loadModels();
    }
  }, [values.manufacturerId, loadModels]);

  // Handlers para modales
  const handleUserCreated = async () => {
    await loadUsers();
    setUserModalOpen(false);
  };

  const handleCompanyCreated = async (formData: any) => {
    try {
      await companyService.create(formData);
      await loadCompanies();
      setCompanyModalOpen(false);
    } catch (error) {
      console.error('Error creating company:', error);
    }
  };

  const handleHeadquartersCreated = async (formData: any) => {
    try {
      await headquartersService.create(formData);
      await loadHeadquarters();
      setHeadquartersModalOpen(false);
    } catch (error) {
      console.error('Error creating headquarters:', error);
    }
  };

  const handleProcessCreated = async (formData: any) => {
    try {
      await processService.create(formData);
      await loadProcesses();
      setProcessModalOpen(false);
    } catch (error) {
      console.error('Error creating process:', error);
    }
  };

  const handleJobTitleCreated = async (formData: any) => {
    try {
      await jobTitleService.create(formData);
      await loadJobTitles();
      setJobTitleModalOpen(false);
    } catch (error) {
      console.error('Error creating job title:', error);
    }
  };

  const handleSupplierCreated = async (formData: any) => {
    try {
      // Asegurar que companyId esté presente
      const supplierData = {
        ...formData,
        companyId: formData.companyId || (user as any)?.company?.id || (user as any)?.companyId,
      };
      
      const response = await api.post('/suppliers', supplierData);
      
      // Si el proveedor se creó exitosamente, actualizar el selector
      if (response.data?.id) {
        await loadSuppliers();
        // Opcionalmente, seleccionar el proveedor recién creado
        onChange('supplierId', response.data.id);
      }
      
      setSupplierModalOpen(false);
    } catch (error: any) {
      console.error('Error creating supplier:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error al crear el proveedor';
      alert(`Error: ${errorMessage}`); // TODO: Reemplazar con un sistema de notificaciones mejor
    }
  };

  const handleManufacturerCreated = async () => {
    await loadManufacturers();
    setManufacturerModalOpen(false);
  };

  const handleModelCreated = async () => {
    await loadModels();
    setModelModalOpen(false);
  };

  const renderField = (field: any) => {
    const isRecommended = recommendedFields.includes(field.key);
    const isLocked = lockedFields.includes(field.key) && values[field.key];
    const hasError = errors[field.key];
    const value = values[field.key] || field.defaultValue || '';

    // Si viene prellenado y es readonly
    if (preFilled && ['categoryId', 'groupId', 'typeId'].includes(field.key)) {
      return null; // Ocultar si viene prellenado
    }

    // Auto-completar companyId desde usuario si no está
    if (field.key === 'companyId' && !value && user?.company?.id) {
      onChange('companyId', user.company.id);
    }

    switch (field.type) {
      case 'TEXT':
      case 'TEXTAREA':
        return (
          <TextField
            key={field.key}
            label={field.label}
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            required={field.isRequired}
            disabled={isLocked || loading}
            error={!!hasError}
            helperText={hasError || field.helpText}
            multiline={field.type === 'TEXTAREA'}
            rows={field.type === 'TEXTAREA' ? 4 : 1}
            fullWidth
            InputProps={{
              endAdornment: isRecommended && !isLocked && (
                <Tooltip title="Campo recomendado para mejor trazabilidad">
                  <IconButton size="small">
                    <RecommendedIcon sx={{ color: '#FF6B9D', fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              ),
              startAdornment: isLocked && (
                <LockIcon sx={{ color: 'action.disabled', mr: 1 }} />
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': isRecommended && !isLocked ? {
                '&:hover fieldset': {
                  borderColor: '#FF6B9D',
                  borderWidth: 2
                },
                backgroundColor: isRecommended && !values[field.key] ? 'rgba(255, 107, 157, 0.05)' : undefined
              } : {}
            }}
          />
        );

      case 'NUMBER':
      case 'DECIMAL':
        return (
          <TextField
            key={field.key}
            label={`${field.label}${field.unit_of_measure ? ` (${field.unit_of_measure})` : ''}`}
            type="number"
            value={value}
            onChange={(e) => onChange(field.key, e.target.value ? Number(e.target.value) : null)}
            required={field.isRequired}
            disabled={isLocked || loading}
            error={!!hasError}
            helperText={hasError || field.helpText}
            fullWidth
            InputProps={{
              endAdornment: isRecommended && !isLocked && (
                <Tooltip title="Campo recomendado">
                  <IconButton size="small">
                    <RecommendedIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              ),
            }}
          />
        );

      case 'DATE':
      case 'DATETIME':
        return (
          <TextField
            key={field.key}
            label={field.label}
            type={field.type === 'DATE' ? 'date' : 'datetime-local'}
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value || null)}
            required={field.isRequired}
            disabled={isLocked || loading}
            error={!!hasError}
            helperText={hasError || field.helpText}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              endAdornment: isRecommended && !isLocked && (
                <Tooltip title="Campo recomendado">
                  <IconButton size="small">
                    <RecommendedIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              ),
            }}
          />
        );

      case 'SELECT':
        return (
          <FormControl
            key={field.key}
            fullWidth
            required={field.isRequired}
            disabled={isLocked || loading}
            error={!!hasError}
          >
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value || ''}
              label={field.label}
              onChange={(e) => onChange(field.key, e.target.value)}
            >
              {field.options?.map((opt: any) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
            {(hasError || field.helpText) && (
              <Typography variant="caption" color={hasError ? 'error' : 'text.secondary'} sx={{ mt: 0.5, ml: 1.5 }}>
                {hasError || field.helpText}
              </Typography>
            )}
          </FormControl>
        );

      case 'USER_SELECT':
        // Filtrar usuarios por empresa y/o sede si hay alguna seleccionada
        let filteredUsers = users;
        
        if (values.companyId) {
          filteredUsers = filteredUsers.filter(u => {
            // Verificar diferentes estructuras posibles de company
            const userCompanyId = u.company?.id || u.companyId || (typeof u.company === 'number' ? u.company : null);
            const matches = userCompanyId === values.companyId || Number(userCompanyId) === Number(values.companyId);
            if (!matches && u.company) {
              console.log('🔍 Usuario no coincide:', {
                userName: `${u.firstName} ${u.lastName}`,
                userCompanyId,
                userCompany: u.company,
                selectedCompanyId: values.companyId,
                typeMatch: typeof userCompanyId === typeof values.companyId
              });
            }
            return matches;
          });
          console.log(`✅ Usuarios filtrados por empresa ${values.companyId}:`, filteredUsers.length, 'de', users.length);
        }
        
        if (values.headquartersId && filteredUsers.length > 0) {
          const beforeFilter = filteredUsers.length;
          filteredUsers = filteredUsers.filter(u => {
            // Verificar diferentes estructuras posibles de headquarters
            const userHeadquartersId = u.headquarters?.id || u.headquartersId || (typeof u.headquarters === 'number' ? u.headquarters : null);
            return userHeadquartersId === values.headquartersId || Number(userHeadquartersId) === Number(values.headquartersId);
          });
          console.log(`✅ Usuarios filtrados por sede ${values.headquartersId}:`, filteredUsers.length, 'de', beforeFilter);
        }
        
        // Si no hay filtros, mostrar todos
        if (!values.companyId && !values.headquartersId) {
          console.log('✅ Mostrando todos los usuarios (sin filtros):', filteredUsers.length);
        }
        
        return (
          <EntitySelectorWithActions
            key={field.key}
            label={field.label}
            value={value}
            onChange={(val) => {
              onChange(field.key, val);
              // Si se limpia el usuario, limpiar también los campos dependientes
              if (!val) {
                onChange('companyId', null);
                onChange('headquartersId', null);
                onChange('processId', null);
                onChange('jobTitleId', null);
              }
            }}
            options={filteredUsers.map(u => ({ 
              id: u.id || u.documentNumber, 
              name: `${u.firstName} ${u.lastName}`, 
              label: `${u.firstName} ${u.lastName} (${u.email})` 
            }))}
            required={field.isRequired}
            disabled={isLocked || loading || loadingData}
            error={!!hasError}
            helperText={hasError || field.helpText || (values.companyId || values.headquartersId ? `Usuarios filtrados${values.companyId ? ' por empresa' : ''}${values.headquartersId ? ' y sede' : ''}` : 'Al seleccionar, se auto-completarán Empresa, Sede, Proceso y Cargo')}
            loading={loadingData}
            onInfoClick={() => navigate('/users/list')}
            onCreateClick={() => setUserModalOpen(true)}
            infoTooltip="Ver todos los usuarios"
            createTooltip="Crear nuevo usuario"
          />
        );

      case 'COMPANY_SELECT':
        return (
          <EntitySelectorWithActions
            key={field.key}
            label={field.label}
            value={value}
            onChange={(val) => {
              onChange(field.key, val);
              // Si se cambia la empresa, limpiar sede y procesos relacionados
              if (!val || (val !== value)) {
                onChange('headquartersId', null);
                onChange('processId', null);
                onChange('jobTitleId', null);
              }
            }}
            options={companies.map(c => ({ id: c.id, name: c.name, label: c.name }))}
            required={field.isRequired}
            disabled={isLocked || loading || loadingData || !!values.assignedUserId}
            error={!!hasError}
            helperText={hasError || field.helpText || (values.assignedUserId ? 'Se auto-completa desde el Usuario Asignado' : 'Se implementará selector especializado')}
            loading={loadingData}
            onInfoClick={() => navigate('/companies')}
            onCreateClick={() => setCompanyModalOpen(true)}
            infoTooltip="Ver todas las empresas"
            createTooltip="Crear nueva empresa"
            canCreate={!values.assignedUserId} // Solo si no hay usuario seleccionado
          />
        );

      case 'HEADQUARTERS_SELECT':
        return (
          <EntitySelectorWithActions
            key={field.key}
            label={field.label}
            value={value}
            onChange={(val) => onChange(field.key, val)}
            options={headquarters
              .filter(h => !values.companyId || h.companyId === values.companyId)
              .map(h => ({ id: h.id, name: h.name, label: h.name }))}
            required={field.isRequired}
            disabled={isLocked || loading || loadingData || !values.companyId || !!values.assignedUserId}
            error={!!hasError}
            helperText={hasError || field.helpText || (values.assignedUserId ? 'Se auto-completa desde el Usuario Asignado' : !values.companyId ? 'Selecciona primero una Empresa' : 'Se implementará selector especializado')}
            loading={loadingData}
            onInfoClick={() => navigate('/headquarters')}
            onCreateClick={() => setHeadquartersModalOpen(true)}
            infoTooltip="Ver todas las sedes"
            createTooltip="Crear nueva sede"
            canCreate={!!values.companyId && !values.assignedUserId}
          />
        );

      case 'PROCESS_SELECT':
        return (
          <EntitySelectorWithActions
            key={field.key}
            label={field.label}
            value={value}
            onChange={(val) => {
              onChange(field.key, val);
              // Si se cambia el proceso, limpiar cargo
              if (!val || (val !== value)) {
                onChange('jobTitleId', null);
              }
            }}
            options={processes
              .filter(p => !values.companyId || p.companyId === values.companyId)
              .map(p => ({ id: p.id, name: p.name, label: p.name }))}
            required={field.isRequired}
            disabled={isLocked || loading || loadingData || !!values.assignedUserId || !values.companyId}
            error={!!hasError}
            helperText={hasError || field.helpText || (values.assignedUserId ? 'Se auto-completa desde el Usuario Asignado' : !values.companyId ? 'Selecciona primero una Empresa' : 'Se implementará selector especializado')}
            loading={loadingData}
            onInfoClick={() => navigate('/processes')}
            onCreateClick={() => setProcessModalOpen(true)}
            infoTooltip="Ver todos los procesos"
            createTooltip="Crear nuevo proceso"
            canCreate={!!values.companyId && !values.assignedUserId}
          />
        );

      case 'JOB_TITLE_SELECT':
        return (
          <EntitySelectorWithActions
            key={field.key}
            label={field.label}
            value={value}
            onChange={(val) => onChange(field.key, val)}
            options={jobTitles
              .filter(jt => !values.processId || jt.processId === values.processId)
              .map(jt => ({ id: jt.id, name: jt.name, label: jt.name }))}
            required={field.isRequired}
            disabled={isLocked || loading || loadingData || !!values.assignedUserId || !values.processId}
            error={!!hasError}
            helperText={hasError || field.helpText || (values.assignedUserId ? 'Se auto-completa desde el Usuario Asignado y está bloqueado' : !values.processId ? 'Selecciona primero un Proceso' : 'Selecciona primero un Usuario o Proceso')}
            loading={loadingData}
            onInfoClick={() => navigate('/job-titles')}
            onCreateClick={() => setJobTitleModalOpen(true)}
            infoTooltip="Ver todos los cargos"
            createTooltip="Crear nuevo cargo"
            canCreate={!values.assignedUserId && !!values.processId}
          />
        );

      case 'SUPPLIER_SELECT':
        return (
          <EntitySelectorWithActions
            key={field.key}
            label={field.label}
            value={value}
            onChange={(val) => onChange(field.key, val)}
            options={suppliers.map(s => ({ id: s.id, name: s.name, label: s.name }))}
            required={field.isRequired}
            disabled={isLocked || loading || loadingData}
            error={!!hasError}
            helperText={hasError || field.helpText}
            loading={loadingData}
            onCreateClick={() => setSupplierModalOpen(true)}
            createTooltip="Crear nuevo proveedor"
          />
        );

      case 'MANUFACTURER_SELECT':
        return (
          <EntitySelectorWithActions
            key={field.key}
            label={field.label}
            value={value}
            onChange={(val) => onChange(field.key, val)}
            options={manufacturers.map(m => ({ id: m.id, name: m.name, label: m.name }))}
            required={field.isRequired}
            disabled={isLocked || loading || loadingData}
            error={!!hasError}
            helperText={hasError || field.helpText || (!(hierarchyValues?.categoryId || preFilled?.categoryId) ? 'Selecciona primero una Categoría en el paso anterior' : 'Selecciona un fabricante o crea uno nuevo')}
            loading={loadingData}
            onInfoClick={() => navigate('/assets/manufacturers')}
            onCreateClick={() => setManufacturerModalOpen(true)}
            infoTooltip="Ver todos los fabricantes"
            createTooltip="Crear nuevo fabricante"
            canCreate={!!(hierarchyValues?.categoryId || preFilled?.categoryId)}
          />
        );

      case 'MODEL_SELECT':
        return (
          <EntitySelectorWithActions
            key={field.key}
            label={field.label}
            value={value}
            onChange={(val) => onChange(field.key, val)}
            options={models.map(m => ({ id: m.id, name: m.name, label: `${m.name}${m.AssetManufacturer?.name ? ` (${m.AssetManufacturer.name})` : m.manufacturer?.name ? ` (${m.manufacturer.name})` : ''}` }))}
            required={field.isRequired}
            disabled={isLocked || loading || loadingData || !(hierarchyValues?.typeId || preFilled?.typeId)}
            error={!!hasError}
            helperText={hasError || field.helpText || (!(hierarchyValues?.typeId || preFilled?.typeId) ? 'Selecciona primero un Tipo de Activo en el paso anterior' : 'Selecciona un modelo o crea uno nuevo')}
            loading={loadingData}
            onInfoClick={() => navigate('/assets/models')}
            onCreateClick={() => setModelModalOpen(true)}
            infoTooltip="Ver todos los modelos"
            createTooltip="Crear nuevo modelo"
            canCreate={!!(hierarchyValues?.typeId || preFilled?.typeId)}
          />
        );

      default:
        return (
          <TextField
            key={field.key}
            label={field.label}
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            required={field.isRequired}
            disabled={isLocked || loading}
            error={!!hasError}
            helperText={hasError || field.helpText}
            fullWidth
          />
        );
    }
  };

  // Agrupar campos por sección
  const fieldsBySection = fields.reduce((acc, field) => {
    const section = field.section || 'general';
    if (!acc[section]) acc[section] = [];
    acc[section].push(field);
    return acc;
  }, {} as Record<string, any[]>);

  // Debug: Verificar campos recibidos
  React.useEffect(() => {
    console.log('🔍 UniversalFieldsTab - Campos recibidos:', {
      totalFields: fields.length,
      fields: fields.map(f => ({ key: f.key, label: f.label, type: f.type, displayOrder: f.displayOrder, section: f.section })),
      fieldsBySection: Object.keys(fieldsBySection).map(section => ({
        section,
        count: fieldsBySection[section].length,
        fields: fieldsBySection[section].map((f: any) => ({ key: f.key, displayOrder: f.displayOrder }))
      }))
    });
  }, [fields]);

  // Ordenar campos por displayOrder en todas las secciones
  Object.keys(fieldsBySection).forEach(section => {
    fieldsBySection[section].sort((a: any, b: any) => {
      // Primero, ordenar por displayOrder si existe
      const orderA = a.displayOrder ?? 999;
      const orderB = b.displayOrder ?? 999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // Si tienen el mismo displayOrder, mantener orden lógico por sección
      if (section === 'assignment') {
        if (a.key === 'assignedUserId') return -1;
        if (b.key === 'assignedUserId') return 1;
        if (a.key === 'companyId') return -1;
        if (b.key === 'companyId') return 1;
      }
      
      return 0;
    });
  });

  const sectionLabels: Record<string, string> = {
    general: 'Información General',
    assignment: 'Asignación',
    financial: 'Financiero',
    lifecycle: 'Estado y Ciclo de Vida',
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Campos Universales
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Estos campos están presentes en todos los activos
      </Typography>

      {preFilled && (preFilled.categoryId || preFilled.groupId || preFilled.typeId) && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 2,
            backgroundColor: 'rgba(255, 107, 157, 0.1)',
            borderLeft: '4px solid #FF6B9D',
            '& .MuiAlert-icon': {
              color: '#FF6B9D'
            }
          }}
        >
          <Typography variant="body2">
            <strong>Campos prellenados:</strong> Categoría, Grupo y Tipo ya están definidos y no se pueden modificar.
          </Typography>
        </Alert>
      )}

      {Object.entries(fieldsBySection).map(([section, sectionFields]) => (
        <Box key={section} sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
            {sectionLabels[section] || section}
          </Typography>
          <Grid container spacing={2}>
            {(sectionFields as any[]).map((field: any) => (
              <Grid item xs={12} md={6} key={field.key}>
                <Box sx={{ position: 'relative' }}>
                  {renderField(field)}
                  {recommendedFields.includes(field.key) && !values[field.key] && (
                    <Chip
                      label="Recomendado"
                      size="small"
                      variant="outlined"
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: 10,
                        fontSize: '0.7rem',
                        height: 20,
                        borderColor: '#FF6B9D',
                        color: '#FF6B9D',
                        backgroundColor: 'rgba(255, 107, 157, 0.1)'
                      }}
                    />
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}

      {/* Modales */}
      {userModalOpen && (
        <Dialog open={userModalOpen} onClose={() => setUserModalOpen(false)} maxWidth="md" fullWidth>
          <UserForm
            initialData={null}
            onCancel={() => setUserModalOpen(false)}
            onSave={handleUserCreated}
            isEditMode={false}
          />
        </Dialog>
      )}

      <CompanyForm
        open={companyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        onSave={handleCompanyCreated}
        initialData={null}
        isEditMode={false}
      />

      <HeadquartersForm
        open={headquartersModalOpen}
        onClose={() => setHeadquartersModalOpen(false)}
        onSave={handleHeadquartersCreated}
        initialData={null}
        isEditMode={false}
        companies={companies}
      />

      <ProcessForm
        open={processModalOpen}
        onClose={() => setProcessModalOpen(false)}
        onSave={handleProcessCreated}
        initialData={null}
        isEditMode={false}
        companies={companies}
      />

      <JobTitleForm
        open={jobTitleModalOpen}
        onClose={() => setJobTitleModalOpen(false)}
        onSave={handleJobTitleCreated}
        initialData={null}
        isEditMode={false}
        companies={companies}
        processes={processes.filter(p => !values.companyId || p.companyId === values.companyId)}
      />

      <SupplierForm
        open={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onSave={handleSupplierCreated}
        initialData={null}
        isEditMode={false}
      />

      <AssetManufacturerForm
        open={manufacturerModalOpen}
        onClose={() => setManufacturerModalOpen(false)}
        onSave={handleManufacturerCreated}
        initialData={(hierarchyValues?.categoryId || preFilled?.categoryId) ? { 
          categoryId: (hierarchyValues?.categoryId || preFilled?.categoryId)?.toString() 
        } as any : null}
      />

      <AssetModelForm
        open={modelModalOpen}
        onClose={() => setModelModalOpen(false)}
        onSave={handleModelCreated}
        initialData={(hierarchyValues?.categoryId || preFilled?.categoryId) ? { 
          typeId: (hierarchyValues?.typeId || preFilled?.typeId)?.toString() || undefined,
          categoryId: (hierarchyValues?.categoryId || preFilled?.categoryId)?.toString(),
          groupId: (hierarchyValues?.groupId || preFilled?.groupId)?.toString() || undefined,
          manufacturerId: values.manufacturerId ? values.manufacturerId.toString() : undefined
        } as any : null}
      />
    </Box>
  );
};

export default UniversalFieldsTab;

