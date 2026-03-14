import React, { useEffect, useState } from 'react';
import {
  Box,
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
  CircularProgress,
  Alert,
  Fab,
  Avatar,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import assetCatalogService from '../../services/assetCatalogService';
import api from '../../config/api';
import AssetModelFormTest from './AssetModelFormTest';

interface AssetModel {
  id: string;
  manufacturerId: string;
  name: string;
  description?: string;
  status: string;
  typeId?: string;
  partNumber?: string;
  manufacturer?: {
    id: string;
    name: string;
    logo?: string;
  };
  type?: {
    id: string;
    name: string;
    group?: {
      id: number;
      name: string;
      category?: {
        id: number;
        name: string;
      };
    };
  };
}

const AssetModelsTest: React.FC = () => {
  const [rows, setRows] = useState<AssetModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Estados del formulario
  const [formOpen, setFormOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AssetModel | null>(null);
  
  // Estados para selección múltiple
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkEdit, setIsBulkEdit] = useState(false);

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadModels = async () => {
    try {
      setLoading(true);
      const response = await assetCatalogService.getModels();
      console.log('📦 Modelos cargados:', response);
      setRows(Array.isArray(response) ? response : []);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Error al cargar modelos: ${error.response?.data?.error || error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (model: AssetModel) => {
    console.log('✏️ Editando modelo:', model);
    setSelectedModel(model);
    setIsBulkEdit(false);
    setFormOpen(true);
  };
  
  // Selección múltiple
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredRows.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };
  
  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };
  
  const handleBulkEdit = () => {
    const selectedModels = rows.filter(r => selectedIds.includes(r.id));
    console.log('✏️ Edición múltiple:', selectedModels.length, 'modelos');
    
    // Calcular campos comunes
    const commonData: any = {};
    
    // Verificar si todos tienen el mismo tipo
    const types = selectedModels.map(m => m.typeId).filter(Boolean);
    if (types.length > 0 && types.every(t => t === types[0])) {
      const firstModel = selectedModels.find(m => m.typeId === types[0]);
      if (firstModel?.type) {
        commonData.typeId = firstModel.typeId;
        commonData.type = firstModel.type;
        commonData.categoryId = firstModel.type.group?.category?.id?.toString() || '';
        commonData.groupId = firstModel.type.group?.id?.toString() || '';
      }
    }
    
    // Verificar si todos tienen el mismo fabricante
    const manufacturers = selectedModels.map(m => m.manufacturerId);
    if (manufacturers.every(m => m === manufacturers[0])) {
      commonData.manufacturerId = manufacturers[0];
      commonData.manufacturer = selectedModels[0].manufacturer;
    }
    
    // Verificar si todos tienen el mismo estado
    const statuses = selectedModels.map(m => m.status);
    if (statuses.every(s => s === statuses[0])) {
      commonData.status = statuses[0];
    }
    
    console.log('📊 Campos comunes detectados:', commonData);
    
    setSelectedModel(commonData);
    setIsBulkEdit(true);
    setFormOpen(true);
  };

  const handleDelete = async (model: AssetModel) => {
    if (window.confirm(`¿Eliminar el modelo "${model.name}"?`)) {
      try {
        await api.delete(`/asset-models/${model.id}`);
        setMessage({ type: 'success', text: 'Modelo eliminado exitosamente' });
        loadModels();
      } catch (error: any) {
        setMessage({
          type: 'error',
          text: `Error al eliminar: ${error.response?.data?.error || error.message}`
        });
      }
    }
  };

  const filteredRows = rows.filter(model =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.manufacturer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.partNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Modelos de Activos (TEST) 🧪
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {selectedIds.length > 0 && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleBulkEdit}
              sx={{
                background: 'linear-gradient(45deg, #FF6B35 30%, #F7931E 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #E55A2B 30%, #E8820A 90%)'
                }
              }}
            >
              Editar ({selectedIds.length})
            </Button>
          )}
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadModels}
            variant="outlined"
          >
            Actualizar
          </Button>
        </Box>
      </Box>

      {/* Mensaje */}
      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Búsqueda */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Buscar por nombre, fabricante o número de parte..."
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
      </Box>

      {/* Tabla */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead sx={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)' }}>
              <TableRow>
                <TableCell padding="checkbox" sx={{ color: 'white' }}>
                  <Checkbox
                    checked={filteredRows.length > 0 && selectedIds.length === filteredRows.length}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < filteredRows.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                  />
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Logo</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Nombre</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Fabricante</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Tipo</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>N° Parte</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Estado</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    No hay modelos
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onChange={(e) => handleSelectOne(row.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>
                      {row.manufacturer?.logo && (
                        <Avatar 
                          src={row.manufacturer.logo} 
                          alt={row.manufacturer.name}
                          sx={{ width: 32, height: 32 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {row.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.manufacturer?.name || '-'}</TableCell>
                    <TableCell>{row.type?.name || '-'}</TableCell>
                    <TableCell>{row.partNumber || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                        color={row.status === 'ACTIVE' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEdit(row)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(row)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* FAB para crear */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(45deg, #FF6B35 30%, #F7931E 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #E55A2B 30%, #E8820A 90%)'
          }
        }}
        onClick={() => {
          setSelectedModel(null);
          setFormOpen(true);
        }}
      >
        <AddIcon />
      </Fab>

      {/* Formulario */}
      <AssetModelFormTest
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedModel(null);
          setIsBulkEdit(false);
        }}
        onSave={() => {
          loadModels();
          setFormOpen(false);
          setSelectedModel(null);
          setIsBulkEdit(false);
          setSelectedIds([]);
          setMessage({ 
            type: 'success', 
            text: isBulkEdit 
              ? `${selectedIds.length} modelos actualizados exitosamente` 
              : (selectedModel ? 'Modelo actualizado exitosamente' : 'Modelo creado exitosamente')
          });
        }}
        initialData={selectedModel}
        isBulkEdit={isBulkEdit}
        selectedIds={selectedIds}
      />
    </Box>
  );
};

export default AssetModelsTest;

