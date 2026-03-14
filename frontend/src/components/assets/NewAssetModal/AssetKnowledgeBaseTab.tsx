import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
} from '@mui/material';
import {
  MenuBook as KnowledgeBaseIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import api from '../../../config/api';

interface AssetKnowledgeBaseTabProps {
  assetId: number;
}

const AssetKnowledgeBaseTab: React.FC<AssetKnowledgeBaseTabProps> = ({ assetId }) => {
  const [knowledgeBase, setKnowledgeBase] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadKnowledgeBase = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/assets/${assetId}/knowledge-base`);

      if (response.data.success) {
        setKnowledgeBase(response.data.data || []);
      } else {
        setError('Error al cargar base de conocimiento');
      }
    } catch (err: any) {
      console.error('Error loading knowledge base:', err);
      // No mostrar error si el módulo no está implementado
      if (err.response?.status !== 404) {
        setError(err.response?.data?.error || 'Error al cargar base de conocimiento');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assetId) {
      loadKnowledgeBase();
    }
  }, [assetId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Base de Conocimiento</Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => {
            alert('Módulo de base de conocimiento no implementado aún');
          }}
        >
          Agregar Entrada
        </Button>
      </Box>

      {error ? (
        <Alert severity="warning" sx={{ m: 2 }}>
          {error}
        </Alert>
      ) : knowledgeBase.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            textAlign: 'center',
            backgroundColor: '#fafafa',
          }}
        >
          <KnowledgeBaseIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Base de Conocimiento
          </Typography>
          <Typography variant="body2" color="text.secondary">
            El módulo de base de conocimiento no está implementado aún. Esta funcionalidad estará disponible en una futura versión.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {/* TODO: Implementar lista de entradas cuando el módulo esté disponible */}
        </Box>
      )}
    </Box>
  );
};

export default AssetKnowledgeBaseTab;








