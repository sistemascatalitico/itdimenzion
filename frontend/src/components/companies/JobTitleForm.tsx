import React, { useState, useEffect, useMemo } from 'react';
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
import { JobTitle } from '../../services/jobTitleService';
import { Company } from '../../services/companyService';
import { Process } from '../../services/processService';

interface JobTitleFormData {
  name: string;
  companyId: number;
  processId: number;
  commentary: string;
}

interface JobTitleFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: JobTitleFormData) => void;
  initialData?: JobTitle | null;
  isEditMode?: boolean;
  companies: Company[];
  processes: Process[];
}

const JobTitleForm: React.FC<JobTitleFormProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  isEditMode = false,
  companies,
  processes,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState<JobTitleFormData>({
    name: '',
    companyId: companies.length > 0 ? companies[0].id : 0,
    processId: 0,
    commentary: '',
  });

  // Filtrar procesos por empresa seleccionada
  const filteredProcesses = useMemo(() => 
    processes.filter(process => process.companyId === formData.companyId),
    [processes, formData.companyId]
  );

  useEffect(() => {
    if (initialData && isEditMode) {
      setFormData({
        name: initialData.name || '',
        companyId: initialData.companyId || (companies.length > 0 ? companies[0].id : 0),
        processId: initialData.processId || 0,
        commentary: initialData.commentary || '',
      });
    } else {
      setFormData({
        name: '',
        companyId: companies.length > 0 ? companies[0].id : 0,
        processId: 0,
        commentary: '',
      });
    }
  }, [initialData, isEditMode, open, companies]);

  // Reset process when company changes
  useEffect(() => {
    if (formData.companyId && !filteredProcesses.find(p => p.id === formData.processId)) {
      setFormData(prev => ({ ...prev, processId: 0 }));
    }
  }, [formData.companyId, filteredProcesses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'El nombre del cargo es obligatorio' });
      return;
    }

    if (!formData.companyId) {
      setMessage({ type: 'error', text: 'Debe seleccionar una empresa' });
      return;
    }

    if (!formData.processId) {
      setMessage({ type: 'error', text: 'Debe seleccionar un proceso' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      await onSave(formData);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Error al guardar el cargo: ' + (error.response?.data?.error || error.message)
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
        title={isEditMode ? 'Editar Cargo' : 'Nuevo Cargo'}
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
                Información del Cargo
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre del Cargo *"
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

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Proceso *</InputLabel>
                <Select
                  value={formData.processId}
                  onChange={(e) => setFormData({ ...formData, processId: e.target.value as number })}
                  label="Proceso *"
                  disabled={!formData.companyId || filteredProcesses.length === 0}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: PRIMARY.main },
                      '&.Mui-focused fieldset': { borderColor: PRIMARY.main }
                    }
                  }}
                >
                  {filteredProcesses.length === 0 ? (
                    <MenuItem disabled>
                      {!formData.companyId ? 'Selecciona una empresa primero' : 'No hay procesos disponibles'}
                    </MenuItem>
                  ) : (
                    filteredProcesses.map((process) => (
                      <MenuItem key={process.id} value={process.id}>
                        {process.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción del Cargo"
                multiline
                rows={4}
                value={formData.commentary}
                onChange={(e) => setFormData({ ...formData, commentary: e.target.value })}
                placeholder="Describe las responsabilidades, funciones y características del cargo..."
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
              '&:hover': { backgroundColor: '#7B1FA2' }
            }}
          >
            {saving ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default JobTitleForm;
