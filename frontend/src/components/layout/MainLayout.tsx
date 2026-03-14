import React, { useState, useEffect } from 'react';
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
  TextField,
  InputAdornment,
  Breadcrumbs,
  Link,
  Button,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  DarkMode as MoonIcon,
  LightMode as SunIcon,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH, CONTENT_GAP } from './layoutConstants';
import { PRIMARY, SECONDARY } from '../../theme/themeTokens';
import { useAuth } from '../../hooks/useAuth';
import { useThemeMode } from '../../context/ThemeContext';

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark, toggleMode } = useThemeMode();
  
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
      setSidebarCollapsed(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(prev => !prev);
    } else {
      if (sidebarOpen) {
        setSidebarCollapsed(prev => !prev);
      } else {
        setSidebarOpen(true);
      }
    }
  };

  // Generate breadcrumbs based on current location
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [
      { name: 'Dashboard', path: '/dashboard', clickable: true }
    ];

    if (pathSegments.includes('users')) {
      breadcrumbs.push(
        { name: 'Dashboard', path: '/dashboard', clickable: true },
        { name: 'Gestión de Usuarios', path: '/users', clickable: true },
        { name: 'Lista de Usuarios', path: '/users', clickable: false }
      );
    } else if (pathSegments.includes('profile')) {
      breadcrumbs.push(
        { name: 'Mi Perfil', path: '/profile', clickable: false }
      );
    } else if (pathSegments.includes('settings')) {
      breadcrumbs.push(
        { name: 'Configuración', path: '/settings', clickable: false }
      );
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const handleGlobalSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setGlobalSearch(value);
    
    // Implement global search logic here
    if (value.length > 2) {
      // Search across users, companies, processes, etc.
      console.log('Global search for:', value);
      // TODO: Implement actual search API call
    } else {
      setSearchResults([]);
    }
  };

  const handleBreadcrumbClick = (path: string) => {
    navigate(path);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleHomeClick = () => {
    navigate('/dashboard');
  };

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
          zIndex: theme.zIndex.drawer + 1,
          background: isDark
            ? 'linear-gradient(135deg, #0B0B0F 0%, #131318 100%)'
            : 'linear-gradient(135deg,rgb(249, 248, 248) 0%,rgb(251, 251, 251) 100%)',
          backdropFilter: 'none',
          borderBottom: isDark ? '1px solid rgba(255, 167, 38, 0.1)' : 'none',
          boxShadow: isDark
            ? '0 4px 20px rgba(0, 0, 0, 0.5), 0 1px 8px rgba(255, 167, 38, 0.05)'
            : '0 14px 12px rgba(255, 107, 107, 0.3)',
          color: isDark ? '#F0F0F5' : 'white',
          left: 0,
          right: 0,
          width: '100%',
        }}
      >
        <Toolbar sx={{ 
          justifyContent: 'space-between', 
          minHeight: '64px !important',
          px: 2
        }}>
          {/* Left side - Brand and Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Brand - toggles sidebar */}
            <Typography 
              variant="h6" 
              onClick={toggleSidebar}
              sx={{ 
                fontWeight: 700,
                color: '#FF6B6B',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                userSelect: 'none',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                transition: 'background-color 0.2s',
                '&:hover': {
                  backgroundColor: 'rgba(255, 107, 107, 0.08)',
                },
                '&:active': {
                  backgroundColor: 'rgba(255, 107, 107, 0.15)',
                },
              }}
            >
              <span style={{ color: PRIMARY.main }}>IT</span>
              <span style={{ color: '#FFA726', marginLeft: '2px' }}>DIMENZION</span>
            </Typography>

            {/* Theme toggle */}
            <IconButton
              size="small"
              onClick={toggleMode}
              sx={{
                color: isDark ? '#FFA726' : '#FF6B6B',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: isDark
                    ? 'rgba(255, 167, 38, 0.12)'
                    : 'rgba(255, 107, 107, 0.1)',
                  transform: 'rotate(30deg)',
                },
              }}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </IconButton>

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size="small"
                onClick={handleBackClick}
                sx={{
                  color: isDark ? '#9E9EB0' : '#FF6B6B',
                  '&:hover': { backgroundColor: isDark ? 'rgba(255, 167, 38, 0.08)' : 'rgba(255, 107, 107, 0.1)' }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleHomeClick}
                sx={{
                  color: isDark ? '#9E9EB0' : '#FF6B6B',
                  '&:hover': { backgroundColor: isDark ? 'rgba(255, 167, 38, 0.08)' : 'rgba(255, 107, 107, 0.1)' }
                }}
              >
                <HomeIcon />
              </IconButton>
            </Box>

            {/* Breadcrumbs - hidden on mobile */}
            <Breadcrumbs 
              separator="›" 
              sx={{ 
                color: isDark ? '#6B6B80' : '#666',
                display: { xs: 'none', md: 'flex' },
                '& .MuiBreadcrumbs-separator': { color: isDark ? '#4A4A5A' : '#999' }
              }}
            >
              {breadcrumbs.map((crumb, index) => (
                <Link
                  key={index}
                  color={crumb.clickable ? 'inherit' : 'text.primary'}
                  underline={crumb.clickable ? 'hover' : 'none'}
                  onClick={crumb.clickable ? () => handleBreadcrumbClick(crumb.path) : undefined}
                  sx={{
                    cursor: crumb.clickable ? 'pointer' : 'default',
                    color: crumb.clickable ? (isDark ? '#FFA726' : '#FF6B6B') : (isDark ? '#9E9EB0' : '#666'),
                    '&:hover': crumb.clickable ? { color: isDark ? SECONDARY.light : PRIMARY.main } : {}
                  }}
                >
                  {crumb.name}
                </Link>
              ))}
            </Breadcrumbs>
          </Box>

          {/* Center - Global Search */}
          <Box sx={{ 
            display: { xs: 'none', sm: 'flex' }, 
            alignItems: 'center', 
            flex: 1, 
            maxWidth: 600,
            mx: { sm: 2, md: 4 }
          }}>
            <TextField
              fullWidth
              placeholder="Buscar en toda la plataforma..."
              value={globalSearch}
              onChange={handleGlobalSearch}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: isDark ? '#FFA726' : '#FF6B6B' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                backgroundColor: isDark ? 'rgba(19, 19, 24, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  color: isDark ? '#F0F0F5' : undefined,
                  '& fieldset': { borderColor: isDark ? 'rgba(255, 167, 38, 0.15)' : 'transparent' },
                  '&:hover fieldset': { borderColor: isDark ? '#FFA726' : '#FF6B6B' },
                  '&.Mui-focused fieldset': { borderColor: isDark ? SECONDARY.main : PRIMARY.main }
                },
                '& .MuiInputBase-input::placeholder': { color: isDark ? '#6B6B80' : undefined },
              }}
            />
          </Box>

          {/* Right side - User controls */}
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
                    backgroundColor: PRIMARY.main,
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
            backgroundColor: isDark ? '#131318' : '#ffffff',
            minHeight: 'calc(100vh - 64px)',
            transition: 'background-color 0.3s ease',
          }}
        >
          {children || <Outlet />}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;