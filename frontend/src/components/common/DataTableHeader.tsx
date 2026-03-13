import React from 'react';
import { TableRow } from '@mui/material';
import { PRIMARY } from '../../theme/themeTokens';

/**
 * Estilo unificado para encabezados de tabla.
 * Uso: <TableRow component={DataTableHeaderRow}> o <TableRow sx={DATA_TABLE_HEADER_SX}>
 */
export const DATA_TABLE_HEADER_SX = {
  backgroundColor: PRIMARY.main,
  '& .MuiTableCell-root': {
    color: 'white',
    fontWeight: 600,
    fontSize: '0.875rem',
  },
} as const;

interface DataTableHeaderRowProps {
  children: React.ReactNode;
}

const DataTableHeaderRow: React.FC<DataTableHeaderRowProps> = ({ children }) => (
  <TableRow sx={DATA_TABLE_HEADER_SX}>{children}</TableRow>
);

export default DataTableHeaderRow;
