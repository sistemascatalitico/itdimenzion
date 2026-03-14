import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Switch,
  FormControlLabel,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Form, FormModuleType, FormStatus } from '../../stores/formBuilderStore';
import formBuilderService from '../../services/formBuilderService';
import { useAuth } from '../../hooks/useAuth';
import { companyService } from '../../services/companyService';

interface FormEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: Form;
  isEditMode?: boolean;
}

const FormEditor: React.FC<FormEditorProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  isEditMode = false,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [formData, setFormData] = useState<Partial<Form>>({
    name: '',
    description: '',
    moduleType: 'ASSETS',
    companyId: 0,
    isTemplate: false,
    status: 'DRAFT',
    assetTypeId: undefined,
  });

  useEffect(() => {
    if (open) {
      loadCompanies();
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          moduleType: initialData.moduleType,
          companyId: initialData.companyId,
          isTemplate: initialData.isTemplate || false,
          status: initialData.status || 'DRAFT',
          assetTypeId: initialData.assetTypeId || undefined,
        });
      } else {
        setFormData({
          name: '',
          description: '',
          moduleType: 'ASSETS',
          companyId: 0, // Se seleccionará manualmente
          isTemplate: false,
          status: 'DRAFT',
          assetTypeId: undefined,
        });
      }
      setError(null);
    }
  }, [open, initialData]);

  const loadCompanies = async () => {
    try {
      const data = await companyService.getAll();
      setCompanies(data);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handleChange = (field: keyof Form, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.moduleType || !formData.companyId) {
      setError('Nombre, módulo y empresa son requeridos');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEditMode && initialData?.id) {
        await formBuilderService.updateForm(initialData.id, formData);
      } else {
        await formBuilderService.createForm(formData as any);
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving form:', error);
      setError(error.response?.data?.error || error.message || 'Error al guardar formulario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditMode ? 'Editar Formulario' : 'Nuevo Formulario'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              multiline
              rows={3}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Módulo</InputLabel>
              <Select
                value={formData.moduleType}
                onChange={(e) => handleChange('moduleType', e.target.value)}
                label="Módulo"
              >
                <MenuItem value="ASSETS">Activos</MenuItem>
                <MenuItem value="TICKETS">Tickets</MenuItem>
                <MenuItem value="CRM">CRM</MenuItem>
                <MenuItem value="HR">Recursos Humanos</MenuItem>
                <MenuItem value="SALES">Ventas</MenuItem>
                <MenuItem value="CUSTOM">Personalizado</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Empresa</InputLabel>
              <Select
                value={formData.companyId || ''}
                onChange={(e) => handleChange('companyId', Number(e.target.value))}
                label="Empresa"
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
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                label="Estado"
              >
                <MenuItem value="DRAFT">Borrador</MenuItem>
                <MenuItem value="ACTIVE">Activo</MenuItem>
                <MenuItem value="ARCHIVED">Archivado</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isTemplate || false}
                  onChange={(e) => handleChange('isTemplate', e.target.checked)}
                />
              }
              label="Es plantilla"
            />
          </Grid>

          {formData.moduleType === 'ASSETS' && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Nota: Si este formulario es para un tipo de activo específico, puede asignarlo después de crear el formulario.
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.name || !formData.moduleType || !formData.companyId}
        >
          {loading ? <CircularProgress size={20} /> : isEditMode ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormEditor;

