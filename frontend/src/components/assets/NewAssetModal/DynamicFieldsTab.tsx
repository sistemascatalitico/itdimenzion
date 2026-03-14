import React from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Button,
  Chip,
  Card,
  CardContent,
  Divider,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import DynamicField from './DynamicField';

interface DynamicFieldsTabProps {
  fields: any[];
  reusableFields: any[];
  values: Record<string, any>;
  errors: Record<string, string>;
  onChange: (key: string, value: any) => void;
  onInvokeField: (fieldId: number) => void;
  loading?: boolean;
}

const DynamicFieldsTab: React.FC<DynamicFieldsTabProps> = ({
  fields,
  reusableFields,
  values,
  errors,
  onChange,
  onInvokeField,
  loading = false,
}) => {
  // Logs de depuración
  React.useEffect(() => {
    console.log('🔍 DynamicFieldsTab - Campos recibidos:', {
      totalFields: fields.length,
      fields: fields,
      reusableFields: reusableFields.length,
      values: values
    });
  }, [fields, reusableFields, values]);

  // Agrupar campos por sección
  const fieldsBySection = fields.reduce((acc, field) => {
    const section = field.section || 'technical';
    if (!acc[section]) acc[section] = [];
    acc[section].push(field);
    return acc;
  }, {} as Record<string, any[]>);

  const sectionLabels: Record<string, string> = {
    technical: 'Técnico',
    hardware: 'Hardware',
    display: 'Display',
    connectivity: 'Conectividad',
    motor: 'Motor y Combustible',
    identification: 'Identificación Vehicular',
    dimensions: 'Dimensiones',
    materials: 'Materiales',
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Campos Dinámicos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Campos específicos configurados para este tipo de activo
          </Typography>
        </Box>
      </Box>

      {fields.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No hay campos dinámicos configurados para este tipo de activo.
          Puedes agregar campos desde la configuración del tipo de activo.
        </Alert>
      )}

      {/* Campos Dinámicos Configurados */}
      {Object.entries(fieldsBySection).map(([section, sectionFields]) => (
        <Box key={section} sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
            {sectionLabels[section] || section}
          </Typography>
          <Grid container spacing={2}>
            {sectionFields.map((field) => {
              // Asegurar que field.key existe
              const fieldKey = field.key || field.fieldId?.toString() || `field_${field.id || field.fieldId}`;
              console.log('🔍 Renderizando campo dinámico:', {
                fieldKey,
                field: field,
                value: values[fieldKey],
                hasKey: !!field.key,
                hasFieldId: !!field.fieldId,
                hasId: !!field.id
              });
              
              return (
                <Grid item xs={12} md={6} key={field.id || field.fieldId || fieldKey}>
                  <DynamicField
                    field={field}
                    value={values[fieldKey]}
                    error={errors[fieldKey]}
                    onChange={(value) => onChange(fieldKey, value)}
                    disabled={loading}
                  />
                </Grid>
              );
            })}
          </Grid>
        </Box>
      ))}

      {/* Campos Reutilizables Disponibles */}
      {reusableFields.length > 0 && (
        <>
          <Divider sx={{ my: 4 }} />
          <Box>
            <Typography variant="h6" gutterBottom>
              Campos Reutilizables Disponibles
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Campos de otros tipos de activos que puedes agregar a este tipo
            </Typography>

            <Grid container spacing={2}>
              {reusableFields.map((field) => (
                <Grid item xs={12} md={6} key={field.fieldId}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            {field.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Tipo: {field.type}
                          </Typography>
                          {field.usedInTypes && field.usedInTypes.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Usado en:
                              </Typography>
                              {field.usedInTypes.map((type: any) => (
                                <Chip
                                  key={type.id}
                                  label={type.label || type.name}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => onInvokeField(field.fieldId)}
                          disabled={loading}
                        >
                          Agregar
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </>
      )}
    </Box>
  );
};

export default DynamicFieldsTab;

