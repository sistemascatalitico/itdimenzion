import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, IconButton, Tooltip } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import PageHeader from '../common/PageHeader';

const AssetDashboard: React.FC = () => {
  const handleSettingsOpen = () => {};
  const handleNavigate = (path: string) => {};

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Dashboard de Activos"
        subtitle="Vista general del inventario de activos"
        endIcon={
          <Tooltip title="Configurar Dashboard">
            <IconButton onClick={handleSettingsOpen} color="inherit" size="medium">
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        }
      />

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Total Activos</Typography>
              <Typography variant="h4">0</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">En Mantenimiento</Typography>
              <Typography variant="h4">0</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Asignados</Typography>
              <Typography variant="h4">0</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Disponibles</Typography>
              <Typography variant="h4">0</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Button fullWidth variant="contained" onClick={() => handleNavigate('/assets/list')}>Gestionar Activos</Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button fullWidth variant="outlined" onClick={() => handleNavigate('/assets/categories')}>Categorías</Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button fullWidth variant="outlined" onClick={() => handleNavigate('/assets/groups')}>Grupos</Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button fullWidth variant="outlined" onClick={() => handleNavigate('/assets/models')}>Modelos</Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AssetDashboard;


