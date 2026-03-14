import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Paper, Box, Typography, IconButton, Chip } from '@mui/material';
import {
  DragIndicator as DragIndicatorIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { FormField } from '../../stores/formBuilderStore';

interface SortableFieldItemProps {
  field: FormField;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

const SortableFieldItem: React.FC<SortableFieldItemProps> = ({ field, index, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(field.id),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={isDragging ? 3 : 1}
      sx={{
        p: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        '&:hover': {
          boxShadow: 2,
        },
      }}
    >
      {/* Drag Handle */}
      <Box {...attributes} {...listeners} sx={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}>
        <DragIndicatorIcon fontSize="small" color="action" />
      </Box>

      {/* Field Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
          {index + 1}. {field.fieldLabel}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
          <Chip label={field.fieldType} size="small" variant="outlined" />
          {field.isRequired && <Chip label="Requerido" size="small" color="error" />}
          {field.isReadonly && <Chip label="Solo lectura" size="small" color="default" />}
        </Box>
      </Box>

      {/* Actions */}
      <IconButton size="small" onClick={onEdit}>
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={onDelete} color="error">
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Paper>
  );
};

export default SortableFieldItem;


