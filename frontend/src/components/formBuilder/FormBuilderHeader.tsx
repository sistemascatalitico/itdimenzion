import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  TextField,
  Chip,
  Button,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { Form } from '../../stores/formBuilderStore';

interface FormBuilderHeaderProps {
  form: Form | null;
  onSave: () => Promise<void>;
  onPreview: () => void;
  onClose: () => void;
  saving?: boolean;
  onUpdateForm: (updates: Partial<Form>) => void;
}

const FormBuilderHeader: React.FC<FormBuilderHeaderProps> = ({
  form,
  onSave,
  onPreview,
  onClose,
  saving = false,
  onUpdateForm,
}) => {
  const [formName, setFormName] = useState(form?.name || '');

  useEffect(() => {
    setFormName(form?.name || '');
  }, [form?.name]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormName(newName);
    onUpdateForm({ name: newName });
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activo';
      case 'DRAFT':
        return 'Borrador';
      case 'ARCHIVED':
        return 'Archivado';
      default:
        return 'Borrador';
    }
  };

  const getStatusColor = (status?: string): 'success' | 'warning' | 'default' => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'DRAFT':
        return 'warning';
      case 'ARCHIVED':
        return 'default';
      default:
        return 'warning';
    }
  };

  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        {/* Left: Volver + Nombre + Estado */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
          <IconButton onClick={onClose} edge="start" aria-label="volver" color="inherit">
            <ArrowBackIcon />
          </IconButton>

          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />

          <TextField
            value={formName}
            onChange={handleNameChange}
            variant="standard"
            placeholder="Nombre del formulario"
            sx={{
              minWidth: 200,
              maxWidth: 400,
              flex: 1,
              '& .MuiInputBase-input': {
                color: 'white',
                fontSize: 18,
                fontWeight: 500
              },
              '& .MuiInput-underline:before': { borderBottomColor: 'rgba(255,255,255,0.5)' },
              '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: 'white' },
              '& .MuiInput-underline:after': { borderBottomColor: 'white' },
            }}
            InputProps={{
              disableUnderline: false,
            }}
          />

          <Chip
            label={getStatusLabel(form?.status)}
            size="small"
            color={getStatusColor(form?.status)}
          />

          {form?.version && (
            <Chip
              label={`v${form.version}`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        {/* Right: Acciones */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={onPreview}
            disabled={saving}
          >
            Vista Previa
          </Button>

          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={onSave}
            disabled={saving || !formName.trim()}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default FormBuilderHeader;


