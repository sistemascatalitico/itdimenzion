import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Close as CloseIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Work as WorkIcon,
  AccountTree as ProcessIcon,
} from '@mui/icons-material';
import { Avatar } from '@mui/material';
import ModalHeader from './ModalHeader';

interface ViewDialogProps {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  title: string;
  data: Record<string, any>;
  type: 'company' | 'headquarters' | 'process' | 'jobtitle' | 'user' | 'manufacturer' | 'category' | 'group' | 'type' | 'model';
}

const ViewDialog: React.FC<ViewDialogProps> = ({
  open,
  onClose,
  onEdit,
  title,
  data,
  type,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'company':
        return <BusinessIcon sx={{ color: '#FF6B6B' }} />;
      case 'headquarters':
        return <LocationIcon sx={{ color: '#FF6B6B' }} />;
      case 'process':
        return <ProcessIcon sx={{ color: '#FF6B6B' }} />;
      case 'jobtitle':
        return <WorkIcon sx={{ color: '#FF6B6B' }} />;
      case 'user':
        return <PeopleIcon sx={{ color: '#FF6B6B' }} />;
      case 'manufacturer':
      case 'category':
      case 'group':
      case 'type':
      case 'model':
        return <BusinessIcon sx={{ color: '#FF6B6B' }} />;
      default:
        return <BusinessIcon sx={{ color: '#FF6B6B' }} />;
    }
  };

  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined || value === '') {
      return 'No especificado';
    }
    
    // Manejar logo - mostrar Avatar con imagen
    if (key.toLowerCase() === 'logo') {
      if (value && (value.startsWith('http') || value.startsWith('data:'))) {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={value}
              alt="Logo"
              sx={{
                width: 80,
                height: 80,
                border: '2px solid #FF6B6B',
                bgcolor: 'rgba(255, 107, 107, 0.1)',
              }}
            />
          </Box>
        );
      }
      return 'No especificado';
    }
    
    // Manejar campos virtuales (grupo, categoria, fabricante, tipo) - estos ya son nombres
    if (key.toLowerCase() === 'categoria' || key.toLowerCase() === 'grupo' || 
        key.toLowerCase() === 'fabricante' || key.toLowerCase() === 'tipo') {
      return String(value);
    }
    
    // Manejar IDs que deben convertirse a nombres usando objetos relacionados
    if (key.toLowerCase().endsWith('id') && (typeof value === 'number' || typeof value === 'string')) {
      const relatedKey = key.replace(/Id$/i, '');
      const relatedObj = data[relatedKey];
      
      if (relatedObj) {
        // Si hay un objeto relacionado, mostrar su nombre/label
        if (typeof relatedObj === 'object' && !Array.isArray(relatedObj)) {
          return relatedObj.label || relatedObj.name || value;
        }
      }
      
      // Para manufacturerId, buscar en manufacturer
      if (key.toLowerCase() === 'manufacturerid') {
        const manufacturer = data.manufacturer;
        if (manufacturer && typeof manufacturer === 'object' && !Array.isArray(manufacturer)) {
          return manufacturer.name || manufacturer.label || value;
        }
      }
      
      // Para typeId, buscar en type
      if (key.toLowerCase() === 'typeid') {
        const type = data.type;
        if (type && typeof type === 'object' && !Array.isArray(type)) {
          return type.label || type.name || value;
        }
      }
      
      // Para categoryId, buscar en category o en group.category
      if (key.toLowerCase() === 'categoryid') {
        // Primero buscar en category directa
        const category = data.category;
        if (category && typeof category === 'object' && !Array.isArray(category)) {
          return category.label || category.name || value;
        }
        // Si no hay category directa, buscar en group.category
        const group = data.group;
        if (group && typeof group === 'object' && !Array.isArray(group)) {
          const groupCategory = group.category;
          if (groupCategory && typeof groupCategory === 'object' && !Array.isArray(groupCategory)) {
            return groupCategory.label || groupCategory.name || value;
          }
        }
      }
      
      // Para groupId, buscar en group
      if (key.toLowerCase() === 'groupid') {
        const group = data.group;
        if (group && typeof group === 'object' && !Array.isArray(group)) {
          return group.label || group.name || value;
        }
      }
    }
    
    // Si es un objeto, convertirlo a string o mostrar propiedades específicas
    if (typeof value === 'object' && !Array.isArray(value)) {
      // Para objetos de empresa, proceso, etc.
      if (value.name) {
        return value.name;
      }
      if (value.id && value.taxDocumentNumber) {
        return `${value.name || 'Empresa'} (${value.taxDocumentNumber})`;
      }
      if (value.firstName && value.lastName) {
        return `${value.firstName} ${value.lastName}`;
      }
      // Si es un objeto genérico, mostrar sus propiedades principales
      const mainProps = Object.keys(value).slice(0, 3);
      return mainProps.map(prop => `${prop}: ${value[prop]}`).join(', ');
    }
    
    // Si es un array, mostrar como chips si son objetos con name/label
    if (Array.isArray(value)) {
      if (value.length === 0) return 'Sin elementos';
      
      // Si son objetos de categorías, manufacturers, etc.
      if (value.length > 0 && typeof value[0] === 'object' && (value[0].name || value[0].label)) {
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {value.map((item, idx) => (
              <Chip
                key={idx}
                label={item.label || item.name || item}
                size="small"
                sx={{ backgroundColor: 'rgba(255, 107, 107, 0.1)', color: '#FF6B6B' }}
              />
            ))}
          </Box>
        );
      }
      
      if (value.length === 1) return value[0].name || value[0];
      return `${value.length} elementos`;
    }
    
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('created') || key.toLowerCase().includes('updated')) {
      try {
        return new Date(value).toLocaleDateString('es-ES');
      } catch {
        return value;
      }
    }
    
    if (key.toLowerCase().includes('status') || key.toLowerCase().includes('estado') || key === 'isActive') {
      const statusValue = value === true ? 'Activo' : value === false ? 'Inactivo' : value;
      return (
        <Chip
          label={statusValue}
          color={statusValue === 'ACTIVE' || statusValue === 'Activo' || value === true ? 'success' : 'default'}
          size="small"
        />
      );
    }
    
    if (key.toLowerCase().includes('role') || key.toLowerCase().includes('rol')) {
      const color = value === 'ADMIN' ? 'warning' : value === 'SUPER_ADMIN' ? 'error' : 'success';
      return (
        <Chip
          label={value}
          color={color}
          size="small"
        />
      );
    }
    
    // Manejar valores booleanos
    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }
    
    return String(value);
  };

  const getFieldLabel = (key: string) => {
    const labels: Record<string, string> = {
      name: 'Nombre',
      company: 'Empresa',
      location: 'Ubicación',
      contact: 'Contacto',
      status: 'Estado',
      role: 'Rol',
      email: 'Email',
      phone: 'Teléfono',
      address: 'Dirección',
      addressLine1: 'Dirección Línea 1',
      addressLine2: 'Dirección Línea 2',
      city: 'Ciudad',
      state: 'Estado/Departamento',
      country: 'País',
      website: 'Sitio Web',
      logo: 'Logo',
      commentary: 'Comentarios',
      description: 'Descripción',
      process: 'Proceso',
      headquarters: 'Sede',
      jobTitle: 'Cargo',
      taxDocumentNumber: 'Documento Tributario',
      taxDocumentType: 'Tipo de Documento',
      createdAt: 'Fecha de Creación',
      updatedAt: 'Fecha de Actualización',
      firstName: 'Nombre',
      lastName: 'Apellido',
      username: 'Nombre de Usuario',
      documentNumber: 'Número de Documento',
      documentType: 'Tipo de Documento',
      isActive: 'Estado',
      isDeletionProtected: 'Protegido de Eliminación',
      contactEmail: 'Email de Contacto',
      residenceCountry: 'País de Residencia',
      residenceState: 'Estado de Residencia',
      residenceCity: 'Ciudad de Residencia',
      categories: 'Categorías Disponibles',
      categoryIds: 'Categorías',
      manufacturerCategories: 'Categorías',
      groupId: 'Grupo',
      categoryId: 'Categoría',
      manufacturerId: 'Fabricante',
      typeId: 'Tipo',
      group: 'Grupo',
      category: 'Categoría',
      manufacturer: 'Fabricante',
      type: 'Tipo',
      grupo: 'Grupo',
      categoria: 'Categoría', // Campo virtual para mostrar nombre de categoría
      fabricante: 'Fabricante',
      tipo: 'Tipo',
      label: 'Etiqueta (Español)',
      isSystem: 'Sistema',
      isPersistent: 'Persistente',
      partNumber: 'Número de Parte',
      specsJson: 'Especificaciones',
    };
    
    // Si es un ID, mostrar el label sin "Id" al final
    if (key.toLowerCase().endsWith('id') && key.length > 2) {
      const baseKey = key.replace(/Id$/i, '');
      if (labels[baseKey]) {
        return labels[baseKey];
      }
    }
    
    return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
  };

  const renderFields = () => {
    // Crear un objeto extendido con campos virtuales para IDs convertidos a nombres
    const extendedData: Record<string, any> = { ...data };
    
    // PRIMERO: Procesar objetos relacionados (category, group, etc.) para crear campos virtuales
    // Esto debe hacerse ANTES de filtrar para asegurar que extraigamos los nombres
    if (data.category && typeof data.category === 'object' && !Array.isArray(data.category)) {
      const categoryName = data.category.label || data.category.name;
      if (categoryName) extendedData.categoria = categoryName;
    }
    
    // Buscar categoría en group.category (para tipos que tienen categoría a través del grupo)
    if (!extendedData.categoria && data.group && typeof data.group === 'object' && !Array.isArray(data.group)) {
      if (data.group.category && typeof data.group.category === 'object' && !Array.isArray(data.group.category)) {
        const groupCategoryName = data.group.category.label || data.group.category.name;
        if (groupCategoryName) extendedData.categoria = groupCategoryName;
      }
    }
    
    if (data.group && typeof data.group === 'object' && !Array.isArray(data.group)) {
      const groupName = data.group.label || data.group.name;
      if (groupName) extendedData.grupo = groupName;
    }
    
    if (data.manufacturer && typeof data.manufacturer === 'object' && !Array.isArray(data.manufacturer)) {
      const manufacturerName = data.manufacturer.name || data.manufacturer.label;
      if (manufacturerName) extendedData.fabricante = manufacturerName;
    }
    
    if (data.type && typeof data.type === 'object' && !Array.isArray(data.type)) {
      const typeName = data.type.label || data.type.name;
      if (typeName) extendedData.tipo = typeName;
    }
    
    // SEGUNDO: Para cada campo ID, si NO hay campo virtual ya creado, intentar crearlo
    Object.keys(data).forEach(key => {
      if (key.toLowerCase().endsWith('id') && key.toLowerCase() !== 'id' && key.toLowerCase() !== 'categoryids') {
        const idValue = data[key];
        if (idValue !== null && idValue !== undefined && idValue !== '') {
          // Solo procesar si no hay campo virtual ya creado
          if (key.toLowerCase() === 'categoryid' && !extendedData.categoria) {
            // Ya procesamos category arriba, pero por si acaso
            const category = data.category;
            if (category && typeof category === 'object' && !Array.isArray(category)) {
              extendedData.categoria = category.label || category.name;
            } else {
              const group = data.group;
              if (group && typeof group === 'object' && !Array.isArray(group) && group.category) {
                extendedData.categoria = group.category.label || group.category.name;
              }
            }
          }
          
          if (key.toLowerCase() === 'groupid' && !extendedData.grupo) {
            const group = data.group;
            if (group && typeof group === 'object' && !Array.isArray(group)) {
              extendedData.grupo = group.label || group.name;
            }
          }
          
          if (key.toLowerCase() === 'manufacturerid' && !extendedData.fabricante) {
            const manufacturer = data.manufacturer;
            if (manufacturer && typeof manufacturer === 'object' && !Array.isArray(manufacturer)) {
              extendedData.fabricante = manufacturer.name || manufacturer.label;
            }
          }
          
          if (key.toLowerCase() === 'typeid' && !extendedData.tipo) {
            const type = data.type;
            if (type && typeof type === 'object' && !Array.isArray(type)) {
              extendedData.tipo = type.label || type.name;
            }
          }
        }
      }
    });
    
    const fieldsToShow = Object.entries(extendedData).filter(([key, value]) => {
      // Filtrar campos vacíos, nulos o indefinidos
      if (value === null || value === undefined || value === '') return false;
      
      // Ocultar campo "id" - no es información relevante para el usuario final
      if (key.toLowerCase() === 'id') return false;
      
      // Ocultar todos los campos de ID (groupId, categoryId, manufacturerId, typeId, etc.)
      // Estos se convierten a nombres en campos virtuales arriba
      if (key.toLowerCase().endsWith('id') && key.toLowerCase() !== 'categoryids') return false;
      
      // Filtrar campos sensibles o técnicos
      if (key.includes('password') || key.includes('token')) return false;
      
      // Preferir campos virtuales sobre objetos completos cuando existen
      // Si hay un campo virtual (grupo, categoria, etc.) creado como string, usar ese en lugar del objeto
      if (key.toLowerCase() === 'group' && extendedData.grupo && typeof extendedData.grupo === 'string') return false;
      // NO ocultar category - siempre debe mostrarse, pero si hay categoria virtual, preferirla
      // Si hay campo virtual categoria, no mostrar el objeto category completo
      if (key.toLowerCase() === 'category' && extendedData.categoria && typeof extendedData.categoria === 'string') return false;
      if (key.toLowerCase() === 'manufacturer' && extendedData.fabricante && typeof extendedData.fabricante === 'string') return false;
      if (key.toLowerCase() === 'type' && extendedData.tipo && typeof extendedData.tipo === 'string') return false;
      
      // Incluir categoryIds solo si no hay categories (para evitar duplicados)
      if (key === 'categoryIds' && data.categories && Array.isArray(data.categories) && data.categories.length > 0) return false;
      
      // Filtrar objetos muy complejos que pueden causar problemas
      // PERO: Permitir objetos category, group, manufacturer, type si no hay campo virtual
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Permitir objetos category, group, manufacturer, type si no hay campo virtual correspondiente
        if (key.toLowerCase() === 'category' && !extendedData.categoria) {
          // Si hay objeto category pero no campo virtual, intentar extraer el nombre
          if (value.label || value.name) {
            extendedData.categoria = value.label || value.name;
            return false; // No mostrar el objeto, mostrar el campo virtual
          }
        }
        if (key.toLowerCase() === 'group' && !extendedData.grupo) {
          if (value.label || value.name) {
            extendedData.grupo = value.label || value.name;
            return false;
          }
        }
        if (key.toLowerCase() === 'manufacturer' && !extendedData.fabricante) {
          if (value.name || value.label) {
            extendedData.fabricante = value.name || value.label;
            return false;
          }
        }
        if (key.toLowerCase() === 'type' && !extendedData.tipo) {
          if (value.label || value.name) {
            extendedData.tipo = value.label || value.name;
            return false;
          }
        }
        
        // Para otros objetos, filtrar si son muy complejos
        const keys = Object.keys(value);
        if (keys.length > 5) return false; // Objetos muy complejos
        if (keys.some(k => typeof value[k] === 'object')) return false; // Objetos anidados
      }
      
      return true;
    });

    return fieldsToShow.map(([key, value], index) => (
      <Grid item xs={12} sm={6} key={key}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600 }}>
            {getFieldLabel(key)}
          </Typography>
          <Box>
            {formatValue(key, value)}
          </Box>
        </Box>
      </Grid>
    ));
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
        },
      }}
    >
      <ModalHeader
        title={title}
        onClose={onClose}
        gradientColor="orange"
      />
      
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          {getIcon()}
          <Typography variant="subtitle1" sx={{ ml: 2, color: '#FF6B6B', fontWeight: 600, fontSize: '1.1rem' }}>
            Información Detallada
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={2}>
          {renderFields()}
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          startIcon={<CloseIcon />}
          sx={{
            borderColor: '#FF6B6B',
            color: '#FF6B6B',
            '&:hover': {
              borderColor: '#FF5A5A',
              backgroundColor: 'rgba(255, 107, 107, 0.04)',
            },
          }}
        >
          Cerrar
        </Button>
        <Button
          onClick={onEdit}
          variant="contained"
          startIcon={<EditIcon />}
          sx={{
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)',
            color: 'white',
            px: 4,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(135deg, #FF5A5A 0%, #FF7D5A 100%)',
            },
          }}
        >
          Editar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewDialog;
