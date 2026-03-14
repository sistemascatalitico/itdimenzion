import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Paper, Box, Typography } from '@mui/material';
import { DragIndicator as DragIndicatorIcon } from '@mui/icons-material';

interface DraggableFieldTypeProps {
  fieldType: {
    type: string;
    label: string;
    icon: string;
  };
}

const DraggableFieldType: React.FC<DraggableFieldTypeProps> = ({ fieldType }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: fieldType.type,
  });

  return (
    <Paper
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      elevation={isDragging ? 3 : 1}
      sx={{
        p: 1.5,
        mb: 1,
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 2,
          bgcolor: 'action.hover',
        },
        '&:active': {
          cursor: 'grabbing',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DragIndicatorIcon fontSize="small" color="action" />
        <Typography variant="body2" sx={{ fontSize: 18 }}>
          {fieldType.icon}
        </Typography>
        <Typography variant="body2" sx={{ flex: 1 }}>
          {fieldType.label}
        </Typography>
      </Box>
    </Paper>
  );
};

export default DraggableFieldType;


