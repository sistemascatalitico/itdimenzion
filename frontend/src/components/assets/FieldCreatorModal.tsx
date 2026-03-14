import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

type Props = { open: boolean; onClose: () => void };

const FieldCreatorModal: React.FC<Props> = ({ open, onClose }) => {
  const [type, setType] = useState('TEXT');
  const handleSubmit = () => onClose();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableEnforceFocus>
      <DialogTitle>Crear Campo Personalizado</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField label="Nombre" fullWidth />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Identificador (key)" fullWidth />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select value={type} label="Tipo" onChange={(e) => setType(String(e.target.value))}>
                <MenuItem value="TEXT">Texto</MenuItem>
                <MenuItem value="NUMBER">Número</MenuItem>
                <MenuItem value="DECIMAL">Decimal</MenuItem>
                <MenuItem value="CAPACITY">Capacidad</MenuItem>
                <MenuItem value="SELECT">Select</MenuItem>
                <MenuItem value="MULTISELECT">Multiselect</MenuItem>
                <MenuItem value="CHECKBOX">Checkbox</MenuItem>
                <MenuItem value="DATE">Fecha</MenuItem>
                <MenuItem value="URL">URL</MenuItem>
                <MenuItem value="EMAIL">Email</MenuItem>
                <MenuItem value="COLOR">Color</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField label="Descripción" fullWidth multiline rows={3} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit}>Crear</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FieldCreatorModal;


