import React, { useState } from 'react';
import { Box, Paper, Grid, Typography, Tabs, Tab, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const AssetDetail: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const handleBack = () => {};

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>Volver</Button>
      </Box>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ bgcolor: 'grey.100', borderRadius: 1, height: 180 }} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="h5">Activo - Detalle</Typography>
            <Typography variant="body2" color="text.secondary">Código: —</Typography>
          </Grid>
        </Grid>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label="Overview" />
            <Tab label="Documents" />
            <Tab label="Assignments" />
            <Tab label="Transfers/Loans" />
            <Tab label="Components" />
            <Tab label="Rack" />
          </Tabs>
        </Box>

        <Box sx={{ mt: 2 }}>
          {activeTab === 0 && (<Box>—</Box>)}
          {activeTab === 1 && (<Box>—</Box>)}
          {activeTab === 2 && (<Box>—</Box>)}
          {activeTab === 3 && (<Box>—</Box>)}
          {activeTab === 4 && (<Box>—</Box>)}
          {activeTab === 5 && (<Box>—</Box>)}
        </Box>
      </Paper>
    </Box>
  );
};

export default AssetDetail;


