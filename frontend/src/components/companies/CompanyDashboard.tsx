import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Chip,
  Fade,
  Grow,
  Zoom,
  Slide,
  Collapse,
  Paper,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  AccountTree as ProcessIcon,
  Work as JobIcon,
  People as PeopleIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  MoreVert as MoreVertIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  DragIndicator as DragIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  AreaChart as AreaChartIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import PageHeader from '../common/PageHeader';
import { companyService, Company } from '../../services/companyService';
import { headquartersService, Headquarters } from '../../services/headquartersService';
import { processService, Process } from '../../services/processService';
import { jobTitleService, JobTitle } from '../../services/jobTitleService';

interface DashboardStats {
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  totalHeadquarters: number;
  totalProcesses: number;
  totalJobTitles: number;
  totalUsers: number;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

const CompanyDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    activeCompanies: 0,
    inactiveCompanies: 0,
    totalHeadquarters: 0,
    totalProcesses: 0,
    totalJobTitles: 0,
    totalUsers: 0,
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [headquarters, setHeadquarters] = useState<Headquarters[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState<null | HTMLElement>(null);
  const [visibleCharts, setVisibleCharts] = useState({
    companiesChart: true,
    headquartersChart: true,
    processesChart: true,
    jobTitlesChart: true,
    trendsChart: true,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [companiesData, headquartersData, processesData, jobTitlesData] = await Promise.all([
        companyService.getAll(),
        headquartersService.getAll(),
        processService.getAll(),
        jobTitleService.getAll(),
      ]);

      setCompanies(companiesData);
      setHeadquarters(headquartersData);
      setProcesses(processesData);
      setJobTitles(jobTitlesData);

      // Calcular estadísticas
      const activeCompanies = companiesData.filter(c => c.status === 'ACTIVE').length;
      const inactiveCompanies = companiesData.filter(c => c.status === 'INACTIVE').length;

      setStats({
        totalCompanies: companiesData.length,
        activeCompanies,
        inactiveCompanies,
        totalHeadquarters: headquartersData.length,
        totalProcesses: processesData.length,
        totalJobTitles: jobTitlesData.length,
        totalUsers: 0, // Se calculará cuando se implemente la integración con usuarios
      });
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsMenuAnchor(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsMenuAnchor(null);
  };

  const toggleChartVisibility = (chartName: keyof typeof visibleCharts) => {
    setVisibleCharts(prev => ({
      ...prev,
      [chartName]: !prev[chartName]
    }));
  };

  // Datos para gráficos
  const companiesChartData: ChartData[] = [
    { name: 'Activas', value: stats.activeCompanies, color: '#4CAF50' },
    { name: 'Inactivas', value: stats.inactiveCompanies, color: '#F44336' },
  ];

  const headquartersChartData: ChartData[] = [
    { name: 'Sedes', value: stats.totalHeadquarters, color: '#2196F3' },
  ];

  const processesChartData: ChartData[] = [
    { name: 'Procesos', value: stats.totalProcesses, color: '#FF9800' },
  ];

  const jobTitlesChartData: ChartData[] = [
    { name: 'Cargos', value: stats.totalJobTitles, color: '#9C27B0' },
  ];

  const trendsData = [
    { name: 'Ene', companies: 2, headquarters: 3, processes: 5, jobTitles: 8 },
    { name: 'Feb', companies: 3, headquarters: 5, processes: 7, jobTitles: 12 },
    { name: 'Mar', companies: 4, headquarters: 6, processes: 9, jobTitles: 15 },
    { name: 'Abr', companies: 5, headquarters: 8, processes: 11, jobTitles: 18 },
    { name: 'May', companies: 6, headquarters: 10, processes: 13, jobTitles: 21 },
    { name: 'Jun', companies: 7, headquarters: 12, processes: 15, jobTitles: 24 },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography>Cargando dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Dashboard de Gestión de Empresas"
        subtitle="Vista general de empresas, sedes, procesos y cargos"
        endIcon={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Actualizar">
              <IconButton onClick={handleRefresh} color="inherit" size="medium">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Configuración">
              <IconButton onClick={handleSettingsClick} color="inherit" size="medium">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsMenuAnchor}
        open={Boolean(settingsMenuAnchor)}
        onClose={handleSettingsClose}
      >
        <MenuItem onClick={() => navigate('/companies/list')}>
          <BusinessIcon sx={{ mr: 1 }} />
          Gestionar Empresas
        </MenuItem>
        <MenuItem onClick={() => navigate('/companies/headquarters')}>
          <LocationIcon sx={{ mr: 1 }} />
          Gestionar Sedes
        </MenuItem>
        <MenuItem onClick={() => navigate('/companies/processes')}>
          <ProcessIcon sx={{ mr: 1 }} />
          Gestionar Procesos
        </MenuItem>
        <MenuItem onClick={() => navigate('/companies/job-titles')}>
          <JobIcon sx={{ mr: 1 }} />
          Gestionar Cargos
        </MenuItem>
      </Menu>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={600}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #FF69B4 0%, #FF1493 100%)',
              color: 'white',
              height: '100%'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.totalCompanies}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Empresas
                    </Typography>
                  </Box>
                  <BusinessIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={800}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
              color: 'white',
              height: '100%'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.totalHeadquarters}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Sedes
                    </Typography>
                  </Box>
                  <LocationIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={1000}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
              color: 'white',
              height: '100%'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.totalProcesses}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Procesos
                    </Typography>
                  </Box>
                  <ProcessIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={1200}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
              color: 'white',
              height: '100%'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.totalJobTitles}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Cargos
                    </Typography>
                  </Box>
                  <JobIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Companies Status Chart */}
        {visibleCharts.companiesChart && (
          <Grid item xs={12} md={6}>
            <Grow in timeout={600}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Estado de Empresas</Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => toggleChartVisibility('companiesChart')}
                    >
                      <VisibilityOffIcon />
                    </IconButton>
                  </Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={companiesChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {companiesChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        )}

        {/* Headquarters Chart */}
        {visibleCharts.headquartersChart && (
          <Grid item xs={12} md={6}>
            <Grow in timeout={800}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Distribución de Sedes</Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => toggleChartVisibility('headquartersChart')}
                    >
                      <VisibilityOffIcon />
                    </IconButton>
                  </Box>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={headquartersChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="value" fill="#2196F3" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        )}

        {/* Trends Chart */}
        {visibleCharts.trendsChart && (
          <Grid item xs={12}>
            <Grow in timeout={1000}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Tendencias de Crecimiento</Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => toggleChartVisibility('trendsChart')}
                    >
                      <VisibilityOffIcon />
                    </IconButton>
                  </Box>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={trendsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="companies" stroke="#FF69B4" strokeWidth={2} />
                      <Line type="monotone" dataKey="headquarters" stroke="#2196F3" strokeWidth={2} />
                      <Line type="monotone" dataKey="processes" stroke="#FF9800" strokeWidth={2} />
                      <Line type="monotone" dataKey="jobTitles" stroke="#9C27B0" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        )}
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#FF69B4' }}>
          Acciones Rápidas
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<BusinessIcon />}
              onClick={() => navigate('/companies/list')}
              sx={{
                backgroundColor: '#FF69B4',
                '&:hover': { backgroundColor: '#FF1493' }
              }}
            >
              Gestionar Empresas
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<LocationIcon />}
              onClick={() => navigate('/companies/headquarters')}
              sx={{
                backgroundColor: '#2196F3',
                '&:hover': { backgroundColor: '#1976D2' }
              }}
            >
              Gestionar Sedes
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<ProcessIcon />}
              onClick={() => navigate('/companies/processes')}
              sx={{
                backgroundColor: '#FF9800',
                '&:hover': { backgroundColor: '#F57C00' }
              }}
            >
              Gestionar Procesos
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<JobIcon />}
              onClick={() => navigate('/companies/job-titles')}
              sx={{
                backgroundColor: '#9C27B0',
                '&:hover': { backgroundColor: '#7B1FA2' }
              }}
            >
              Gestionar Cargos
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default CompanyDashboard;
