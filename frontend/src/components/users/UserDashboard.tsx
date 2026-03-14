import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Paper,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  SupervisedUserCircle as SuperAdminIcon,
  Person as UserIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  LocationOn as LocationIcon,
  AccountTree as ProcessIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import api from '../../config/api';
import PageHeader from '../common/PageHeader';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: string;
  isActive: boolean;
  company?: {
    id: number;
    name: string;
  };
  jobTitle?: {
    id: number;
    name: string;
  };
  headquarters?: {
    id: number;
    name: string;
  };
  createdAt: string;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: {
    SUPER_ADMIN: number;
    ADMIN: number;
    USER: number;
  };
  usersByCompany: Array<{
    companyName: string;
    count: number;
  }>;
  recentUsers: User[];
}

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    usersByRole: { SUPER_ADMIN: 0, ADMIN: 0, USER: 0 },
    usersByCompany: [],
    recentUsers: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 UserDashboard: Obteniendo datos de usuarios...');
      const response = await api.get('/users');
      console.log('📊 UserDashboard: Respuesta de API:', response.data);
      
      // Manejar diferentes formatos de respuesta
      let users = [];
      if (response.data.success && response.data.data) {
        users = response.data.data;
      } else if (Array.isArray(response.data)) {
        users = response.data;
      } else if (response.data.users) {
        users = response.data.users;
      } else {
        console.warn('⚠️ UserDashboard: Formato de respuesta inesperado:', response.data);
        users = [];
      }
      
      console.log('👥 UserDashboard: Usuarios procesados:', users.length);

      // Calcular estadísticas
      const totalUsers = users.length;
      const activeUsers = users.filter((u: User) => u.isActive === true || u.isActive === 'true' || u.status === 'ACTIVE').length;
      const inactiveUsers = totalUsers - activeUsers;

      // Distribución por roles
      const usersByRole = users.reduce((acc: any, user: User) => {
        const role = user.role || 'USER';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, { SUPER_ADMIN: 0, ADMIN: 0, USER: 0 });
      
      // Usuarios por empresa
      const companyMap = new Map();
      users.forEach((user: User) => {
        if (user.company && user.company.name) {
          const companyName = user.company.name;
          companyMap.set(companyName, (companyMap.get(companyName) || 0) + 1);
        } else if (user.companyName) {
          const companyName = user.companyName;
          companyMap.set(companyName, (companyMap.get(companyName) || 0) + 1);
        }
      });
      const usersByCompany = Array.from(companyMap.entries()).map(([name, count]) => ({
        companyName: name,
        count,
      }));
      
      // Usuarios recientes (últimos 5)
      const recentUsers = users
        .filter((u: User) => u.createdAt)
        .sort((a: User, b: User) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      const newStats = {
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersByRole,
        usersByCompany,
        recentUsers,
      };

      console.log('📈 UserDashboard: Estadísticas calculadas:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('❌ UserDashboard: Error fetching dashboard data:', error);
      // Establecer datos por defecto en caso de error
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        usersByRole: { SUPER_ADMIN: 0, ADMIN: 0, USER: 0 },
        usersByCompany: [],
        recentUsers: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <SuperAdminIcon sx={{ color: '#FF6B6B' }} />;
      case 'ADMIN':
        return <AdminIcon sx={{ color: '#FF9800' }} />;
        default:
        return <UserIcon sx={{ color: '#2196F3' }} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'error';
      case 'ADMIN':
        return 'warning';
      default:
        return 'primary';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando dashboard...</Typography>
    </Box>
  );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Dashboard de Gestión de Usuarios"
        subtitle="Administra y monitorea los usuarios del sistema"
      />
        
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)',
            color: 'white',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            p: 2,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <PeopleIcon sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.totalUsers}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Usuarios
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
            color: 'white',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            p: 2,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <ActiveIcon sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.activeUsers}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Usuarios Activos
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
            color: 'white',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            p: 2,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <AdminIcon sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.usersByRole.ADMIN + stats.usersByRole.SUPER_ADMIN}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Administradores
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
            color: 'white',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            p: 2,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <BusinessIcon sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.usersByCompany.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Empresas con Usuarios
                </Typography>
        </Box>
      </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Content Grid */}
      <Grid container spacing={3}>
        {/* Distribución por Roles */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
                Distribución por Roles
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Object.entries(stats.usersByRole).map(([role, count]) => (
                  <Box key={role} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getRoleIcon(role)}
                      <Typography sx={{ ml: 2, fontWeight: 500 }}>
                        {role === 'SUPER_ADMIN' ? 'Super Administrador' : 
                         role === 'ADMIN' ? 'Administrador' : 'Usuario'}
                      </Typography>
                    </Box>
                    <Chip 
                      label={count} 
                      color={getRoleColor(role) as any}
                      size="small"
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
            </Grid>

        {/* Usuarios por Empresa */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
                Usuarios por Empresa
              </Typography>
              {stats.usersByCompany.length > 0 ? (
                <List dense>
                  {stats.usersByCompany.map((item, index) => (
                    <ListItem key={`company-${item.companyName}-${index}`} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#FF6B6B', width: 32, height: 32 }}>
                          <BusinessIcon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={item.companyName}
                        secondary={
                          <Box component="span">
                            {`${item.count} usuario${item.count !== 1 ? 's' : ''}`}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary">
                  No hay usuarios asignados a empresas
                </Typography>
              )}
            </CardContent>
          </Card>
      </Grid>

        {/* Usuarios Recientes */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
                Usuarios Recientes
              </Typography>
              {stats.recentUsers.length > 0 ? (
          <List>
                  {stats.recentUsers.map((user, index) => (
                    <React.Fragment key={user.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#FF6B6B' }}>
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                <ListItemText
                          primary={`${user.firstName} ${user.lastName}`}
                          secondary={
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip 
                                label={user.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                                       user.role === 'ADMIN' ? 'Admin' : 'Usuario'}
                                color={getRoleColor(user.role) as any}
                                size="small"
                                component="span"
                              />
                              <Chip 
                                label={user.isActive ? 'Activo' : 'Inactivo'}
                                color={user.isActive ? 'success' : 'default'}
                                size="small"
                                component="span"
                              />
                              {user.company && (
                                <Chip 
                                  label={user.company.name}
                                  color="primary"
                                  size="small"
                                  icon={<BusinessIcon />}
                                  component="span"
                                />
                              )}
                            </Box>
                          }
                        />
              </ListItem>
                      {index < stats.recentUsers.length - 1 && <Divider />}
                    </React.Fragment>
            ))}
          </List>
              ) : (
                <Typography color="textSecondary">
                  No hay usuarios registrados
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Acciones Rápidas */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
          Acciones Rápidas
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #FF5A5A 0%, #FF7D5A 100%)',
                },
                py: 1.5,
              }}
            >
              Crear Usuario
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              startIcon={<PeopleIcon />}
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1976D2 0%, #2196F3 100%)',
                },
                py: 1.5,
              }}
            >
              Gestionar Usuarios
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              startIcon={<ViewIcon />}
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #388E3C 0%, #4CAF50 100%)',
                },
                py: 1.5,
              }}
            >
              Ver Reportes
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              startIcon={<SettingsIcon />}
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #7B1FA2 0%, #9C27B0 100%)',
                },
                py: 1.5,
              }}
            >
              Configuración
            </Button>
          </Grid>
        </Grid>
        </Box>
    </Box>
  );
};

export default UserDashboard;
