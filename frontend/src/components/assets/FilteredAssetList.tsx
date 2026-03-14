import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import assetService from '../../services/assetService';
import assetCatalogService from '../../services/assetCatalogService';
import api from '../../config/api';
import ViewDialog from '../common/ViewDialog';
import PageHeader from '../common/PageHeader';
import PageHeaderActionButton from '../common/PageHeaderActionButton';
import { PRIMARY, PRIMARY_GRADIENT } from '../../theme/themeTokens';
import NewAssetModal from './NewAssetModal';
import AssetForm from './AssetForm'; // Mantener para edición temporalmente

interface Asset {
  id: string;
  name: string;
  description?: string;
  serialNumber?: string;
  assetCode?: string;
  status: string;
  condition?: string;
  purchaseDate?: string;
  warrantyExpiration?: string;
  notes?: string;
  commentary?: string;
  location?: string;
  purchaseValue?: number;
  category?: { id: string; name: string; label?: string };
  group?: { id: string; name: string };
  type?: { id: string; name: string };
  model?: { id: string; name: string; manufacturer?: { id: string; name: string } };
  company?: { id: string; name: string };
  headquarters?: { id: string; name: string };
  assignedUser?: { id: string; firstName: string; lastName: string };
  purchasedByCompany?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

interface FilterInfo {
  type: 'category' | 'group' | 'type' | 'manufacturer' | 'model';
  id: number;
  name: string;
  label?: string;
}

const FilteredAssetList: React.FC = () => {
  const { categoryId, groupId, typeId, manufacturerId, modelId } = useParams<{
    categoryId?: string;
    groupId?: string;
    typeId?: string;
    manufacturerId?: string;
    modelId?: string;
  }>();
  const navigate = useNavigate();
  
  const [rows, setRows] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filterInfo, setFilterInfo] = useState<FilterInfo | null>(null);

  // Determinar tipo de filtro y cargar datos
  useEffect(() => {
    const loadAssets = async () => {
      try {
        setLoading(true);
        let data: Asset[] = [];
        let info: FilterInfo | null = null;

        if (categoryId) {
          data = await assetService.getByCategory(Number(categoryId));
          // Obtener info de la categoría desde los activos o directamente
          if (data.length > 0 && data[0].model?.type?.group?.category) {
            const cat = data[0].model.type.group.category;
            info = {
              type: 'category',
              id: Number(categoryId),
              name: cat.name || '',
              label: cat.label
            };
          } else {
            // Si no hay activos, obtener categoría directamente
            const categoriesResponse = await assetCatalogService.getCategories();
            const categories = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse.data || []);
            const foundCategory = categories.find((c: any) => c.id?.toString() === categoryId || Number(c.id) === Number(categoryId));
            if (foundCategory) {
              info = {
                type: 'category',
                id: Number(categoryId),
                name: foundCategory.name || '',
                label: foundCategory.label
              };
            }
          }
        } else if (groupId) {
          data = await assetService.getByGroup(Number(groupId));
          // Obtener info del grupo
          if (data.length > 0 && data[0].model?.type?.group) {
            const grp = data[0].model.type.group;
            info = {
              type: 'group',
              id: Number(groupId),
              name: grp.name || '',
              label: (grp as any).label
            };
          } else {
            // Si no hay activos, obtener grupo directamente
            const groupsResponse = await assetCatalogService.getGroups();
            const groups = Array.isArray(groupsResponse) ? groupsResponse : (groupsResponse.data || []);
            const foundGroup = groups.find((g: any) => g.id?.toString() === groupId || Number(g.id) === Number(groupId));
            if (foundGroup) {
              info = {
                type: 'group',
                id: Number(groupId),
                name: foundGroup.name || '',
                label: foundGroup.label
              };
            }
          }
        } else if (typeId) {
          data = await assetService.getByType(Number(typeId));
          // Obtener info del tipo
          if (data.length > 0 && data[0].type) {
            const typ = data[0].type;
            info = {
              type: 'type',
              id: Number(typeId),
              name: typ.name || '',
              label: (typ as any).label
            };
          } else {
            // Si no hay activos, obtener tipo directamente
            const typesResponse = await assetCatalogService.getTypes();
            const types = Array.isArray(typesResponse) ? typesResponse : (typesResponse.data || []);
            const foundType = types.find((t: any) => t.id?.toString() === typeId || Number(t.id) === Number(typeId));
            if (foundType) {
              info = {
                type: 'type',
                id: Number(typeId),
                name: foundType.name || '',
                label: foundType.label
              };
            }
          }
        } else if (manufacturerId) {
          data = await assetService.getByManufacturer(Number(manufacturerId));
          // Obtener info del fabricante
          if (data.length > 0 && data[0].model?.manufacturer) {
            const mfr = data[0].model.manufacturer;
            info = {
              type: 'manufacturer',
              id: Number(manufacturerId),
              name: mfr.name || ''
            };
          } else {
            // Si no hay activos, obtener fabricante directamente
            const manufacturersResponse = await assetCatalogService.getManufacturers();
            const manufacturers = Array.isArray(manufacturersResponse) ? manufacturersResponse : (manufacturersResponse.data || []);
            const foundManufacturer = manufacturers.find((m: any) => m.id?.toString() === manufacturerId || Number(m.id) === Number(manufacturerId));
            if (foundManufacturer) {
              info = {
                type: 'manufacturer',
                id: Number(manufacturerId),
                name: foundManufacturer.name || ''
              };
            }
          }
        } else if (modelId) {
          data = await assetService.getByModel(Number(modelId));
          // Obtener info del modelo
          if (data.length > 0 && data[0].model) {
            const mdl = data[0].model;
            info = {
              type: 'model',
              id: Number(modelId),
              name: mdl.name || ''
            };
          } else {
            // Si no hay activos, obtener modelo directamente
            const modelsResponse = await assetCatalogService.getModels();
            const models = Array.isArray(modelsResponse) ? modelsResponse : (modelsResponse.data || []);
            const foundModel = models.find((m: any) => m.id?.toString() === modelId || Number(m.id) === Number(modelId));
            if (foundModel) {
              info = {
                type: 'model',
                id: Number(modelId),
                name: foundModel.name || ''
              };
            }
          }
        }

        const assets = Array.isArray(data) ? data : (data.data || data.items || []);
        setRows(Array.isArray(assets) ? assets : []);
        setFilterInfo(info);
      } catch (error: any) {
        setMessage({
          type: 'error',
          text: `Error al cargar activos: ${error.response?.data?.error || error.message}`
        });
      } finally {
        setLoading(false);
      }
    };

    loadAssets();
  }, [categoryId, groupId, typeId, manufacturerId, modelId]);

  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setViewDialogOpen(true);
  };

  const handleEditFromView = () => {
    setViewDialogOpen(false);
    setEditDialogOpen(true);
  };

  const handleDelete = async (asset: Asset) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el activo "${asset.name || asset.assetCode || asset.serialNumber}"?`)) {
      try {
        await api.delete(`/assets/${asset.id}`);
        setMessage({ type: 'success', text: 'Activo eliminado exitosamente' });
        // Recargar
        window.location.reload();
      } catch (error: any) {
        setMessage({
          type: 'error',
          text: `Error al eliminar: ${error.response?.data?.error || error.message}`
        });
      }
    }
  };

  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;
    
    return rows.filter(asset => {
      const search = searchTerm.toLowerCase();
      return (
        (asset.name && asset.name.toLowerCase().includes(search)) ||
        (asset.assetCode && asset.assetCode.toLowerCase().includes(search)) ||
        (asset.serialNumber && asset.serialNumber.toLowerCase().includes(search)) ||
        (asset.description && asset.description.toLowerCase().includes(search))
      );
    });
  }, [rows, searchTerm]);

  const getFilterTitle = () => {
    if (!filterInfo) return 'Activos';
    
    const labels: Record<string, string> = {
      category: 'Categoría',
      group: 'Grupo',
      type: 'Tipo',
      manufacturer: 'Fabricante',
      model: 'Modelo'
    };
    
    return `${labels[filterInfo.type]}: ${filterInfo.label || filterInfo.name}`;
  };

  const getBreadcrumbs = () => {
    const breadcrumbs = [
      <Link
        key="home"
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
    ];

    if (filterInfo) {
      breadcrumbs.push(
        <Typography key="filter" color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          {getFilterTitle()}
        </Typography>
      );
    }

    return breadcrumbs;
  };

  if (loading && rows.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ mb: 2 }}
      >
        {getBreadcrumbs()}
      </Breadcrumbs>

      <PageHeader
        title={getFilterTitle()}
        subtitle={`${filteredRows.length} activo(s) encontrado(s)`}
        action={
          <PageHeaderActionButton
            label="Nuevo Activo"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedAsset(null);
              setEditDialogOpen(true);
            }}
          />
        }
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

      {/* Card principal */}
      <Card sx={{ borderRadius: 1, boxShadow: 3 }}>
        <CardContent>
          {/* Búsqueda */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Buscar activo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: 300, flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
              color="primary"
            >
              Actualizar
            </Button>
          </Box>

          {/* Tabla */}
          {filteredRows.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                {searchTerm ? 'No se encontraron activos' : 'No hay activos asociados'}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                {filterInfo 
                  ? `No hay activos asociados a ${filterInfo.label || filterInfo.name}`
                  : 'No hay activos registrados'
                }
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedAsset(null);
                  setEditDialogOpen(true);
                }}
                sx={{
                  background: PRIMARY_GRADIENT,
                }}
              >
                Crear Primer Activo
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 1 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: PRIMARY.main }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Activo</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Código</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Modelo</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Estado</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows.map((asset) => (
                    <TableRow key={asset.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {asset.name || asset.assetCode || asset.serialNumber || '-'}
                      </TableCell>
                      <TableCell>
                        {asset.assetCode || '-'}
                      </TableCell>
                      <TableCell>
                        {asset.model?.name ? (
                          <Chip label={asset.model.name} size="small" />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={asset.status || 'ACTIVE'}
                          color={(asset.status || 'ACTIVE') === 'ACTIVE' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Tooltip title="Ver">
                            <IconButton
                              size="small"
                              onClick={() => handleViewAsset(asset)}
                              sx={{ color: '#2196F3' }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setEditDialogOpen(true);
                              }}
                              sx={{ color: 'warning.main' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(asset)}
                              sx={{ color: '#F44336' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* ViewDialog */}
      {selectedAsset && (
        <ViewDialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          onEdit={handleEditFromView}
          title={`Activo: ${selectedAsset.name || selectedAsset.assetCode || selectedAsset.serialNumber}`}
          data={selectedAsset}
          type="asset"
        />
      )}

      {/* Modal de creación de activo */}
      <NewAssetModal
        open={editDialogOpen && !selectedAsset}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedAsset(null);
        }}
        onSuccess={() => {
          window.location.reload();
        }}
        preFilled={
          categoryId || groupId || typeId
            ? {
                categoryId: categoryId ? Number(categoryId) : undefined,
                groupId: groupId ? Number(groupId) : undefined,
                typeId: typeId ? Number(typeId) : undefined,
              }
            : undefined
        }
      />
      
      {/* TODO: Modal de edición - Por ahora mantener AssetForm para edición */}
      {selectedAsset && editDialogOpen && (
        <AssetForm
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedAsset(null);
          }}
          onSave={() => {
            window.location.reload();
          }}
          initialData={selectedAsset}
        />
      )}
    </Box>
  );
};

export default FilteredAssetList;

