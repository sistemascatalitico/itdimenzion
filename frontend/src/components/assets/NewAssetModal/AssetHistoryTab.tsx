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
  Pagination,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Info as InfoIcon,
  Person as PersonIcon,
  Computer as ComputerIcon,
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

interface ChangeHistory {
  id: number;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  changedAt: string;
  changeReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  User?: {
    documentNumber: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AssetHistoryTabProps {
  assetId: number;
}

const AssetHistoryTab: React.FC<AssetHistoryTabProps> = ({ assetId }) => {
  const [history, setHistory] = useState<ChangeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadHistory = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/assets/${assetId}/history`, {
        params: { page: pageNum, limit: 20 },
      });

      if (response.data.success) {
        setHistory(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotal(response.data.pagination?.total || 0);
      } else {
        setError('Error al cargar historial');
      }
    } catch (err: any) {
      console.error('Error loading history:', err);
      setError(err.response?.data?.error || 'Error al cargar historial de cambios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assetId) {
      loadHistory(page);
    }
  }, [assetId, page]);

  const getFieldLabel = (fieldName: string): string => {
    const fieldLabels: Record<string, string> = {
      name: 'Nombre',
      description: 'Descripción',
      serialNumber: 'Número de Serie',
      assetCode: 'Código',
      status: 'Estado',
      condition: 'Condición',
      categoryId: 'Categoría',
      groupId: 'Grupo',
      typeId: 'Tipo',
      modelId: 'Modelo',
      companyId: 'Empresa',
      headquartersId: 'Sede',
      assignedUserId: 'Usuario Asignado',
      processId: 'Proceso',
      jobTitleId: 'Cargo',
      costCenter: 'Centro de Costo',
      location: 'Ubicación',
      purchaseValue: 'Valor de Compra',
      purchaseDate: 'Fecha de Compra',
      warrantyExpiration: 'Vencimiento de Garantía',
      notes: 'Notas',
      commentary: 'Comentario',
      invoiceNumber: 'Número de Factura',
      supplierId: 'Proveedor',
      purchaseCompanyId: 'Empresa de Compra',
      purchasedByCompanyId: 'Comprado por Empresa',
    };
    return fieldLabels[fieldName] || fieldName;
  };

  const formatValue = (value: string | null): string => {
    if (value === null || value === undefined || value === '') {
      return '(vacío)';
    }
    if (value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return value;
  };

  if (loading && history.length === 0) {
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

  if (history.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No hay historial de cambios registrado para este activo.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Historial de Cambios</Typography>
        <Chip label={`${total} cambios`} size="small" color="primary" />
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Campo</TableCell>
              <TableCell>Valor Anterior</TableCell>
              <TableCell>Valor Nuevo</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Razón</TableCell>
              <TableCell>Info</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((change) => (
              <TableRow key={change.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {getFieldLabel(change.fieldName)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'error.main',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                    }}
                  >
                    {formatValue(change.oldValue)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'success.main',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                    }}
                  >
                    {formatValue(change.newValue)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {change.User ? (
                    <Box>
                      <Typography variant="body2">
                        {change.User.firstName} {change.User.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {change.User.email}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {change.changedBy}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(change.changedAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {change.changeReason ? (
                    <Typography variant="body2" color="text.secondary">
                      {change.changeReason}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      Sin razón especificada
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {(change.ipAddress || change.userAgent) && (
                    <Tooltip
                      title={
                        <Box>
                          {change.ipAddress && (
                            <Typography variant="caption" display="block">
                              IP: {change.ipAddress}
                            </Typography>
                          )}
                          {change.userAgent && (
                            <Typography variant="caption" display="block">
                              {change.userAgent}
                            </Typography>
                          )}
                        </Box>
                      }
                    >
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_event, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default AssetHistoryTab;

