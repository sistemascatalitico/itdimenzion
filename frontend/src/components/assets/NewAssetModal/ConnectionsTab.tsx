import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  Button,
  Autocomplete,
  TextField,
  Chip,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import assetService from '../../../services/assetService';

interface ConnectionsTabProps {
  config: {
    enabled: boolean;
    types: string[];
    maxConnections?: number;
    mandatoryInDocuments?: boolean;
    allowedCategories?: number[];
  };
  connections: any[];
  onChange: (connections: any[]) => void;
}

const ConnectionsTab: React.FC<ConnectionsTabProps> = ({
  config,
  connections,
  onChange,
}) => {
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [connectionType, setConnectionType] = useState<string>(config.types?.[0] || 'PERIPHERAL');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadAvailableAssets();
  }, []);

  const loadAvailableAssets = async () => {
    try {
      const data = await assetService.list({ status: 'ACTIVE' });
      setAvailableAssets(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('Error loading assets:', error);
    }
  };

  const handleAddConnection = () => {
    if (!selectedAsset) return;

    const newConnection = {
      assetId: selectedAsset.id,
      assetName: selectedAsset.name,
      assetCode: selectedAsset.assetCode,
      connectionType,
      isMandatory: config.mandatoryInDocuments || false,
    };

    const max = config.maxConnections || 10;
    if (connections.length >= max) {
      alert(`No se pueden agregar más de ${max} conexiones`);
      return;
    }

    // Verificar que no esté ya agregado
    if (connections.some(c => c.assetId === selectedAsset.id)) {
      alert('Este activo ya está conectado');
      return;
    }

    onChange([...connections, newConnection]);
    setSelectedAsset(null);
  };

  const handleRemoveConnection = (assetId: number) => {
    onChange(connections.filter(c => c.assetId !== assetId));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Conexiones de Activos
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Vincula otros activos a este activo. {config.mandatoryInDocuments && 'Estas conexiones se incluirán automáticamente en documentos de asignación.'}
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        Máximo de conexiones permitidas: {config.maxConnections || 10}
      </Alert>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Agregar Conexión
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Autocomplete
              options={availableAssets.filter(a => !connections.some(c => c.assetId === a.id))}
              getOptionLabel={(option) => {
                const category = option.AssetType?.AssetGroup?.AssetCategory?.name || option.category?.name || '';
                const typeName = option.AssetType?.name || option.type?.name || '';
                const code = option.assetCode ? ` [${option.assetCode}]` : '';
                return `${option.name}${code}${typeName ? ` - ${typeName}` : ''}${category ? ` (${category})` : ''}`;
              }}
              groupBy={(option) => option.AssetType?.AssetGroup?.AssetCategory?.name || option.category?.name || 'Sin categoría'}
              value={selectedAsset}
              onChange={(_, newValue) => setSelectedAsset(newValue)}
              inputValue={searchText}
              onInputChange={(_, val) => setSearchText(val)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Seleccionar Activo"
                  placeholder="Buscar por nombre, código o tipo..."
                  fullWidth
                />
              )}
              sx={{ flex: 1 }}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
            />
            {config.types.length > 1 && (
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Tipo de Conexión</InputLabel>
                <Select
                  value={connectionType}
                  label="Tipo de Conexión"
                  onChange={(e) => setConnectionType(e.target.value)}
                >
                  {config.types.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type === 'PERIPHERAL' && 'Periférico'}
                      {type === 'ACCESSORY' && 'Accesorio'}
                      {type === 'COMPONENT' && 'Componente'}
                      {type === 'FURNITURE_SET' && 'Conjunto de Mobiliario'}
                      {type === 'RACK_MOUNT' && 'Montado en Rack'}
                      {type === 'VEHICLE_TOOL' && 'Herramienta de Vehículo'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddConnection}
              disabled={!selectedAsset}
            >
              Agregar
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Lista de conexiones */}
      {connections.length > 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Activos Conectados ({connections.length} / {config.maxConnections || 10})
            </Typography>
            <List>
              {connections.map((connection) => (
                <ListItem key={connection.assetId}>
                  <ListItemText
                    primary={connection.assetName}
                    secondary={
                      <Box>
                        <Chip
                          label={connection.connectionType}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        {connection.assetCode && (
                          <Typography variant="caption" color="text.secondary">
                            Código: {connection.assetCode}
                          </Typography>
                        )}
                        {connection.isMandatory && (
                          <Chip
                            label="Obligatorio en documentos"
                            size="small"
                            color="warning"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveConnection(connection.assetId)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info">
          No hay activos conectados. Usa el selector arriba para agregar conexiones.
        </Alert>
      )}
    </Box>
  );
};

export default ConnectionsTab;

