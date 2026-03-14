import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import ModalHeader from '../common/ModalHeader';
import api from '../../config/api';
import { PRIMARY } from '../../theme/themeTokens';
import { Process } from '../../services/processService';
import { Company } from '../../services/companyService';

interface ProcessFormData {
  name: string;
  companyId: number;
  commentary: string;
}

interface ProcessFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ProcessFormData) => void;
  initialData?: Process | null;
  isEditMode?: boolean;
  companies: Company[];
}

const ProcessForm: React.FC<ProcessFormProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  isEditMode = false,
  companies,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState<ProcessFormData>({
    name: '',
    companyId: companies.length > 0 ? companies[0].id : 0,
    commentary: '',
  });

  useEffect(() => {
    if (initialData && isEditMode) {
      setFormData({
        name: initialData.name || '',
        companyId: initialData.companyId || (companies.length > 0 ? companies[0].id : 0),
        commentary: initialData.commentary || '',
      });
    } else {
      setFormData({
        name: '',
        companyId: companies.length > 0 ? companies[0].id : 0,
        commentary: '',
      });
    }
  }, [initialData, isEditMode, open, companies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'El nombre del proceso es obligatorio' });
      return;
    }

    if (!formData.companyId) {
      setMessage({ type: 'error', text: 'Debe seleccionar una empresa' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      await onSave(formData);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Error al guardar el proceso: ' + (error.response?.data?.error || error.message)
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setMessage(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth disableEnforceFocus>
      <ModalHeader
        title={isEditMode ? 'Editar Proceso' : 'Nuevo Proceso'}
        onClose={handleClose}
        gradientColor="orange"
      />
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {message && (
            <Alert severity={message.type} sx={{ mb: 2 }}>
              {message.text}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Información Básica */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: PRIMARY.main }}>
                Información del Proceso
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre del Proceso *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: PRIMARY.main },
                    '&.Mui-focused fieldset': { borderColor: PRIMARY.main }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Empresa *</InputLabel>
                <Select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value as number })}
                  label="Empresa *"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: PRIMARY.main },
                      '&.Mui-focused fieldset': { borderColor: PRIMARY.main }
                    }
                  }}
                >
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción del Proceso"
                multiline
                rows={4}
                value={formData.commentary}
                onChange={(e) => setFormData({ ...formData, commentary: e.target.value })}
                placeholder="Describe el proceso, sus objetivos y características principales..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: PRIMARY.main },
                    '&.Mui-focused fieldset': { borderColor: PRIMARY.main }
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={handleClose} 
            color="inherit"
            startIcon={<CancelIcon />}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{
              backgroundColor: PRIMARY.main,
              '&:hover': { backgroundColor: '#F57C00' }
            }}
          >
            {saving ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProcessForm;
