import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Button,
  Checkbox,
} from '@mui/material';
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  ArrowForward as ArrowForwardIcon,
  AccountTree as AccountTreeIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import assetCatalogService from '../../services/assetCatalogService';
import AssetGroupForm from './AssetGroupForm';
import PageHeader from '../common/PageHeader';

interface GroupType {
  id: number;
  name: string;
  label?: string;
}

interface GroupAsset {
  id: number;
  name: string;
}

interface Group {
  id: number;
  name: string;
  label?: string;
  description?: string;
  categoryId: number;
  category?: {
    id: number;
    name: string;
    label?: string;
  };
  types?: GroupType[];
  assets?: GroupAsset[];
  assetCount?: number;
  _count?: {
    types: number;
  };
}

const CategoryGroupsView: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [category, setCategory] = useState<{ id: number; name: string; label?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar grupos de la categoría
        const groupsData = await assetCatalogService.getGroupsByCategory(Number(categoryId));
        const groupsArray = Array.isArray(groupsData) ? groupsData : [];
        setGroups(groupsArray);
        
        // Obtener info de la categoría desde el primer grupo
        if (groupsArray.length > 0 && groupsArray[0].category) {
          setCategory(groupsArray[0].category);
        } else {
          // Si no hay grupos, cargar la categoría directamente
          const categories = await assetCatalogService.getCategories();
          const categoriesArray = Array.isArray(categories) ? categories : [];
          const foundCategory = categoriesArray.find((c: any) => c.id?.toString() === categoryId || Number(c.id) === Number(categoryId));
          if (foundCategory) {
            setCategory(foundCategory);
          }
        }
      } catch (error: any) {
        setMessage({
          type: 'error',
          text: `Error al cargar grupos: ${error.response?.data?.error || error.message}`
        });
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      loadData();
    }
  }, [categoryId]);

  const handleGroupClick = (groupId: number) => {
    navigate(`/assets/by-group/${groupId}`);
  };

  // Funciones para manejo de selección
  const selectedGroups = useMemo(() => {
    return groups.filter(group => selectedIds.has(group.id));
  }, [groups, selectedIds]);

  const allSelectedOnPage = useMemo(() => {
    if (groups.length === 0) return false;
    return groups.every(g => selectedIds.has(g.id));
  }, [groups, selectedIds]);

  const someSelectedOnPage = useMemo(() => {
    return groups.some(g => selectedIds.has(g.id)) && !allSelectedOnPage;
  }, [groups, selectedIds, allSelectedOnPage]);

  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (allSelectedOnPage) {
        groups.forEach(g => newSelected.delete(g.id));
      } else {
        groups.forEach(g => newSelected.add(g.id));
      }
      return newSelected;
    });
  }, [allSelectedOnPage, groups]);

  const toggleSelectOne = useCallback((id: number) => {
    setSelectedIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  // Acción global: navegar a los grupos seleccionados
  const handleBulkNavigate = () => {
    if (selectedGroups.length === 0) {
      setMessage({ type: 'error', text: 'Por favor selecciona al menos un grupo' });
      return;
    }
    
    // Navegar al primer grupo seleccionado
    if (selectedGroups.length > 0) {
      handleGroupClick(selectedGroups[0].id);
    }
  };

  // Acción global: editar grupos seleccionados
  const handleBulkEdit = () => {
    if (selectedGroups.length === 0) {
      setMessage({ type: 'error', text: 'Por favor selecciona al menos un grupo' });
      return;
    }
    
    setIsBulkEditMode(true);
    setEditDialogOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditDialogOpen(false);
    setIsBulkEditMode(false);
    setSelectedIds(new Set());
  };

  const handleSaveEdit = () => {
    handleCloseEditModal();
    // Recargar datos
    const loadData = async () => {
      try {
        const groupsData = await assetCatalogService.getGroupsByCategory(Number(categoryId));
        const groupsArray = Array.isArray(groupsData) ? groupsData : [];
        setGroups(groupsArray);
      } catch (error: any) {
        setMessage({
          type: 'error',
          text: `Error al recargar grupos: ${error.response?.data?.error || error.message}`
        });
      }
    };
    loadData();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  const categoryName = category?.label || category?.name || 'Categoría';

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ mb: 2 }}
      >
        <Link
          underline="hover"
          color="inherit"
          href="/assets"
          onClick={(e) => {
            e.preventDefault();
            navigate('/assets');
          }}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Gestión de Activos
        </Link>
        <Link
          underline="hover"
          color="inherit"
          href="/assets/categories"
          onClick={(e) => {
            e.preventDefault();
            navigate('/assets/categories');
          }}
        >
          Categorías
        </Link>
        <Typography color="text.primary">
          {categoryName}
        </Typography>
      </Breadcrumbs>

      <PageHeader
        title={categoryName}
        subtitle={`${groups.length} grupo(s) asociado(s)`}
      />

      {/* Alertas */}
      {message && (
        <Alert
          severity={message.type}
          sx={{ mb: 2 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {/* Lista de Grupos */}
      {groups.length === 0 ? (
        <Card sx={{ borderRadius: 1, boxShadow: 3 }}>
          <CardContent>
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No hay grupos asociados
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Esta categoría no tiene grupos asociados aún.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ borderRadius: 1, boxShadow: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Lista de Grupos ({groups.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {/* Botones de acciones globales */}
                {selectedIds.size > 0 && (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      startIcon={<EditIcon />}
                      onClick={handleBulkEdit}
                    >
                      Modificar ({selectedIds.size})
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<ArrowForwardIcon />}
                      onClick={handleBulkNavigate}
                    >
                      Ver Activos ({selectedIds.size})
                    </Button>
                  </>
                )}
              </Box>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 1 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#FF6B6B' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={someSelectedOnPage}
                        checked={allSelectedOnPage}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectAllOnPage();
                        }}
                        sx={{
                          color: 'white',
                          '&.Mui-checked': {
                            color: 'white',
                          },
                          '&.MuiCheckbox-indeterminate': {
                            color: 'white',
                          },
                        }}
                        inputProps={{
                          'aria-label': 'Seleccionar todos',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Grupo</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Descripción</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Tipos</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Activos</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow 
                      key={group.id} 
                      hover
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.has(group.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectOne(group.id);
                          }}
                          inputProps={{
                            'aria-label': `Seleccionar grupo ${group.label || group.name}`,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        <Box
                          component="span"
                          onClick={() => handleGroupClick(group.id)}
                          sx={{
                            color: '#FF6B6B',
                            cursor: 'pointer',
                            '&:hover': {
                              textDecoration: 'underline',
                              color: '#FF5252'
                            }
                          }}
                        >
                          {group.label || group.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary" sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 400
                        }}>
                          {group.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {group.types && group.types.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                            {group.types.slice(0, 3).map((type) => (
                              <Chip
                                key={type.id}
                                label={type.label || type.name}
                                size="small"
                                variant="outlined"
                                onClick={() => navigate(`/assets/by-type/${type.id}`)}
                                sx={{
                                  cursor: 'pointer',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 107, 107, 0.1)'
                                  }
                                }}
                              />
                            ))}
                            {group.types.length > 3 && (
                              <Chip
                                label={`+${group.types.length - 3}`}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {group.assetCount !== undefined && group.assetCount > 0 ? (
                          <Chip
                            label={group.assetCount}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="textSecondary">0</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver activos de este grupo">
                          <IconButton
                            size="small"
                            onClick={() => handleGroupClick(group.id)}
                            sx={{ color: '#FF6B6B' }}
                          >
                            <ArrowForwardIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Modal de edición */}
      <AssetGroupForm
        open={editDialogOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveEdit}
        initialData={null}
        selectedGroups={selectedGroups.map(g => ({
          id: g.id.toString(),
          categoryId: g.categoryId.toString(),
          name: g.name,
          label: g.label,
          description: g.description,
          status: 'ACTIVE',
          isSystem: false
        }))}
        isBulkEdit={isBulkEditMode}
      />
    </Box>
  );
};

export default CategoryGroupsView;
