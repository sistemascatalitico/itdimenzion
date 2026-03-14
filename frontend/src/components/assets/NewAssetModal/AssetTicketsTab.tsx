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
  Support as TicketsIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import api from '../../../config/api';

interface AssetTicketsTabProps {
  assetId: number;
}

const AssetTicketsTab: React.FC<AssetTicketsTabProps> = ({ assetId }) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/assets/${assetId}/tickets`);

      if (response.data.success) {
        setTickets(response.data.data || []);
      } else {
        setError('Error al cargar tickets');
      }
    } catch (err: any) {
      console.error('Error loading tickets:', err);
      // No mostrar error si el módulo no está implementado
      if (err.response?.status !== 404) {
        setError(err.response?.data?.error || 'Error al cargar tickets');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assetId) {
      loadTickets();
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
        <Typography variant="h6">Tickets Relacionados</Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => {
            alert('Módulo de tickets no implementado aún');
          }}
        >
          Crear Ticket
        </Button>
      </Box>

      {error ? (
        <Alert severity="warning" sx={{ m: 2 }}>
          {error}
        </Alert>
      ) : tickets.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            textAlign: 'center',
            backgroundColor: '#fafafa',
          }}
        >
          <TicketsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Módulo de Tickets
          </Typography>
          <Typography variant="body2" color="text.secondary">
            El módulo de tickets no está implementado aún. Esta funcionalidad estará disponible en una futura versión.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {/* TODO: Implementar lista de tickets cuando el módulo esté disponible */}
        </Box>
      )}
    </Box>
  );
};

export default AssetTicketsTab;








