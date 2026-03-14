import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Collapse,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  AccountTree as AccountTreeIcon,
  Work as WorkIcon,
  LocationOn as LocationIcon,
  ExpandLess,
  ExpandMore,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  Assessment as ReportsIcon,
  Security as SecurityIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Description as FormBuilderIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useThemeMode } from '../../context/ThemeContext';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './layoutConstants';
import { PRIMARY, SECONDARY, SIDEBAR_LIGHT, SIDEBAR_DARK } from '../../theme/themeTokens';


interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  roles?: string[];
  badge?: number;
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
  },
  {
    id: 'assets',
    label: 'Gestión de Activos',
    icon: <InventoryIcon />,
    children: [
      { id: 'assets-dashboard', label: 'Dashboard', icon: <InventoryIcon />, path: '/assets/dashboard' },
      { id: 'assets-list', label: 'Lista de Activos', icon: <InventoryIcon />, path: '/assets' },
      { id: 'assets-categories', label: 'Categorías', icon: <AccountTreeIcon />, path: '/assets/categories' },
      { id: 'assets-groups', label: 'Grupos', icon: <AccountTreeIcon />, path: '/assets/groups' },
      { id: 'assets-types', label: 'Tipos', icon: <AccountTreeIcon />, path: '/assets/types' },
      { id: 'assets-models', label: 'Modelos', icon: <AccountTreeIcon />, path: '/assets/models' },
      { id: 'assets-manufacturers', label: 'Fabricantes', icon: <BusinessIcon />, path: '/assets/manufacturers' },
      { id: 'assets-reports', label: 'Reportes', icon: <ReportsIcon />, path: '/assets/reports' },
    ],
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'],
  },
  {
    id: 'form-builder',
    label: 'Form Builder',
    icon: <FormBuilderIcon />,
    path: '/forms',
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'],
  },
  {
    id: 'itdmz_administration',
    label: 'Administración',
    icon: <SettingsIcon />,
    children: [
      {
        id: 'users',
        label: 'Gestión de Usuarios',
        icon: <PeopleIcon />,
        children: [
          { id: 'users-dashboard', label: 'Dashboard', icon: <PeopleIcon />, path: '/users' },
          { id: 'users-list', label: 'Usuarios', icon: <PeopleIcon />, path: '/users/list' },
        ],
      },
      {
        id: 'companies',
        label: 'Gestión de Empresas',
        icon: <BusinessIcon />,
        children: [
          { id: 'companies-dashboard', label: 'Dashboard', icon: <BusinessIcon />, path: '/companies' },
          { id: 'companies-list', label: 'Empresas', icon: <BusinessIcon />, path: '/companies/list' },
          { id: 'headquarters-list', label: 'Sedes', icon: <LocationIcon />, path: '/companies/headquarters' },
          { id: 'processes-list', label: 'Procesos', icon: <AccountTreeIcon />, path: '/companies/processes' },
          { id: 'job-titles-list', label: 'Cargos', icon: <WorkIcon />, path: '/companies/job-titles' },
        ],
      },
      { id: 'admin-custom-fields', label: 'Campos Personalizados', icon: <SettingsIcon />, path: '/administration/custom-fields' },
      { id: 'admin-field-mapping', label: 'Mapeo de Campos', icon: <SettingsIcon />, path: '/administration/field-mapping' },
    ],
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    id: 'tickets',
    label: 'Gestión de Tickets',
    icon: <ReportsIcon />,
    children: [
      { id: 'tickets-list', label: 'Lista de Tickets', icon: <ReportsIcon />, path: '/tickets' },
      { id: 'tickets-create', label: 'Crear Ticket', icon: <ReportsIcon />, path: '/tickets/create' },
      { id: 'tickets-reports', label: 'Reportes', icon: <ReportsIcon />, path: '/tickets/reports' },
    ],
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'],
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: <ReportsIcon />,
    path: '/reports',
    roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'persistent' | 'temporary';
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  open, 
  onClose, 
  variant = 'persistent',
  collapsed: externalCollapsed = false,
  onToggleCollapse
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark } = useThemeMode();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  // Usar el estado externo si está disponible, sino usar el interno
  const collapsed = onToggleCollapse ? externalCollapsed : internalCollapsed;

  const handleItemClick = (item: MenuItem) => {
    if (item.children) {
      const isExpanded = expandedItems.includes(item.id);
      setExpandedItems(
        isExpanded
          ? expandedItems.filter(id => id !== item.id)
          : [...expandedItems, item.id]
      );
    } else if (item.path) {
      navigate(item.path);
      if (variant === 'temporary') {
        onClose();
      }
    }
  };

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isItemActive = (path?: string): boolean => {
    return !!path && location.pathname === path;
  };

  const hasPermission = (roles?: string[]) => {
    if (!roles || !user) return true;
    return roles.includes(user.role);
  };

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    if (!hasPermission(item.roles)) return null;

    const isExpanded = expandedItems.includes(item.id);
    const isActive = isItemActive(item.path);

    return (
      <React.Fragment key={item.id}>
        <ListItemButton
          onClick={() => handleItemClick(item)}
          selected={isActive}
          sx={{
            minHeight: 48,
            pl: depth * 2 + 2,
            py: 1.5,
            borderRadius: 2,
            mx: 1,
            mb: 0.5,
            '&.Mui-selected': {
              backgroundColor: isDark ? SECONDARY.subtle : PRIMARY.subtle,
              borderLeft: '3px solid',
              borderLeftColor: isDark ? SECONDARY.main : PRIMARY.main,
              '&:hover': {
                backgroundColor: isDark ? SECONDARY.subtleHover : PRIMARY.subtleHover,
              },
            },
            '&:hover': {
              backgroundColor: isDark ? 'rgba(255, 167, 38, 0.06)' : 'rgba(255, 107, 107, 0.06)',
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: collapsed ? 0 : 40,
              color: isDark ? (isActive ? SECONDARY.main : '#9E9EB0') : (isActive ? PRIMARY.dark : 'rgba(0,0,0,0.65)'),
              justifyContent: 'center',
            }}
          >
            {item.icon}
          </ListItemIcon>
          {!collapsed && (
            <>
              <ListItemText
                primary={item.label}
                sx={{
                  color: isDark ? (isActive ? '#F0F0F5' : '#C0C0D0') : (isActive ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.7)'),
                  '& .MuiListItemText-primary': {
                    fontSize: depth > 0 ? '0.875rem' : '1rem',
                    fontWeight: depth > 0 ? 400 : 500,
                  },
                }}
              />
              {item.children && (
                isExpanded
                  ? <ExpandLess sx={{ color: isDark ? '#9E9EB0' : 'rgba(0,0,0,0.5)' }} />
                  : <ExpandMore sx={{ color: isDark ? '#9E9EB0' : 'rgba(0,0,0,0.5)' }} />
              )}
              {item.badge && (
                <Box
                  sx={{
                    backgroundColor: 'white',
                    color: 'primary.main',
                    borderRadius: '50%',
                    minWidth: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {item.badge}
                </Box>
              )}
            </>
          )}
        </ListItemButton>
        {item.children && !collapsed && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map(child => renderMenuItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: collapsed ? 1 : 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 80,
        }}
      >
        {!collapsed && (
          <Typography
            variant="h5"
            sx={{
              color: isDark ? '#F0F0F5' : 'rgba(0,0,0,0.85)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            <span style={{ color: isDark ? PRIMARY.main : PRIMARY.dark }}>IT</span>
            <span style={{ color: isDark ? SECONDARY.main : '#D84315' }}>DIMENZION</span>
          </Typography>
        )}
        {variant !== 'temporary' && (
          <Tooltip title={collapsed ? 'Expandir' : 'Contraer'} placement="right">
            <IconButton
              onClick={toggleCollapse}
              sx={{
                color: isDark ? '#9E9EB0' : 'rgba(0,0,0,0.5)',
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(255, 167, 38, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                },
              }}
            >
              {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Divider sx={{ backgroundColor: isDark ? 'rgba(255, 167, 38, 0.1)' : PRIMARY.border }} />

      {/* User Profile */}
      <Box
        sx={{
          p: collapsed ? 1 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          flexDirection: collapsed ? 'column' : 'row',
          minHeight: collapsed ? 60 : 80,
        }}
      >
        <Avatar
          sx={{
            width: collapsed ? 32 : 48,
            height: collapsed ? 32 : 48,
            backgroundColor: isDark ? SECONDARY.subtle : PRIMARY.subtle,
            color: isDark ? SECONDARY.main : PRIMARY.dark,
            fontWeight: 600,
            mb: collapsed ? 0.5 : 0,
            mr: collapsed ? 0 : 2,
            border: isDark ? '2px solid rgba(255, 167, 38, 0.3)' : 'none',
          }}
        >
          {user?.firstName?.charAt(0) || 'U'}
        </Avatar>
        {!collapsed && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              noWrap
              sx={{
                color: isDark ? '#F0F0F5' : 'rgba(0,0,0,0.85)',
                fontWeight: 600,
                fontSize: '0.875rem',
                lineHeight: 1.2,
              }}
            >
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: isDark ? '#6B6B80' : 'rgba(0,0,0,0.55)',
                fontSize: '0.75rem',
                display: 'block',
                lineHeight: 1.2,
              }}
            >
              {user?.role}
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ backgroundColor: isDark ? 'rgba(255, 167, 38, 0.1)' : PRIMARY.border }} />

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <List>
          {menuItems.map(item => renderMenuItem(item))}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 1 }}>
        <Divider sx={{ backgroundColor: isDark ? 'rgba(255, 167, 38, 0.1)' : PRIMARY.border, mb: 1 }} />
        
        <ListItemButton
          onClick={() => navigate('/profile')}
          sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
        >
          <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: isDark ? '#9E9EB0' : 'rgba(0,0,0,0.6)', justifyContent: 'center' }}>
            <PersonIcon />
          </ListItemIcon>
          {!collapsed && (
            <ListItemText primary="Mi Perfil" sx={{ color: isDark ? '#C0C0D0' : 'rgba(0,0,0,0.75)' }} />
          )}
        </ListItemButton>

        <ListItemButton
          onClick={() => navigate('/settings')}
          sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}
        >
          <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: isDark ? '#9E9EB0' : 'rgba(0,0,0,0.6)', justifyContent: 'center' }}>
            <SettingsIcon />
          </ListItemIcon>
          {!collapsed && (
            <ListItemText primary="Configuración" sx={{ color: isDark ? '#C0C0D0' : 'rgba(0,0,0,0.75)' }} />
          )}
        </ListItemButton>

        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2, mx: 1, mb: 0.5,
            '&:hover': { backgroundColor: isDark ? 'rgba(239, 83, 80, 0.15)' : 'rgba(244, 67, 54, 0.08)' },
          }}
        >
          <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: isDark ? '#EF5350' : '#D32F2F', justifyContent: 'center' }}>
            <LogoutIcon />
          </ListItemIcon>
          {!collapsed && (
            <ListItemText primary="Cerrar Sesión" sx={{ color: isDark ? '#EF5350' : '#D32F2F' }} />
          )}
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          background: isDark ? SIDEBAR_DARK.gradient : SIDEBAR_LIGHT.gradient,
          borderRight: isDark ? SIDEBAR_DARK.border : SIDEBAR_LIGHT.border,
          boxShadow: isDark ? SIDEBAR_DARK.shadow : SIDEBAR_LIGHT.shadow,
          margin: 0,
          zIndex: (theme) => theme.zIndex.drawer,
          transition: theme => theme.transitions.create(['width', 'background', 'box-shadow'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;