import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Paper,
} from '@mui/material';
import {
  Description as DocumentIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import api from '../../../config/api';
// Formateo de fechas sin date-fns (usando Date nativo)
const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

interface Document {
  id: number;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
}

interface AssetDocumentsTabProps {
  assetId: number;
}

const AssetDocumentsTab: React.FC<AssetDocumentsTabProps> = ({ assetId }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      // Usar el endpoint de documentos del activo
      const response = await api.get(`/assets/${assetId}/documents`);

      if (response.data.success || Array.isArray(response.data)) {
        setDocuments(Array.isArray(response.data) ? response.data : response.data.data || []);
      } else {
        setError('Error al cargar documentos');
      }
    } catch (err: any) {
      console.error('Error loading documents:', err);
      setError(err.response?.data?.error || 'Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assetId) {
      loadDocuments();
    }
  }, [assetId]);

  const getDocumentTypeLabel = (type: string): string => {
    const typeLabels: Record<string, string> = {
      INVOICE: 'Factura',
      CONTRACT: 'Contrato',
      WARRANTY: 'Garantía',
      DELIVERY: 'Entrega',
      TRANSFER: 'Transferencia',
      PHOTO: 'Foto',
      OTHER: 'Otro',
    };
    return typeLabels[type] || type;
  };

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
        <Typography variant="h6">Documentos del Activo</Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => {
            // TODO: Implementar modal para agregar documento
            alert('Funcionalidad de agregar documento próximamente');
          }}
        >
          Agregar Documento
        </Button>
      </Box>

      {documents.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <DocumentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            No hay documentos registrados para este activo.
          </Typography>
        </Box>
      ) : (
        <Paper variant="outlined">
          <List>
            {documents.map((doc) => (
              <ListItem key={doc.id} divider>
                <DocumentIcon sx={{ mr: 2, color: 'text.secondary' }} />
                <ListItemText
                  primary={doc.name}
                  secondary={
                    <Box>
                      <Chip
                        label={getDocumentTypeLabel(doc.type)}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(doc.uploadedAt)}
                        {doc.uploadedBy && ` • Por: ${doc.uploadedBy}`}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Descargar">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => {
                        window.open(doc.url, '_blank');
                      }}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton
                      edge="end"
                      size="small"
                      color="error"
                      onClick={() => {
                        // TODO: Implementar eliminación
                        alert('Funcionalidad de eliminar documento próximamente');
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default AssetDocumentsTab;

