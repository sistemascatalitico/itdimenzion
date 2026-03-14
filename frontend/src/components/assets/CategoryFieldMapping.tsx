import React from 'react';
import { Box, Card, CardHeader, CardContent, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PageHeader from '../common/PageHeader';
import PageHeaderActionButton from '../common/PageHeaderActionButton';

const CategoryFieldMapping: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Mapeo de Campos por Categoría"
        subtitle="Asigna campos a Categoría → Grupo → Tipo"
        action={<PageHeaderActionButton label="Agregar Campo" startIcon={<AddIcon />} onClick={() => {}} />}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Árbol de Categorías" />
            <CardContent>—</CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Campos Asignados" />
            <CardContent>—</CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CategoryFieldMapping;


