import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Chip,
  IconButton,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import ModalHeader from '../common/ModalHeader';
import customFieldService from '../../services/customFieldService';

interface CustomField {
  id?: number;
  key: string;
  label: string;
  type: string;
  description?: string;
  config?: any;
  status?: string;
  CustomFieldOption?: CustomFieldOption[];
}

interface CustomFieldOption {
  id?: number;
  value: string;
  label: string;
  order: number;
  isActive: boolean;
}

interface CustomFieldFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: CustomField | null;
}

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Texto Corto' },
  { value: 'TEXTAREA', label: 'Texto Largo' },
  { value: 'NUMBER', label: 'Número Entero' },
  { value: 'DECIMAL', label: 'Número Decimal' },
  { value: 'CAPACITY', label: 'Capacidad (con unidad)' },
  { value: 'SELECT', label: 'Lista Desplegable' },
  { value: 'MULTISELECT', label: 'Selección Múltiple' },
  { value: 'CHECKBOX', label: 'Sí/No' },
  { value: 'DATE', label: 'Fecha' },
  { value: 'DATETIME', label: 'Fecha y Hora' },
  { value: 'URL', label: 'Enlace' },
  { value: 'EMAIL', label: 'Correo Electrónico' },
  { value: 'PHONE', label: 'Teléfono' },
  { value: 'COLOR', label: 'Color' },
];

const CAPACITY_UNITS = ['GB', 'MB', 'TB', 'L', 'ml', 'kg', 'g', 'Mbps', 'cc', 'kWh', 'W', 'V', 'A', 'Hz', 'ppm', 'pulgadas', 'cm', 'mm'];

const KEY_REGEX = /^[a-z][a-z0-9_]{1,63}$/;

const CustomFieldForm: React.FC<CustomFieldFormProps> = ({
  open,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState<Partial<CustomField>>({
    key: '', label: '', type: 'TEXT', description: '', status: 'ACTIVE', config: {},
  });
  const [options, setOptions] = useState<CustomFieldOption[]>([]);
  const [newOption, setNewOption] = useState({ value: '', label: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setFormData({
        key: initialData.key || '',
        label: initialData.label || '',
        type: initialData.type || 'TEXT',
        description: initialData.description || '',
        status: initialData.status || 'ACTIVE',
        config: initialData.config || {},
      });
      const existingOpts = initialData.CustomFieldOption || initialData.config?.options || [];
      setOptions(existingOpts.map((o: any, i: number) => ({
        id: o.id, value: o.value, label: o.label, order: o.order ?? i + 1, isActive: o.isActive ?? true,
      })));
    } else {
      setFormData({ key: '', label: '', type: 'TEXT', description: '', status: 'ACTIVE', config: {} });
      setOptions([]);
    }
    setNewOption({ value: '', label: '' });
    setErrors({});
  }, [initialData, open]);

  const handleChange = (field: string, value: any) => {
    if (field === 'type' && value !== formData.type) {
      setFormData(prev => ({ ...prev, [field]: value, config: {} }));
      setOptions([]);
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleConfigChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, config: { ...prev.config, [field]: value } }));
  };

  const generateKeyFromLabel = (label: string) =>
    label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  const handleLabelChange = (value: string) => {
    handleChange('label', value);
    if (!initialData?.id) handleChange('key', generateKeyFromLabel(value));
  };

  const handleAddOption = () => {
    if (!newOption.value.trim() || !newOption.label.trim()) {
      setErrors(prev => ({ ...prev, options: 'Value y Label son requeridos' }));
      return;
    }
    if (options.some(o => o.value === newOption.value.trim())) {
      setErrors(prev => ({ ...prev, options: `Ya existe una opción con value "${newOption.value.trim()}"` }));
      return;
    }
    setOptions(prev => [...prev, { value: newOption.value.trim(), label: newOption.label.trim(), order: prev.length + 1, isActive: true }]);
    setNewOption({ value: '', label: '' });
    setErrors(prev => ({ ...prev, options: '' }));
  };

  const handleRemoveOption = (index: number) => {
    setOptions(prev => prev.filter((_, i) => i !== index).map((opt, i) => ({ ...opt, order: i + 1 })));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.key?.trim()) e.key = 'Key es requerido';
    else if (!KEY_REGEX.test(formData.key)) e.key = 'Formato: snake_case (a-z, 0-9, _), iniciar con letra, 2-64 caracteres';
    if (!formData.label?.trim()) e.label = 'Etiqueta es requerida';
    if (!formData.type) e.type = 'Tipo es requerido';
    if ((formData.type === 'SELECT' || formData.type === 'MULTISELECT') && options.length === 0)
      e.options = 'Debe agregar al menos una opción';
    if (formData.type === 'CAPACITY' && !formData.config?.unit)
      e.unit = 'La unidad de medida es obligatoria para campos de capacidad';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      const payload = {
        key: formData.key!.trim(),
        label: formData.label!.trim(),
        type: formData.type,
        description: formData.description?.trim() || null,
        config: formData.config || {},
        status: formData.status || 'ACTIVE',
      };

      let savedField: any;
      if (initialData?.id) {
        savedField = await customFieldService.updateField(initialData.id, payload);
      } else {
        savedField = await customFieldService.createField(payload);
      }

      if (['SELECT', 'MULTISELECT'].includes(formData.type!) && savedField?.id) {
        for (const opt of options) {
          if (!opt.id) {
            await customFieldService.addOption(savedField.id, {
              value: opt.value, label: opt.label, order: opt.order,
            });
          }
        }
      }

      onSave();
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message || 'Error al guardar';
      setErrors({ submit: msg });
    } finally {
      setSaving(false);
    }
  };

  const isEditing = !!initialData?.id;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 1, maxHeight: '90vh', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)' } }}>
      <ModalHeader title={isEditing ? 'Editar Campo Personalizado' : 'Crear Campo Personalizado'} onClose={onClose} gradientColor="orange" />

      <DialogContent dividers sx={{ p: 3 }}>
        {errors.submit && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrors(prev => ({ ...prev, submit: '' }))}>{errors.submit}</Alert>}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Etiqueta *" value={formData.label} onChange={(e) => handleLabelChange(e.target.value)}
              error={!!errors.label} helperText={errors.label || 'Nombre visible del campo'}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Key *" value={formData.key}
              onChange={(e) => handleChange('key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              error={!!errors.key}
              helperText={errors.key || (isEditing ? 'No se puede cambiar el key' : 'Identificador único (ej: ram_capacity)')}
              disabled={isEditing}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1, fontFamily: 'monospace' } }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.type} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}>
              <InputLabel>Tipo de Campo *</InputLabel>
              <Select value={formData.type} onChange={(e) => handleChange('type', e.target.value)} label="Tipo de Campo *"
                disabled={isEditing}>
                {FIELD_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
              {isEditing && <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary' }}>No se puede cambiar si hay valores registrados</Typography>}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}>
              <InputLabel>Estado</InputLabel>
              <Select value={formData.status || 'ACTIVE'} onChange={(e) => handleChange('status', e.target.value)} label="Estado">
                <MenuItem value="ACTIVE">Activo</MenuItem>
                <MenuItem value="INACTIVE">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField fullWidth label="Descripción" value={formData.description} onChange={(e) => handleChange('description', e.target.value)}
              multiline rows={2} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }} />
          </Grid>

          {(formData.type === 'NUMBER' || formData.type === 'DECIMAL') && (
            <>
              <Grid item xs={12} md={4}>
                <TextField fullWidth type="number" label="Mínimo" value={formData.config?.min ?? ''}
                  onChange={(e) => handleConfigChange('min', e.target.value ? Number(e.target.value) : undefined)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth type="number" label="Máximo" value={formData.config?.max ?? ''}
                  onChange={(e) => handleConfigChange('max', e.target.value ? Number(e.target.value) : undefined)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth type="number" label="Paso (Step)" value={formData.config?.step ?? ''}
                  onChange={(e) => handleConfigChange('step', e.target.value ? Number(e.target.value) : undefined)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }} />
              </Grid>
            </>
          )}

          {formData.type === 'CAPACITY' && (
            <>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth error={!!errors.unit} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}>
                  <InputLabel>Unidad *</InputLabel>
                  <Select value={formData.config?.unit || ''} onChange={(e) => handleConfigChange('unit', e.target.value)} label="Unidad *">
                    {CAPACITY_UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                  </Select>
                  {errors.unit && <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>{errors.unit}</Typography>}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth type="number" label="Mínimo" value={formData.config?.min ?? ''}
                  onChange={(e) => handleConfigChange('min', e.target.value ? Number(e.target.value) : undefined)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth type="number" label="Máximo" value={formData.config?.max ?? ''}
                  onChange={(e) => handleConfigChange('max', e.target.value ? Number(e.target.value) : undefined)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth type="number" label="Paso (Step)" value={formData.config?.step ?? ''}
                  onChange={(e) => handleConfigChange('step', e.target.value ? Number(e.target.value) : undefined)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }} />
              </Grid>
            </>
          )}

          {formData.type === 'TEXT' && (
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="number" label="Longitud Máxima" value={formData.config?.maxLength ?? ''}
                onChange={(e) => handleConfigChange('maxLength', e.target.value ? Number(e.target.value) : undefined)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }} />
            </Grid>
          )}

          {formData.type === 'TEXTAREA' && (
            <>
              <Grid item xs={12} md={6}>
                <TextField fullWidth type="number" label="Filas" value={formData.config?.rows || 4}
                  onChange={(e) => handleConfigChange('rows', Number(e.target.value))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth type="number" label="Longitud Máxima" value={formData.config?.maxLength ?? ''}
                  onChange={(e) => handleConfigChange('maxLength', e.target.value ? Number(e.target.value) : undefined)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }} />
              </Grid>
            </>
          )}

          {(formData.type === 'SELECT' || formData.type === 'MULTISELECT') && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Opciones {formData.type === 'SELECT' ? '(Lista Desplegable)' : '(Selección Múltiple)'}
              </Typography>
              {errors.options && <Alert severity="error" sx={{ mb: 2 }}>{errors.options}</Alert>}

              {options.map((option, index) => (
                <Paper key={option.id || index} sx={{ p: 2, mb: 1, borderRadius: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <DragIcon sx={{ color: 'text.secondary' }} />
                  <Chip label={option.order} size="small" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{option.label}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{option.value}</Typography>
                  </Box>
                  {option.id && <Chip label="Guardado" size="small" color="success" variant="outlined" />}
                  <IconButton size="small" onClick={() => handleRemoveOption(index)} sx={{ color: '#F44336' }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Paper>
              ))}

              <Paper sx={{ p: 2, mt: 2, borderRadius: 1, backgroundColor: 'rgba(255, 107, 107, 0.04)' }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Agregar Opción</Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Value *" value={newOption.value}
                      onChange={(e) => setNewOption(p => ({ ...p, value: e.target.value }))} placeholder="Ej: windows_11"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1, fontFamily: 'monospace' } }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Label *" value={newOption.label}
                      onChange={(e) => setNewOption(p => ({ ...p, label: e.target.value }))} placeholder="Ej: Windows 11"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }} />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={handleAddOption}
                      sx={{ borderRadius: 1, height: '56px', background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)',
                        '&:hover': { background: 'linear-gradient(135deg, #FF5252 0%, #FF7043 100%)' } }}>
                      Agregar
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button onClick={onClose} variant="outlined"
          sx={{ borderColor: '#FF6B6B', color: '#FF6B6B', borderRadius: 1,
            '&:hover': { borderColor: '#FF5252', backgroundColor: 'rgba(255, 107, 107, 0.04)' } }}>
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}
          sx={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)', color: 'white', px: 4, py: 1.5, borderRadius: 1, fontWeight: 600,
            '&:hover': { background: 'linear-gradient(135deg, #FF5252 0%, #FF7043 100%)' },
            '&:disabled': { background: 'rgba(0, 0, 0, 0.12)' } }}>
          {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : isEditing ? 'Actualizar' : 'Crear Campo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomFieldForm;
