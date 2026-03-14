import React, { useState } from 'react';
import { Box, Card, CardHeader, CardContent, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FieldCreatorModal from './FieldCreatorModal';
import PageHeader from '../common/PageHeader';
import PageHeaderActionButton from '../common/PageHeaderActionButton';

const FieldBuilder: React.FC = () => {
  const [openCreator, setOpenCreator] = useState(false);

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Constructor de Campos"
        subtitle="Define campos reutilizables para categorías, grupos y tipos"
        action={<PageHeaderActionButton label="Nuevo Campo" startIcon={<AddIcon />} onClick={() => setOpenCreator(true)} />}
      />

      <Card>
        <CardHeader title="Campos Definidos" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>No hay datos</Grid>
          </Grid>
        </CardContent>
      </Card>

      <FieldCreatorModal open={openCreator} onClose={() => setOpenCreator(false)} />
    </Box>
  );
};

export default FieldBuilder;


