import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  Divider,
} from '@mui/material';
import { Form, FormStatus } from '../../../stores/formBuilderStore';

interface SettingsTabProps {
  form: Form | null;
  onUpdate: (updates: Partial<Form>) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ form, onUpdate }) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Configuración del Formulario
      </Typography>

      {/* Estado */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Estado</InputLabel>
        <Select
          value={form?.status || 'DRAFT'}
          onChange={(e) => onUpdate({ status: e.target.value as FormStatus })}
          label="Estado"
        >
          <MenuItem value="DRAFT">Borrador</MenuItem>
          <MenuItem value="ACTIVE">Activo</MenuItem>
          <MenuItem value="ARCHIVED">Archivado</MenuItem>
        </Select>
      </FormControl>

      {/* Es plantilla */}
      <FormControlLabel
        control={
          <Switch
            checked={form?.isTemplate || false}
            onChange={(e) => onUpdate({ isTemplate: e.target.checked })}
          />
        }
        label="Es plantilla"
        sx={{ mb: 2 }}
      />

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
        Las plantillas pueden ser reutilizadas para crear nuevos formularios rápidamente.
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* Configuración avanzada (próximamente) */}
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Configuración Avanzada
      </Typography>

      <Alert severity="info">
        <Typography variant="body2">
          <strong>Próximamente:</strong> Configuración avanzada con:
        </Typography>
        <ul style={{ marginTop: 8, marginBottom: 0 }}>
          <li>Notificaciones por correo</li>
          <li>Destinatarios personalizados</li>
          <li>Dominios bloqueados</li>
          <li>Creación automática de tickets</li>
          <li>Idioma y región</li>
        </ul>
      </Alert>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Esta funcionalidad se implementará en la <strong>FASE 6.6</strong>.
      </Typography>
    </Box>
  );
};

export default SettingsTab;


