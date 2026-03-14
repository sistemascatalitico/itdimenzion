import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Typography,
  Select,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { FormField } from '../../stores/formBuilderStore';

// Tipos para las reglas condicionales
export interface ConditionalRule {
  id: string;
  fieldKey: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
  value: any;
  action: 'show' | 'hide' | 'require' | 'disable';
}

export interface ConditionalLogic {
  enabled: boolean;
  logicType: 'AND' | 'OR';
  rules: ConditionalRule[];
}

interface ConditionalLogicBuilderProps {
  field: FormField;
  allFields: FormField[];
  initialLogic?: ConditionalLogic | null;
  onChange: (logic: ConditionalLogic | null) => void;
}

const ConditionalLogicBuilder: React.FC<ConditionalLogicBuilderProps> = ({
  field,
  allFields,
  initialLogic,
  onChange,
}) => {
  const [logic, setLogic] = useState<ConditionalLogic>(() => ({
    enabled: false,
    logicType: 'AND',
    rules: [],
    ...initialLogic,
  }));

  // Filtrar campos disponibles (excluir el campo actual)
  const availableFields = allFields.filter((f) => f.fieldKey !== field.fieldKey);

  useEffect(() => {
    onChange(logic.enabled ? logic : null);
  }, [logic, onChange]);

  const handleToggleEnabled = () => {
    setLogic((prev) => ({
      ...prev,
      enabled: !prev.enabled,
      rules: prev.enabled ? [] : prev.rules.length > 0 ? prev.rules : [createEmptyRule()],
    }));
  };

  const createEmptyRule = (): ConditionalRule => ({
    id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    fieldKey: availableFields[0]?.fieldKey || '',
    operator: 'equals',
    value: '',
    action: 'show',
  });

  const handleAddRule = () => {
    setLogic((prev) => ({
      ...prev,
      rules: [...prev.rules, createEmptyRule()],
    }));
  };

  const handleRemoveRule = (ruleId: string) => {
    setLogic((prev) => ({
      ...prev,
      rules: prev.rules.filter((r) => r.id !== ruleId),
    }));
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<ConditionalRule>) => {
    setLogic((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)),
    }));
  };

  const handleLogicTypeChange = (newType: 'AND' | 'OR') => {
    setLogic((prev) => ({ ...prev, logicType: newType }));
  };

  const getOperatorLabel = (operator: string) => {
    const labels: Record<string, string> = {
      equals: 'es igual a',
      notEquals: 'no es igual a',
      contains: 'contiene',
      greaterThan: 'es mayor que',
      lessThan: 'es menor que',
      isEmpty: 'está vacío',
      isNotEmpty: 'no está vacío',
    };
    return labels[operator] || operator;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      show: 'Mostrar',
      hide: 'Ocultar',
      require: 'Hacer obligatorio',
      disable: 'Deshabilitar',
    };
    return labels[action] || action;
  };

  const getFieldLabel = (fieldKey: string) => {
    const targetField = allFields.find((f) => f.fieldKey === fieldKey);
    return targetField?.fieldLabel || fieldKey;
  };

  const getRuleDescription = (rule: ConditionalRule) => {
    const fieldLabel = getFieldLabel(rule.fieldKey);
    const operatorLabel = getOperatorLabel(rule.operator);
    const needsValue = !['isEmpty', 'isNotEmpty'].includes(rule.operator);
    const valueText = needsValue ? `"${rule.value}"` : '';

    return `Si ${fieldLabel} ${operatorLabel} ${valueText}`;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2">Lógica Condicional</Typography>
        <Button
          size="small"
          variant={logic.enabled ? 'contained' : 'outlined'}
          onClick={handleToggleEnabled}
          startIcon={logic.enabled ? <VisibilityIcon /> : <VisibilityOffIcon />}
        >
          {logic.enabled ? 'Habilitada' : 'Deshabilitada'}
        </Button>
      </Box>

      {logic.enabled && (
        <>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="caption">
              Define reglas para controlar cuándo este campo se muestra, oculta o cambia su comportamiento.
            </Typography>
          </Alert>

          {/* Logic Type (AND/OR) */}
          {logic.rules.length > 1 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Cumplir reglas:
              </Typography>
              <ToggleButtonGroup
                value={logic.logicType}
                exclusive
                onChange={(e, newValue) => {
                  if (newValue !== null) handleLogicTypeChange(newValue);
                }}
                size="small"
                fullWidth
              >
                <ToggleButton value="AND">
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" fontWeight="bold">
                      TODAS (AND)
                    </Typography>
                    <Typography variant="caption" display="block" fontSize="0.65rem">
                      Todas las reglas deben cumplirse
                    </Typography>
                  </Box>
                </ToggleButton>
                <ToggleButton value="OR">
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" fontWeight="bold">
                      ALGUNA (OR)
                    </Typography>
                    <Typography variant="caption" display="block" fontSize="0.65rem">
                      Al menos una regla debe cumplirse
                    </Typography>
                  </Box>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}

          {/* Rules */}
          {logic.rules.map((rule, index) => (
            <Paper
              key={rule.id}
              variant="outlined"
              sx={{
                p: 2,
                mb: 2,
                bgcolor: 'grey.50',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Chip
                  label={`Regla ${index + 1}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemoveRule(rule.id)}
                  disabled={logic.rules.length === 1}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Field Selector */}
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Campo</InputLabel>
                <Select
                  value={rule.fieldKey}
                  label="Campo"
                  onChange={(e) => handleUpdateRule(rule.id, { fieldKey: e.target.value })}
                >
                  {availableFields.map((f) => (
                    <MenuItem key={f.fieldKey} value={f.fieldKey}>
                      {f.fieldLabel} ({f.fieldType})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Operator Selector */}
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Operador</InputLabel>
                <Select
                  value={rule.operator}
                  label="Operador"
                  onChange={(e) =>
                    handleUpdateRule(rule.id, { operator: e.target.value as ConditionalRule['operator'] })
                  }
                >
                  <MenuItem value="equals">Es igual a</MenuItem>
                  <MenuItem value="notEquals">No es igual a</MenuItem>
                  <MenuItem value="contains">Contiene</MenuItem>
                  <MenuItem value="greaterThan">Es mayor que</MenuItem>
                  <MenuItem value="lessThan">Es menor que</MenuItem>
                  <MenuItem value="isEmpty">Está vacío</MenuItem>
                  <MenuItem value="isNotEmpty">No está vacío</MenuItem>
                </Select>
              </FormControl>

              {/* Value Input (only if operator requires value) */}
              {!['isEmpty', 'isNotEmpty'].includes(rule.operator) && (
                <TextField
                  fullWidth
                  size="small"
                  label="Valor"
                  value={rule.value}
                  onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
                  sx={{ mb: 2 }}
                  placeholder="Ingrese el valor a comparar"
                />
              )}

              {/* Action Selector */}
              <FormControl fullWidth size="small">
                <InputLabel>Acción</InputLabel>
                <Select
                  value={rule.action}
                  label="Acción"
                  onChange={(e) => handleUpdateRule(rule.id, { action: e.target.value as ConditionalRule['action'] })}
                >
                  <MenuItem value="show">Mostrar este campo</MenuItem>
                  <MenuItem value="hide">Ocultar este campo</MenuItem>
                  <MenuItem value="require">Hacer obligatorio este campo</MenuItem>
                  <MenuItem value="disable">Deshabilitar este campo</MenuItem>
                </Select>
              </FormControl>

              {/* Rule Description */}
              <Box sx={{ mt: 2, p: 1.5, bgcolor: 'primary.50', borderRadius: 1, border: '1px dashed', borderColor: 'primary.main' }}>
                <Typography variant="caption" color="primary" fontWeight="bold">
                  📋 Regla en lenguaje natural:
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {getRuleDescription(rule)}, entonces <strong>{getActionLabel(rule.action)}</strong> el campo "
                  {field.fieldLabel}"
                </Typography>
              </Box>
            </Paper>
          ))}

          {/* Add Rule Button */}
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddRule}
            sx={{ mb: 2 }}
          >
            Agregar Regla
          </Button>

          <Divider sx={{ my: 2 }} />

          {/* Summary */}
          <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
            <Typography variant="caption" color="info.main" fontWeight="bold" sx={{ display: 'block', mb: 1 }}>
              📊 Resumen de Lógica Condicional
            </Typography>
            <Typography variant="body2">
              Este campo <strong>"{field.fieldLabel}"</strong> se controlará por{' '}
              <Chip label={`${logic.rules.length} regla${logic.rules.length > 1 ? 's' : ''}`} size="small" />
              {logic.rules.length > 1 && (
                <>
                  {' '}
                  con lógica <Chip label={logic.logicType} size="small" color="primary" />
                </>
              )}
            </Typography>
          </Box>
        </>
      )}

      {!logic.enabled && (
        <Alert severity="warning">
          La lógica condicional está deshabilitada. Habilítala para controlar cuándo se muestra este campo.
        </Alert>
      )}
    </Box>
  );
};

export default ConditionalLogicBuilder;
