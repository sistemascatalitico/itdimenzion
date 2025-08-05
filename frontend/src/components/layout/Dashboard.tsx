import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Alert,
} from '@mui/material';
import {
  AccountCircle,
  Security,
  ExitToApp,
  Dashboard as DashboardIcon,
  Settings,
  Notifications,
  Shield,
} from '@mui/icons-material';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'error';
      case 'ADMIN':
        return 'warning';
      case 'SUPERVISOR':
        return 'info';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Administrador';
      case 'ADMIN':
        return 'Administrador';
      case 'SUPERVISOR':
        return 'Supervisor';
      case 'USER':
        return 'Usuario';
      default:
        return role;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'default';
      case 'LOCKED':
        return 'error';
      case 'PENDING_VERIFICATION':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activo';
      case 'INACTIVE':
        return 'Inactivo';
      case 'LOCKED':
        return 'Bloqueado';
      case 'PENDING_VERIFICATION':
        return 'Pendiente Verificación';
      default:
        return status;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static">
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ITDimenzion - Panel de Control
          </Typography>
          
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Notifications />
          </IconButton>
          
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>
              <AccountCircle sx={{ mr: 1 }} />
              Mi Perfil
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <Settings sx={{ mr: 1 }} />
              Configuración
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1 }} />
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Contenido Principal */}
      <Box sx={{ p: 3 }}>
        {/* Mensaje de bienvenida */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            ¡Bienvenido, {user.firstName}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Has iniciado sesión de forma segura en el sistema ITDimenzion
          </Typography>
        </Box>

        {/* Alertas de seguridad */}
        {!user.emailVerified && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>Verificación pendiente:</strong> Tu email no ha sido verificado. 
            Revisa tu bandeja de entrada para activar tu cuenta completamente.
          </Alert>
        )}

        {user.status !== 'ACTIVE' && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <strong>Estado de cuenta:</strong> Tu cuenta está en estado {getStatusLabel(user.status)}. 
            Contacta al administrador si necesitas asistencia.
          </Alert>
        )}

        {/* Información del usuario */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {/* Perfil del usuario */}
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {user.firstName} {user.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={getRoleLabel(user.role)}
                    color={getRoleColor(user.role) as any}
                    icon={<Shield />}
                    sx={{ mr: 1, mb: 1 }}
                  />
                  <Chip
                    label={getStatusLabel(user.status)}
                    color={getStatusColor(user.status) as any}
                    sx={{ mr: 1, mb: 1 }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  <strong>Documento:</strong> {user.documentType} - {user.documentNumber}
                </Typography>
                {user.phone && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Teléfono:</strong> {user.phone}
                  </Typography>
                )}
                {user.lastLogin && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Último acceso:</strong> {new Date(user.lastLogin).toLocaleString()}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Información organizacional */}
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Información Organizacional
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Empresa:</strong> {user.headquarters.company.name}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Sede:</strong> {user.headquarters.name}
                </Typography>
                
                {user.jobTitle && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Cargo:</strong> {user.jobTitle.name}
                  </Typography>
                )}
                
                {user.process && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Proceso:</strong> {user.process.name}
                  </Typography>
                )}

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  <strong>Miembro desde:</strong> {new Date(user.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Estado de seguridad */}
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Estado de Seguridad
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={user.emailVerified ? "Email Verificado" : "Email Pendiente"}
                    color={user.emailVerified ? "success" : "warning"}
                    sx={{ mr: 1, mb: 1 }}
                  />
                  <Chip
                    label={user.twoFactorEnabled ? "2FA Activado" : "2FA Desactivado"}
                    color={user.twoFactorEnabled ? "success" : "default"}
                    sx={{ mr: 1, mb: 1 }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  {user.emailVerified && user.twoFactorEnabled
                    ? "🛡️ Tu cuenta tiene el máximo nivel de seguridad"
                    : "⚠️ Considera activar todas las medidas de seguridad disponibles"
                  }
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Acciones rápidas */}
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Acciones Rápidas
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<AccountCircle />}
                    onClick={() => {
                      // TODO: Implementar edición de perfil
                    }}
                  >
                    Editar Perfil
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<Security />}
                    onClick={() => {
                      // TODO: Implementar cambio de contraseña
                    }}
                  >
                    Cambiar Contraseña
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<Settings />}
                    onClick={() => {
                      // TODO: Implementar configuración de seguridad
                    }}
                  >
                    Configuración de Seguridad
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;