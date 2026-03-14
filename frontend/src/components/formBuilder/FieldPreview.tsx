import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
  Paper,
} from '@mui/material';
import { FormField, FieldType } from '../../stores/formBuilderStore';

interface FieldPreviewProps {
  field: FormField;
  onClick?: () => void;
}

const FieldPreview: React.FC<FieldPreviewProps> = ({ field, onClick }) => {
  const renderField = () => {
    const commonProps = {
      fullWidth: true,
      label: field.fieldLabel,
      required: field.isRequired,
      disabled: field.isReadonly,
      placeholder: field.placeholder || undefined,
      helperText: field.helpText || undefined,
    };

    switch (field.fieldType) {
      case FieldType.TEXT:
      case FieldType.EMAIL:
      case FieldType.PHONE:
        return <TextField {...commonProps} type={field.fieldType.toLowerCase()} />;

      case FieldType.TEXTAREA:
        return <TextField {...commonProps} multiline rows={4} />;

      case FieldType.NUMBER:
        return <TextField {...commonProps} type="number" />;

      case FieldType.DATE:
        return <TextField {...commonProps} type="date" InputLabelProps={{ shrink: true }} />;

      case FieldType.DATETIME:
        return <TextField {...commonProps} type="datetime-local" InputLabelProps={{ shrink: true }} />;

      case FieldType.CHECKBOX:
        return (
          <FormControlLabel
            control={<Checkbox disabled={field.isReadonly} />}
            label={field.fieldLabel}
            required={field.isRequired}
          />
        );

      case FieldType.RADIO:
        return (
          <FormControl fullWidth>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.fieldLabel} {field.isRequired && '*'}
            </Typography>
            <RadioGroup>
              {field.options && typeof field.options === 'object' && Array.isArray((field.options as any).values)
                ? (field.options as any).values.map((opt: any, idx: number) => (
                    <FormControlLabel
                      key={idx}
                      value={opt.value || opt}
                      control={<Radio />}
                      label={opt.label || opt}
                      disabled={field.isReadonly}
                    />
                  ))
                : null}
            </RadioGroup>
            {field.helpText && (
              <Typography variant="caption" color="text.secondary">
                {field.helpText}
              </Typography>
            )}
          </FormControl>
        );

      case FieldType.SELECT:
      case FieldType.MULTISELECT:
        return (
          <FormControl fullWidth required={field.isRequired}>
            <InputLabel>{field.fieldLabel}</InputLabel>
            <Select
              label={field.fieldLabel}
              disabled={field.isReadonly}
              multiple={field.fieldType === FieldType.MULTISELECT}
            >
              {field.options && typeof field.options === 'object' && Array.isArray((field.options as any).values)
                ? (field.options as any).values.map((opt: any, idx: number) => (
                    <MenuItem key={idx} value={opt.value || opt}>
                      {opt.label || opt}
                    </MenuItem>
                  ))
                : null}
            </Select>
            {field.helpText && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {field.helpText}
              </Typography>
            )}
          </FormControl>
        );

      case FieldType.FILE:
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.fieldLabel} {field.isRequired && '*'}
            </Typography>
            <TextField {...commonProps} type="file" InputLabelProps={{ shrink: true }} label="" />
          </Box>
        );

      case FieldType.USER_SELECT:
      case FieldType.COMPANY_SELECT:
      case FieldType.LOCATION_SELECT:
      case FieldType.DEPARTMENT_SELECT:
      case FieldType.ASSET_SELECT:
      case FieldType.PROCESS_SELECT:
      case FieldType.JOB_TITLE_SELECT:
      case FieldType.SUPPLIER_SELECT:
        return (
          <FormControl fullWidth required={field.isRequired}>
            <InputLabel>{field.fieldLabel}</InputLabel>
            <Select label={field.fieldLabel} disabled={field.isReadonly}>
              <MenuItem value="">Seleccionar...</MenuItem>
            </Select>
            {field.helpText && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {field.helpText}
              </Typography>
            )}
          </FormControl>
        );

      default:
        return <TextField {...commonProps} />;
    }
  };

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick
          ? {
              borderColor: 'primary.main',
              boxShadow: 1,
            }
          : {},
      }}
    >
      {renderField()}
    </Paper>
  );
};

export default FieldPreview;

