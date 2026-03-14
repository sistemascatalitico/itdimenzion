import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';

interface PhotoItem {
  id?: string;
  file: File;
  preview: string;
  imageType: 'PHOTO' | 'FRONT' | 'BACK';
  title?: string;
}

interface PhotosTabProps {
  photos: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
  loading?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const PhotosTab: React.FC<PhotosTabProps> = ({
  photos,
  onChange,
  loading = false,
}) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadFormData, setUploadFormData] = useState({
    file: null as File | null,
    title: '',
    imageType: 'PHOTO' as 'PHOTO' | 'FRONT' | 'BACK',
  });

  const imageTypeOptions = [
    { value: 'PHOTO', label: 'General' },
    { value: 'FRONT', label: 'Frontal' },
    { value: 'BACK', label: 'Trasera' },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Solo se permiten imágenes JPG, PNG o WEBP');
      return;
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      setError(`El archivo excede el tamaño máximo de 10MB (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadFormData({
        file,
        title: file.name.replace(/\.[^/.]+$/, ''), // Nombre sin extensión
        imageType: 'PHOTO',
      });
      setError('');
      setUploadDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleAddPhoto = () => {
    if (!uploadFormData.file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const newPhoto: PhotoItem = {
        id: `temp_${Date.now()}`,
        file: uploadFormData.file!,
        preview: e.target?.result as string,
        imageType: uploadFormData.imageType,
        title: uploadFormData.title || uploadFormData.file.name,
      };

      onChange([...photos, newPhoto]);
      setUploadFormData({
        file: null,
        title: '',
        imageType: 'PHOTO',
      });
      setUploadDialogOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(uploadFormData.file);
  };

  const handleDeletePhoto = (photoId: string) => {
    onChange(photos.filter(p => p.id !== photoId));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Fotos del Activo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Agrega fotos del activo (frontal, trasera o general). Máximo 10MB por foto.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          Agregar Foto
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {photos.length === 0 ? (
        <Box
          sx={{
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
          }}
        >
          <PhotoCameraIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No hay fotos agregadas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Haz clic en "Agregar Foto" para comenzar
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {photos.map((photo) => (
            <Grid item xs={12} sm={6} md={4} key={photo.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={photo.preview}
                  alt={photo.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2" noWrap>
                        {photo.title}
                      </Typography>
                      <Chip
                        label={imageTypeOptions.find(o => o.value === photo.imageType)?.label || photo.imageType}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeletePhoto(photo.id!)}
                      disabled={loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog para configurar foto */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configurar Foto</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {uploadFormData.file && (
              <Box sx={{ textAlign: 'center' }}>
                <img
                  src={URL.createObjectURL(uploadFormData.file)}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 8 }}
                />
              </Box>
            )}
            <TextField
              label="Título"
              value={uploadFormData.title}
              onChange={(e) => setUploadFormData({ ...uploadFormData, title: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Tipo de Foto</InputLabel>
              <Select
                value={uploadFormData.imageType}
                label="Tipo de Foto"
                onChange={(e) => setUploadFormData({ ...uploadFormData, imageType: e.target.value as any })}
              >
                {imageTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleAddPhoto}
            disabled={!uploadFormData.file || uploading}
          >
            {uploading ? <CircularProgress size={20} /> : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PhotosTab;

