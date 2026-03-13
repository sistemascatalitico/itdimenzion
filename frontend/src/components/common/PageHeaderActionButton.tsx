import React from 'react';
import { Button } from '@mui/material';

interface PageHeaderActionButtonProps {
  label: string;
  startIcon?: React.ReactNode;
  onClick: () => void;
}

/**
 * Botón de acción para PageHeader (ej: "+ Nueva Categoría").
 * Estilo: botón primario coral sobre fondo neutro.
 */
const PageHeaderActionButton: React.FC<PageHeaderActionButtonProps> = ({
  label,
  startIcon,
  onClick,
}) => {
  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={startIcon}
      onClick={onClick}
    >
      {label}
    </Button>
  );
};

export default PageHeaderActionButton;
