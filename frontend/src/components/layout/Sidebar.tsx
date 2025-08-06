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
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const SIDEBAR_WIDTH = 280;
const SIDEBAR_COLLAPSED_WIDTH = 70;

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
    id: 'users',
    label: 'Gestión de Usuarios',
    icon: <PeopleIcon />,
    children: [
      { id: 'users-list', label: 'Lista de Usuarios', icon: <PeopleIcon />, path: '/users' },
      { id: 'users-groups', label: 'Grupos de Usuarios', icon: <AccountTreeIcon />, path: '/users/groups' },
      { id: 'users-roles', label: 'Roles y Permisos', icon: <SecurityIcon />, path: '/users/roles', roles: ['SUPER_ADMIN', 'ADMIN'] },
    ],
  },
  {
    id: 'organization',
    label: 'Organización',
    icon: <BusinessIcon />,
    children: [
      { id: 'companies', label: 'Empresas', icon: <BusinessIcon />, path: '/companies' },
      { id: 'headquarters', label: 'Sedes', icon: <BusinessIcon />, path: '/headquarters' },
      { id: 'processes', label: 'Procesos', icon: <AccountTreeIcon />, path: '/processes' },
      { id: 'job-titles', label: 'Cargos', icon: <WorkIcon />, path: '/job-titles' },
    ],
  },
  {
    id: 'assets',
    label: 'Gestión de Activos',
    icon: <InventoryIcon />,
    children: [
      { id: 'assets-list', label: 'Lista de Activos', icon: <InventoryIcon />, path: '/assets' },
      { id: 'assets-categories', label: 'Categorías', icon: <AccountTreeIcon />, path: '/assets/categories' },
      { id: 'assets-groups', label: 'Grupos de Activos', icon: <AccountTreeIcon />, path: '/assets/groups' },
      { id: 'assets-reports', label: 'Reportes', icon: <ReportsIcon />, path: '/assets/reports' },
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

  const isItemActive = (path?: string) => {
    return path && location.pathname === path;
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
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
              },
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: collapsed ? 0 : 40,
              color: 'white',
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
                  color: 'white',
                  '& .MuiListItemText-primary': {
                    fontSize: depth > 0 ? '0.875rem' : '1rem',
                    fontWeight: depth > 0 ? 400 : 500,
                  },
                }}
              />
              {item.children && (
                isExpanded ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />
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
              color: 'white',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            IT<span style={{ color: '#FFA726' }}>DIMENZION</span>
          </Typography>
        )}
        {variant !== 'temporary' && (
          <Tooltip title={collapsed ? 'Expandir' : 'Contraer'} placement="right">
            <IconButton
              onClick={toggleCollapse}
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />

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
            backgroundColor: 'white',
            color: 'primary.main',
            fontWeight: 600,
            mb: collapsed ? 0.5 : 0,
            mr: collapsed ? 0 : 2,
          }}
        >
          {user?.firstName?.charAt(0) || 'U'}
        </Avatar>
        {!collapsed && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                color: 'white',
                fontWeight: 600,
                fontSize: '0.875rem',
                lineHeight: 1.2,
                noWrap: true,
              }}
            >
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
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

      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <List>
          {menuItems.map(item => renderMenuItem(item))}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 1 }}>
        <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', mb: 1 }} />
        
        <ListItemButton
          onClick={() => navigate('/profile')}
          sx={{
            borderRadius: 2,
            mx: 1,
            mb: 0.5,
          }}
        >
          <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: 'white', justifyContent: 'center' }}>
            <PersonIcon />
          </ListItemIcon>
          {!collapsed && (
            <ListItemText
              primary="Mi Perfil"
              sx={{ color: 'white' }}
            />
          )}
        </ListItemButton>

        <ListItemButton
          onClick={() => navigate('/settings')}
          sx={{
            borderRadius: 2,
            mx: 1,
            mb: 0.5,
          }}
        >
          <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: 'white', justifyContent: 'center' }}>
            <SettingsIcon />
          </ListItemIcon>
          {!collapsed && (
            <ListItemText
              primary="Configuración"
              sx={{ color: 'white' }}
            />
          )}
        </ListItemButton>

        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            mx: 1,
            mb: 0.5,
            '&:hover': {
              backgroundColor: 'rgba(244, 67, 54, 0.2)',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: 'white', justifyContent: 'center' }}>
            <LogoutIcon />
          </ListItemIcon>
          {!collapsed && (
            <ListItemText
              primary="Cerrar Sesión"
              sx={{ color: 'white' }}
            />
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
          background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: theme => theme.transitions.create('width', {
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