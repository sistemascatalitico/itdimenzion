import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Link as LinkIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '../../../config/api';

interface Connection {
  id: number;
  connectionType: string;
  parentAsset?: {
    id: number;
    name: string;
    assetCode?: string;
    AssetType?: {
      id: number;
      name: string;
    };
  };
  childAsset?: {
    id: number;
    name: string;
    assetCode?: string;
    AssetType?: {
      id: number;
      name: string;
    };
  };
}

interface AssetConnectionsTabProps {
  assetId: number;
}

const AssetConnectionsTab: React.FC<AssetConnectionsTabProps> = ({ assetId }) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConnections = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/assets/${assetId}/connections`);

      if (response.data.success) {
        setConnections(response.data.data || []);
      } else {
        setError('Error al cargar conexiones');
      }
    } catch (err: any) {
      console.error('Error loading connections:', err);
      setError(err.response?.data?.error || 'Error al cargar conexiones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assetId) {
      loadConnections();
    }
  }, [assetId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Conexiones del Activo</Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => {
            // TODO: Implementar modal para agregar conexión
            alert('Funcionalidad de agregar conexión próximamente');
          }}
        >
          Agregar Conexión
        </Button>
      </Box>

      {connections.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <LinkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            No hay conexiones registradas para este activo.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tipo de Conexión</TableCell>
                <TableCell>Activo Relacionado</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Código</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {connections.map((connection) => {
                const relatedAsset = connection.parentAsset || connection.childAsset;
                return (
                  <TableRow key={connection.id} hover>
                    <TableCell>
                      <Chip
                        label={connection.connectionType || 'Sin tipo'}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {relatedAsset?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {relatedAsset?.AssetType?.name ? (
                        <Chip
                          label={relatedAsset.AssetType.name}
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {relatedAsset?.assetCode || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => {
                            // TODO: Implementar vista de detalles
                            alert('Funcionalidad de ver detalles próximamente');
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar conexión">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            // TODO: Implementar eliminación
                            alert('Funcionalidad de eliminar conexión próximamente');
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AssetConnectionsTab;








