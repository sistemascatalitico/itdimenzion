import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH, CONTENT_GAP } from './layoutConstants';
import { useAuth } from '../../contexts/AuthContext';

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    handleUserMenuClose();
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    handleUserMenuClose();
    navigate('/settings');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        variant={isMobile ? 'temporary' : 'persistent'}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Top AppBar - Posición fija que cubra toda la pantalla */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer - 1,
          background: 'linear-gradient(135deg,rgb(249, 248, 248) 0%,rgb(251, 251, 251) 100%)',
          backdropFilter: 'none',
          borderBottom: 'none',
          boxShadow: '0 14px 12px rgba(255, 107, 107, 0.3)',
          color: 'white',
          // Cubrir toda la pantalla desde el borde izquierdo
          left: 0,
          right: 0,
          width: '100%',
        }}
      >
          <Toolbar sx={{ justifyContent: 'flex-end', minHeight: '64px !important' }}>
            {/* Solo iconos del usuario a la derecha */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size="large"
                sx={{
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <Badge badgeContent={4} color="secondary">
                  <NotificationsIcon />
                </Badge>
              </IconButton>

              {/* User Menu */}
              <IconButton
                size="large"
                onClick={handleUserMenuOpen}
                sx={{
                  p: 0.5,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    backgroundColor: '#FF69B4',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {user?.firstName?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorElUser}
                open={Boolean(anchorElUser)}
                onClose={handleUserMenuClose}
                onClick={handleUserMenuClose}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    mt: 1.5,
                    minWidth: 200,
                    borderRadius: 2,
                    '& .MuiAvatar-root': {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.role}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={handleProfileClick}>
                  <AccountCircleIcon sx={{ mr: 2 }} />
                  Mi Perfil
                </MenuItem>
                <MenuItem onClick={handleSettingsClick}>
                  <SettingsIcon sx={{ mr: 2 }} />
                  Configuración
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <LogoutIcon sx={{ mr: 2 }} />
                  Cerrar Sesión
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          marginTop: '64px', // Espacio para el AppBar fijo
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          ...(sidebarOpen && !isMobile && {
            // Margen mínimo junto al sidebar como te gustó visualmente
            marginLeft: sidebarCollapsed ? '70px' : '10px',
          }),
        }}
      >
        {/* Content Area */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 1, md: 2 },
            overflow: 'auto',
            backgroundColor: '#ffffff',
            minHeight: 'calc(100vh - 64px)', // Altura total menos AppBar
          }}
        >
          {children || <Outlet />}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;