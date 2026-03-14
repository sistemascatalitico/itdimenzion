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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { FormField, FieldType, AutoFillMode, ColumnPosition, NumberingConfig } from '../../stores/formBuilderStore';
import formBuilderService from '../../services/formBuilderService';

interface FieldEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  formId: number;
  initialData?: FormField;
  isEditMode?: boolean;
}

const FieldEditor: React.FC<FieldEditorProps> = ({
  open,
  onClose,
  onSave,
  formId,
  initialData,
  isEditMode = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldData, setFieldData] = useState<Partial<FormField>>({
    fieldKey: '',
    fieldLabel: '',
    fieldType: 'TEXT',
    isRequired: false,
    isReadonly: false,
    isHidden: false,
    defaultValue: '',
    placeholder: '',
    helpText: '',
    hasAutoNumbering: false,
    section: '',
    displayOrder: 1,
    columnPosition: 'FULL',
  });
  const [numberingConfig, setNumberingConfig] = useState<NumberingConfig>({
    prefix: '',
    suffix: '',
    startNumber: 1,
    minLength: 4,
    resetFrequency: 'NEVER',
    scope: 'GLOBAL',
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFieldData({
          fieldKey: initialData.fieldKey || '',
          fieldLabel: initialData.fieldLabel || '',
          fieldType: initialData.fieldType || 'TEXT',
          isRequired: initialData.isRequired || false,
          isReadonly: initialData.isReadonly || false,
          isHidden: initialData.isHidden || false,
          defaultValue: initialData.defaultValue || '',
          placeholder: initialData.placeholder || '',
          helpText: initialData.helpText || '',
          hasAutoNumbering: initialData.hasAutoNumbering || false,
          section: initialData.section || '',
          displayOrder: initialData.displayOrder || 1,
          columnPosition: initialData.columnPosition || 'FULL',
        });
        if (initialData.numberingConfig) {
          setNumberingConfig(initialData.numberingConfig as NumberingConfig);
        }
      } else {
        setFieldData({
          fieldKey: '',
          fieldLabel: '',
          fieldType: 'TEXT',
          isRequired: false,
          isReadonly: false,
          isHidden: false,
          defaultValue: '',
          placeholder: '',
          helpText: '',
          hasAutoNumbering: false,
          section: '',
          displayOrder: 1,
          columnPosition: 'FULL',
        });
        setNumberingConfig({
          prefix: '',
          suffix: '',
          startNumber: 1,
          minLength: 4,
          resetFrequency: 'NEVER',
          scope: 'GLOBAL',
        });
      }
      setError(null);
    }
  }, [open, initialData]);

  const handleChange = (field: keyof FormField, value: any) => {
    setFieldData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberingConfigChange = (field: keyof NumberingConfig, value: any) => {
    setNumberingConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!fieldData.fieldKey || !fieldData.fieldLabel || !fieldData.fieldType) {
      setError('Clave, etiqueta y tipo de campo son requeridos');
      return;
    }

    // Validar formato de fieldKey (solo letras, números y guiones bajos)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldData.fieldKey)) {
      setError('La clave del campo debe comenzar con letra o guión bajo y solo contener letras, números y guiones bajos');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const dataToSend: any = {
        ...fieldData,
        numberingConfig: fieldData.hasAutoNumbering ? numberingConfig : null,
      };

      if (isEditMode && initialData?.id) {
        await formBuilderService.updateFormField(formId, initialData.id, dataToSend);
      } else {
        await formBuilderService.createFormField(formId, dataToSend);
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving field:', error);
      setError(error.response?.data?.error || error.message || 'Error al guardar campo');
    } finally {
      setLoading(false);
    }
  };

  const fieldTypes: { value: FieldType; label: string }[] = [
    { value: 'TEXT', label: 'Texto' },
    { value: 'TEXTAREA', label: 'Área de texto' },
    { value: 'NUMBER', label: 'Número' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'PHONE', label: 'Teléfono' },
    { value: 'DATE', label: 'Fecha' },
    { value: 'DATETIME', label: 'Fecha y hora' },
    { value: 'CHECKBOX', label: 'Casilla de verificación' },
    { value: 'RADIO', label: 'Radio' },
    { value: 'SELECT', label: 'Selección' },
    { value: 'MULTISELECT', label: 'Selección múltiple' },
    { value: 'FILE', label: 'Archivo' },
    { value: 'USER_SELECT', label: 'Seleccionar usuario' },
    { value: 'COMPANY_SELECT', label: 'Seleccionar empresa' },
    { value: 'LOCATION_SELECT', label: 'Seleccionar ubicación' },
    { value: 'DEPARTMENT_SELECT', label: 'Seleccionar departamento' },
    { value: 'ASSET_SELECT', label: 'Seleccionar activo' },
    { value: 'PROCESS_SELECT', label: 'Seleccionar proceso' },
    { value: 'JOB_TITLE_SELECT', label: 'Seleccionar cargo' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditMode ? 'Editar Campo' : 'Nuevo Campo'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Información básica */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Información Básica
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Clave del campo"
              value={fieldData.fieldKey}
              onChange={(e) => handleChange('fieldKey', e.target.value)}
              required
              disabled={isEditMode}
              helperText="Solo letras, números y guiones bajos. Debe comenzar con letra o guión bajo."
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Etiqueta"
              value={fieldData.fieldLabel}
              onChange={(e) => handleChange('fieldLabel', e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Tipo de campo</InputLabel>
              <Select
                value={fieldData.fieldType}
                onChange={(e) => handleChange('fieldType', e.target.value)}
                label="Tipo de campo"
              >
                {fieldTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Posición de columna</InputLabel>
              <Select
                value={fieldData.columnPosition}
                onChange={(e) => handleChange('columnPosition', e.target.value)}
                label="Posición de columna"
              >
                <MenuItem value="FULL">Completa</MenuItem>
                <MenuItem value="LEFT">Izquierda</MenuItem>
                <MenuItem value="RIGHT">Derecha</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Opciones */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Opciones
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={fieldData.isRequired || false}
                  onChange={(e) => handleChange('isRequired', e.target.checked)}
                />
              }
              label="Requerido"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={fieldData.isReadonly || false}
                  onChange={(e) => handleChange('isReadonly', e.target.checked)}
                />
              }
              label="Solo lectura"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={fieldData.isHidden || false}
                  onChange={(e) => handleChange('isHidden', e.target.checked)}
                />
              }
              label="Oculto"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Valor por defecto"
              value={fieldData.defaultValue || ''}
              onChange={(e) => handleChange('defaultValue', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Placeholder"
              value={fieldData.placeholder || ''}
              onChange={(e) => handleChange('placeholder', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Texto de ayuda"
              value={fieldData.helpText || ''}
              onChange={(e) => handleChange('helpText', e.target.value)}
              multiline
              rows={2}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Sección"
              value={fieldData.section || ''}
              onChange={(e) => handleChange('section', e.target.value)}
              helperText="Agrupa campos en secciones"
            />
          </Grid>

          {/* Numeración incremental */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Numeración Incremental
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={fieldData.hasAutoNumbering || false}
                  onChange={(e) => handleChange('hasAutoNumbering', e.target.checked)}
                />
              }
              label="Activar numeración incremental"
            />
          </Grid>

          {fieldData.hasAutoNumbering && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Prefijo"
                  value={numberingConfig.prefix || ''}
                  onChange={(e) => handleNumberingConfigChange('prefix', e.target.value)}
                  helperText="Ej: ASG-2025-"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sufijo"
                  value={numberingConfig.suffix || ''}
                  onChange={(e) => handleNumberingConfigChange('suffix', e.target.value)}
                  helperText="Ej: -DOC"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Número inicial"
                  value={numberingConfig.startNumber || 1}
                  onChange={(e) => handleNumberingConfigChange('startNumber', Number(e.target.value))}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Longitud mínima"
                  value={numberingConfig.minLength || 4}
                  onChange={(e) => handleNumberingConfigChange('minLength', Number(e.target.value))}
                  helperText="Ej: 4 = 0001"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Frecuencia de reinicio</InputLabel>
                  <Select
                    value={numberingConfig.resetFrequency || 'NEVER'}
                    onChange={(e) => handleNumberingConfigChange('resetFrequency', e.target.value)}
                    label="Frecuencia de reinicio"
                  >
                    <MenuItem value="NEVER">Nunca</MenuItem>
                    <MenuItem value="YEARLY">Anual</MenuItem>
                    <MenuItem value="MONTHLY">Mensual</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Alcance</InputLabel>
                  <Select
                    value={numberingConfig.scope || 'GLOBAL'}
                    onChange={(e) => handleNumberingConfigChange('scope', e.target.value)}
                    label="Alcance"
                  >
                    <MenuItem value="GLOBAL">Global (todos los activos)</MenuItem>
                    <MenuItem value="ASSET_TYPE">Por tipo de activo</MenuItem>
                    <MenuItem value="COMPANY">Por empresa</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
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
          disabled={loading || !fieldData.fieldKey || !fieldData.fieldLabel || !fieldData.fieldType}
        >
          {loading ? <CircularProgress size={20} /> : isEditMode ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FieldEditor;

