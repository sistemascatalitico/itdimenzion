import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
  Alert,
  IconButton,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import assetCatalogService from '../../../services/assetCatalogService';
import AssetCategoryForm from '../AssetCategoryForm';
import AssetGroupForm from '../AssetGroupForm';
import AssetTypeForm from '../AssetTypeForm';

interface AssetTypeSelectorProps {
  categoryId: number | null;
  groupId: number | null;
  typeId: number | null;
  onCategoryChange: (id: number | null) => void;
  onGroupChange: (id: number | null) => void;
  onTypeChange: (id: number | null) => void;
  onSelect: (category: number, group: number, type: number) => void;
}

const AssetTypeSelector: React.FC<AssetTypeSelectorProps> = ({
  categoryId,
  groupId,
  typeId,
  onCategoryChange,
  onGroupChange,
  onTypeChange,
  onSelect,
}) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para modales anidados
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [typeFormOpen, setTypeFormOpen] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (categoryId) {
      loadGroups(categoryId);
    } else {
      setGroups([]);
      onGroupChange(null);
    }
  }, [categoryId, onGroupChange]);

  useEffect(() => {
    if (groupId) {
      loadTypes(groupId);
    } else {
      setTypes([]);
      onTypeChange(null);
    }
  }, [groupId, onTypeChange]);

  useEffect(() => {
    if (categoryId && groupId && typeId) {
      onSelect(categoryId, groupId, typeId);
    }
  }, [categoryId, groupId, typeId]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await assetCatalogService.getCategories();
      setCategories(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async (catId: number) => {
    try {
      setLoading(true);
      const data = await assetCatalogService.getGroups({ categoryId: catId });
      setGroups(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTypes = async (grpId: number) => {
    try {
      setLoading(true);
      const data = await assetCatalogService.getTypes({ groupId: grpId });
      setTypes(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('Error loading types:', error);
      setTypes([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handlers para crear nuevos elementos
  const handleCreateCategory = () => {
    setCategoryFormOpen(true);
  };
  
  const handleCreateGroup = () => {
    if (!categoryId) {
      // No mostrar alert, simplemente no hacer nada (el botón ya está disabled)
      return;
    }
    setGroupFormOpen(true);
  };
  
  const handleCreateType = () => {
    if (!categoryId || !groupId) {
      // No mostrar alert, simplemente no hacer nada (el botón ya está disabled)
      return;
    }
    setTypeFormOpen(true);
  };
  
  // Handlers para navegar con botón "i"
  const handleNavigateToCategories = () => {
    navigate('/assets/categories');
  };
  
  const handleNavigateToGroups = () => {
    if (categoryId) {
      navigate(`/assets/category/${categoryId}/groups`);
    } else {
      navigate('/assets/groups');
    }
  };
  
  const handleNavigateToTypes = () => {
    if (groupId) {
      navigate(`/assets/by-group/${groupId}`);
    } else if (categoryId) {
      navigate(`/assets/category/${categoryId}/groups`);
    } else {
      navigate('/assets/types');
    }
  };
  
  // Handlers para cuando se crea un nuevo elemento
  const handleCategoryCreated = async () => {
    setCategoryFormOpen(false);
    // Recargar categorías y seleccionar la última (asumiendo que es la recién creada)
    const data = await assetCatalogService.getCategories();
    const updatedCategories = Array.isArray(data) ? data : data?.data || [];
    setCategories(updatedCategories);
    
    // Seleccionar automáticamente la última categoría creada
    if (updatedCategories.length > 0) {
      const lastCategory = updatedCategories[updatedCategories.length - 1];
      onCategoryChange(Number(lastCategory.id));
    }
  };
  
  const handleGroupCreated = async () => {
    setGroupFormOpen(false);
    if (categoryId) {
      // Recargar grupos y seleccionar el último
      const data = await assetCatalogService.getGroups({ categoryId });
      const updatedGroups = Array.isArray(data) ? data : data?.data || [];
      setGroups(updatedGroups);
      
      // Seleccionar automáticamente el último grupo creado
      if (updatedGroups.length > 0) {
        const lastGroup = updatedGroups[updatedGroups.length - 1];
        onGroupChange(Number(lastGroup.id));
      }
    }
  };
  
  const handleTypeCreated = async () => {
    setTypeFormOpen(false);
    if (groupId) {
      // Recargar tipos y seleccionar el último
      const data = await assetCatalogService.getTypes({ groupId });
      const updatedTypes = Array.isArray(data) ? data : data?.data || [];
      setTypes(updatedTypes);
      
      // Seleccionar automáticamente el último tipo creado
      if (updatedTypes.length > 0) {
        const lastType = updatedTypes[updatedTypes.length - 1];
        onTypeChange(Number(lastType.id));
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Selecciona el Tipo de Activo
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Selecciona la categoría, grupo y tipo de activo que deseas crear
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl fullWidth required sx={{ flex: 1 }}>
              <InputLabel>Categoría *</InputLabel>
              <Select
                value={categoryId || ''}
                label="Categoría *"
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : null;
                  onCategoryChange(id);
                  onGroupChange(null);
                  onTypeChange(null);
                }}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.label || cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
              <Tooltip title="Ver todas las categorías">
                <IconButton
                  size="small"
                  onClick={handleNavigateToCategories}
                  color="default"
                >
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Crear nueva categoría">
                <IconButton
                  size="small"
                  onClick={handleCreateCategory}
                  color="primary"
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl fullWidth required disabled={!categoryId} sx={{ flex: 1 }}>
              <InputLabel>Grupo *</InputLabel>
              <Select
                value={groupId || ''}
                label="Grupo *"
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : null;
                  onGroupChange(id);
                  onTypeChange(null);
                }}
              >
                {groups.map((grp) => (
                  <MenuItem key={grp.id} value={grp.id}>
                    {grp.label || grp.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
              <Tooltip title={categoryId ? `Ver grupos de esta categoría` : 'Selecciona primero una categoría'}>
                <span>
                  <IconButton
                    size="small"
                    onClick={handleNavigateToGroups}
                    disabled={!categoryId}
                    color="default"
                  >
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={categoryId ? 'Crear nuevo grupo' : 'Selecciona primero una categoría'}>
                <span>
                  <IconButton
                    size="small"
                    onClick={handleCreateGroup}
                    disabled={!categoryId}
                    color="primary"
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} sm={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl fullWidth required disabled={!groupId} sx={{ flex: 1 }}>
              <InputLabel>Tipo *</InputLabel>
              <Select
                value={typeId || ''}
                label="Tipo *"
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : null;
                  onTypeChange(id);
                }}
              >
                {types.map((typ) => (
                  <MenuItem key={typ.id} value={typ.id}>
                    {typ.label || typ.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
              <Tooltip title={groupId ? `Ver tipos de este grupo` : 'Selecciona primero un grupo'}>
                <span>
                  <IconButton
                    size="small"
                    onClick={handleNavigateToTypes}
                    disabled={!groupId}
                    color="default"
                  >
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={groupId ? 'Crear nuevo tipo' : 'Selecciona primero un grupo'}>
                <span>
                  <IconButton
                    size="small"
                    onClick={handleCreateType}
                    disabled={!groupId}
                    color="primary"
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>
        </Grid>
      </Grid>
      
      {/* Modales anidados - MUI maneja automáticamente el z-index para modales anidados */}
      <AssetCategoryForm
        open={categoryFormOpen}
        onClose={() => setCategoryFormOpen(false)}
        onSave={handleCategoryCreated}
        initialData={null}
      />
      
      <AssetGroupForm
        open={groupFormOpen}
        onClose={() => setGroupFormOpen(false)}
        onSave={handleGroupCreated}
        initialData={categoryId ? { categoryId: categoryId.toString() } as any : null}
      />
      
      <AssetTypeForm
        open={typeFormOpen}
        onClose={() => setTypeFormOpen(false)}
        onSave={handleTypeCreated}
        initialData={groupId ? { groupId: groupId.toString(), categoryId: categoryId?.toString() } as any : null}
      />

      {categoryId && groupId && typeId && (
        <Alert severity="success" sx={{ mt: 2 }}>
          ✅ Tipo seleccionado. Haz clic en "Siguiente" para continuar.
        </Alert>
      )}
    </Box>
  );
};

export default AssetTypeSelector;

