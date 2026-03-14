import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  Button,
  Typography,
  Alert,
  CircularProgress,
  FormHelperText
} from '@mui/material';
import { Form, FormField } from '../../stores/formBuilderStore';
import formBuilderService from '../../services/formBuilderService';

interface FormRendererProps {
  form: Form;
  onSubmit: (data: Record<string, any>) => void;
  initialData?: Record<string, any>;
  readOnly?: boolean;
  companyId?: number;
  assetTypeId?: number;
  showActions?: boolean; // Mostrar botones de Guardar/Cancelar
}

const FormRenderer: React.FC<FormRendererProps> = ({
  form,
  onSubmit,
  initialData = {},
  readOnly = false,
  companyId,
  assetTypeId,
  showActions = true
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generatingNumbers, setGeneratingNumbers] = useState(false);

  // Generar números automáticos al montar el componente
  useEffect(() => {
    if (!readOnly && Object.keys(initialData).length === 0) {
      generateAutoNumbers();
    }
  }, [form.id]);

  // Generar números para campos con numeración automática
  const generateAutoNumbers = async () => {
    setGeneratingNumbers(true);
    const fieldsWithNumbering = form.fields.filter(
      field => field.hasAutoNumbering && !formData[field.fieldKey]
    );

    for (const field of fieldsWithNumbering) {
      try {
        const result = await formBuilderService.generateFieldNumber(
          form.id,
          field.id,
          {
            companyId,
            assetTypeId
          }
        );

        setFormData(prev => ({
          ...prev,
          [field.fieldKey]: result.data.generatedNumber
        }));

        console.log(`✅ Número generado para ${field.fieldKey}: ${result.data.generatedNumber}`);
      } catch (error) {
        console.error(`❌ Error generando número para ${field.fieldKey}:`, error);
      }
    }
    setGeneratingNumbers(false);
  };

  // Manejar cambios en campos
  const handleChange = (fieldKey: string, value: any) => {
    const newFormData = {
      ...formData,
      [fieldKey]: value
    };
    
    setFormData(newFormData);

    // Notificar cambio al padre (para integraciones como AssetForm)
    if (!showActions) {
      onSubmit(newFormData);
    }

    // Limpiar error del campo
    if (errors[fieldKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    form.fields.forEach(field => {
      if (field.isRequired && !formData[field.fieldKey]) {
        newErrors[field.fieldKey] = `${field.fieldLabel} es requerido`;
      }

      // Validaciones adicionales según tipo
      if (formData[field.fieldKey]) {
        const value = formData[field.fieldKey];

        if (field.fieldType === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newErrors[field.fieldKey] = 'Email inválido';
          }
        }

        if (field.fieldType === 'phone') {
          const phoneRegex = /^[0-9\s\-\+\(\)]+$/;
          if (!phoneRegex.test(value)) {
            newErrors[field.fieldKey] = 'Teléfono inválido';
          }
        }

        if (field.fieldType === 'number') {
          if (isNaN(Number(value))) {
            newErrors[field.fieldKey] = 'Debe ser un número';
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setLoading(true);
      onSubmit(formData);
      setLoading(false);
    }
  };

  // Agrupar campos por sección
  const fieldsBySection = form.fields.reduce((acc, field) => {
    const section = field.section || 'general';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(field);
    return acc;
  }, {} as Record<string, FormField[]>);

  // Renderizar un campo según su tipo
  const renderField = (field: FormField) => {
    const value = formData[field.fieldKey] || field.defaultValue || '';
    const error = errors[field.fieldKey];
    const isReadOnly = readOnly || field.isReadonly;
    const isHidden = field.isHidden;

    if (isHidden) return null;

    const commonProps = {
      fullWidth: true,
      value,
      onChange: (e: any) => handleChange(field.fieldKey, e.target.value),
      disabled: isReadOnly,
      error: !!error,
      helperText: error || field.helpText,
      label: field.fieldLabel,
      placeholder: field.placeholder,
      required: field.isRequired
    };

    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <TextField
            {...commonProps}
            type={field.fieldType}
          />
        );

      case 'textarea':
        return (
          <TextField
            {...commonProps}
            multiline
            rows={4}
          />
        );

      case 'number':
        return (
          <TextField
            {...commonProps}
            type="number"
          />
        );

      case 'date':
        return (
          <TextField
            {...commonProps}
            type="date"
            InputLabelProps={{ shrink: true }}
          />
        );

      case 'datetime':
        return (
          <TextField
            {...commonProps}
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
          />
        );

      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!value}
                onChange={(e) => handleChange(field.fieldKey, e.target.checked)}
                disabled={isReadOnly}
              />
            }
            label={field.fieldLabel}
          />
        );

      case 'radio':
        return (
          <FormControl component="fieldset" error={!!error} disabled={isReadOnly}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {field.fieldLabel} {field.isRequired && '*'}
            </Typography>
            <RadioGroup
              value={value}
              onChange={(e) => handleChange(field.fieldKey, e.target.value)}
            >
              {(field.options as any[] || []).map((option: any) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
            {(error || field.helpText) && (
              <FormHelperText>{error || field.helpText}</FormHelperText>
            )}
          </FormControl>
        );

      case 'select':
        return (
          <FormControl fullWidth error={!!error} disabled={isReadOnly}>
            <InputLabel>{field.fieldLabel} {field.isRequired && '*'}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleChange(field.fieldKey, e.target.value)}
              label={field.fieldLabel}
            >
              <MenuItem value="">
                <em>Seleccionar...</em>
              </MenuItem>
              {(field.options as any[] || []).map((option: any) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {(error || field.helpText) && (
              <FormHelperText>{error || field.helpText}</FormHelperText>
            )}
          </FormControl>
        );

      case 'multiselect':
        return (
          <FormControl fullWidth error={!!error} disabled={isReadOnly}>
            <InputLabel>{field.fieldLabel} {field.isRequired && '*'}</InputLabel>
            <Select
              multiple
              value={Array.isArray(value) ? value : []}
              onChange={(e) => handleChange(field.fieldKey, e.target.value)}
              label={field.fieldLabel}
            >
              {(field.options as any[] || []).map((option: any) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {(error || field.helpText) && (
              <FormHelperText>{error || field.helpText}</FormHelperText>
            )}
          </FormControl>
        );

      case 'file':
        return (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {field.fieldLabel} {field.isRequired && '*'}
            </Typography>
            <Button variant="outlined" component="label" disabled={isReadOnly}>
              Seleccionar archivo
              <input
                type="file"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleChange(field.fieldKey, file);
                  }
                }}
              />
            </Button>
            {value && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {typeof value === 'string' ? value : value.name}
              </Typography>
            )}
            {(error || field.helpText) && (
              <FormHelperText error={!!error}>{error || field.helpText}</FormHelperText>
            )}
          </Box>
        );

      default:
        return (
          <TextField
            {...commonProps}
            type="text"
          />
        );
    }
  };

  // Renderizar campo en grid según columnPosition
  const renderFieldWithLayout = (field: FormField) => {
    const gridSize = field.columnPosition === 'FULL' ? 12 : 6;

    return (
      <Grid item xs={12} md={gridSize} key={field.id}>
        {renderField(field)}
      </Grid>
    );
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
      {generatingNumbers && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={20} />
            <Typography>Generando códigos automáticos...</Typography>
          </Box>
        </Alert>
      )}

      {/* Renderizar secciones */}
      {Object.entries(fieldsBySection).map(([sectionName, fields]) => (
        <Box key={sectionName} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, textTransform: 'capitalize' }}>
            {sectionName}
          </Typography>

          <Grid container spacing={2}>
            {fields
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map(field => renderFieldWithLayout(field))}
          </Grid>
        </Box>
      ))}

      {/* Botones de acción */}
      {!readOnly && showActions && (
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || generatingNumbers}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => setFormData(initialData)}
            disabled={loading || generatingNumbers}
          >
            Cancelar
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default FormRenderer;

