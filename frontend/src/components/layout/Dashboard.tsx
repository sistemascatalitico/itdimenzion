import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Typography,
  Collapse,
  Button,
  Alert,
} from '@mui/material';
import {
  Security,
  Shield,
  ExpandMore,
  ExpandLess,
  Edit as EditIcon,
  Lock as LockIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useThemeMode } from '../../context/ThemeContext';

const formatDate = (value: string | undefined | null): string => {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'SUPER_ADMIN': return 'error';
    case 'ADMIN': return 'warning';
    case 'SUPERVISOR': return 'info';
    default: return 'default';
  }
};

const getRoleLabel = (role: string) => {
  const map: Record<string, string> = {
    SUPER_ADMIN: 'Super Administrador',
    ADMIN: 'Administrador',
    SUPERVISOR: 'Supervisor',
    USER: 'Usuario',
  };
  return map[role] || role;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'INACTIVE': return 'default';
    case 'LOCKED': return 'error';
    case 'PENDING_VERIFICATION': return 'warning';
    default: return 'default';
  }
};

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    ACTIVE: 'Activo',
    INACTIVE: 'Inactivo',
    LOCKED: 'Bloqueado',
    PENDING_VERIFICATION: 'Pendiente',
  };
  return map[status] || status;
};

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark } = useThemeMode();
  const navigate = useNavigate();
  const [orgExpanded, setOrgExpanded] = useState(true);

  if (!user) return null;

  const companyName = user.headquarters?.company?.name || (user as any).Headquarters?.Company?.name || 'No asignada';
  const hqName = user.headquarters?.name || (user as any).Headquarters?.name || 'No asignada';
  const jobTitle = user.jobTitle?.name || (user as any).JobTitle?.name;
  const process = user.process?.name || (user as any).Process?.name;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
      {/* Hero: bienvenida con jerarquía clara */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            letterSpacing: '-0.02em',
            mb: 0.5,
            color: isDark ? 'text.primary' : 'text.primary',
          }}
        >
          ¡Bienvenido, {user.firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
          Has iniciado sesión de forma segura en ITDimenzion
        </Typography>
      </Box>

      {/* Alertas de seguridad */}
      {!user.emailVerified && (
        <Alert
          severity="warning"
          sx={{ mb: 3, borderRadius: 2 }}
          icon={<Shield />}
        >
          <strong>Verificación pendiente:</strong> Tu email no ha sido verificado.
          Revisa tu bandeja de entrada para activar tu cuenta.
        </Alert>
      )}

      {user.status !== 'ACTIVE' && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          <strong>Estado de cuenta:</strong> {getStatusLabel(user.status)}.
          Contacta al administrador si necesitas asistencia.
        </Alert>
      )}

      {/* Grid de cards: más aire, menos densidad */}
      <Grid container spacing={3}>
        {/* Card Perfil - compacta */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 2,
              boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.06)',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: isDark ? 'rgba(255, 167, 38, 0.2)' : 'primary.main',
                    color: isDark ? '#FFA726' : 'white',
                    fontWeight: 600,
                    mr: 2,
                  }}
                >
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                    {user.firstName} {user.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {user.email}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                <Chip
                  label={getRoleLabel(user.role)}
                  color={getRoleColor(user.role) as any}
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
                <Chip
                  label={getStatusLabel(user.status)}
                  color={getStatusColor(user.status) as any}
                  size="small"
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {user.documentType} {user.documentNumber}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card Organización - colapsable */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 2,
              boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.06)',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2.5,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' },
                }}
                onClick={() => setOrgExpanded(!orgExpanded)}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Información organizacional
                </Typography>
                <IconButton size="small">
                  {orgExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
              <Collapse in={orgExpanded}>
                <Box sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                  <InfoRow label="Empresa" value={companyName} />
                  <InfoRow label="Sede" value={hqName} />
                  {jobTitle && <InfoRow label="Cargo" value={jobTitle} />}
                  {process && <InfoRow label="Proceso" value={process} />}
                  <InfoRow label="Miembro desde" value={formatDate(user.createdAt)} />
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </Grid>

        {/* Card Seguridad - siempre visible, compacta */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 2,
              boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.06)',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none',
              height: '100%',
              borderLeft: user.emailVerified && user.twoFactorEnabled
                ? '4px solid'
                : '4px solid',
              borderLeftColor: user.emailVerified && user.twoFactorEnabled ? 'success.main' : 'warning.main',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Security sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Estado de seguridad
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                <Chip
                  label={user.emailVerified ? 'Email verificado' : 'Email pendiente'}
                  color={user.emailVerified ? 'success' : 'warning'}
                  size="small"
                />
                <Chip
                  label={user.twoFactorEnabled ? '2FA activado' : '2FA desactivado'}
                  color={user.twoFactorEnabled ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {user.emailVerified && user.twoFactorEnabled
                  ? 'Tu cuenta tiene el máximo nivel de seguridad'
                  : 'Considera activar todas las medidas de seguridad'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Acciones rápidas - lista compacta */}
        <Grid item xs={12}>
          <Card
            sx={{
              borderRadius: 2,
              boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.06)',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                Acciones rápidas
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => navigate('/profile')}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    borderColor: isDark ? 'rgba(255,167,38,0.4)' : 'primary.main',
                    color: isDark ? '#FFA726' : 'primary.main',
                  }}
                >
                  Editar perfil
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<LockIcon />}
                  onClick={() => navigate('/profile')}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    borderColor: isDark ? 'rgba(255,167,38,0.4)' : 'primary.main',
                    color: isDark ? '#FFA726' : 'primary.main',
                  }}
                >
                  Cambiar contraseña
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<BuildIcon />}
                  onClick={() => navigate('/profile')}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    borderColor: isDark ? 'rgba(255,167,38,0.4)' : 'primary.main',
                    color: isDark ? '#FFA726' : 'primary.main',
                  }}
                >
                  Configuración de seguridad
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'right' }}>
      {value || '—'}
    </Typography>
  </Box>
);

export default Dashboard;
