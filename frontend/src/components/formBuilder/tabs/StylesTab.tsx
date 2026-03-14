import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { Form } from '../../../stores/formBuilderStore';

interface StylesTabProps {
  form: Form | null;
  onUpdate: (updates: Partial<Form>) => void;
}

const StylesTab: React.FC<StylesTabProps> = ({ form, onUpdate }) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Estilos de Formulario
      </Typography>

      <Alert severity="info">
        <Typography variant="body2">
          <strong>Próximamente:</strong> Editor de estilos completo con:
        </Typography>
        <ul style={{ marginTop: 8, marginBottom: 0 }}>
          <li>Branding (logo, posición, tamaño)</li>
          <li>Estilos de campos (colores, bordes, fuentes)</li>
          <li>Estilos de botones</li>
          <li>Fondo del formulario</li>
          <li>Barra de progreso</li>
        </ul>
      </Alert>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Esta funcionalidad se implementará en la <strong>FASE 6.4</strong>.
      </Typography>
    </Box>
  );
};

export default StylesTab;


