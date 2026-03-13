import React from 'react';
import {
  DialogTitle,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { PRIMARY } from '../../theme/themeTokens';

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  showCloseButton?: boolean;
  gradientColor?: 'orange' | 'blue' | 'purple' | 'green';
}

/**
 * Cabecera de modal - Opción B: fondo neutro + línea de acento coral.
 */
const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  onClose,
  showCloseButton = true,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <DialogTitle
      sx={{
        background: isDark ? theme.palette.background.paper : theme.palette.background.default,
        color: 'text.primary',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pr: showCloseButton ? 5 : 3,
        py: 2,
        position: 'relative',
        borderBottom: `4px solid ${PRIMARY.main}`,
      }}
    >
      <Typography
        variant="h6"
        component="div"
        sx={{
          fontWeight: 700,
          fontSize: '1.25rem',
          position: 'relative',
          zIndex: 1,
          color: 'inherit',
        }}
      >
        {title}
      </Typography>
      
      {showCloseButton && (
        <IconButton
          onClick={onClose}
          sx={{
            color: 'text.secondary',
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 36,
            height: 36,
            zIndex: 2,
            '&:hover': {
              backgroundColor: 'action.hover',
              color: 'text.primary',
            },
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            borderRadius: '50%',
          }}
          size="medium"
          aria-label="Cerrar modal"
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      )}
    </DialogTitle>
  );
};

export default ModalHeader;
