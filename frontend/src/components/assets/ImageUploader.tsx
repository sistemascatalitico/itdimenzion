import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Avatar,
  Grid,
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
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Image as ImageIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import assetFilesService from '../../services/assetFilesService';

interface ImageUploaderProps {
  entityType: 'model' | 'asset';
  entityId: number | null;
  onImagesChange?: (images: any[]) => void;
  readonly?: boolean;
}

interface ImageItem {
  id?: number;
  imageUrl: string;
  title?: string;
  imageType?: string;
  order?: number;
  source?: 'model' | 'asset'; // Para distinguir origen cuando se heredan
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  entityType,
  entityId,
  onImagesChange,
  readonly = false,
}) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<ImageItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const [uploadFormData, setUploadFormData] = useState({
    file: null as File | null,
    title: '',
    imageType: 'PHOTO',
    order: 0,
  });

  const imageTypeOptions = [
    { value: 'PHOTO', label: 'Foto' },
    { value: 'DIAGRAM', label: 'Diagrama' },
    { value: 'SCHEMATIC', label: 'Esquema Técnico' },
    { value: 'OTHER', label: 'Otro' },
  ];

  // Cargar imágenes al montar o cambiar entityId
  useEffect(() => {
    if (entityId) {
      loadImages();
    } else {
      setImages([]);
    }
  }, [entityId, entityType]);

  const loadImages = async () => {
    if (!entityId) return;
    
    try {
      setLoading(true);
      let data;
      if (entityType === 'model') {
        data = await assetFilesService.getModelImages(entityId);
      } else {
        // Para assets, usar resolved para ver modelo + asset
        data = await assetFilesService.getResolvedAssetImages(entityId);
        // data tiene estructura { images: [...], fromModel: [...], fromAsset: [...] }
        const imagesArray = data.images || [];
        setImages(imagesArray);
        if (onImagesChange) onImagesChange(imagesArray);
        setLoading(false);
        return;
      }
      
      const imagesArray = Array.isArray(data) ? data : [];
      setImages(imagesArray);
      if (onImagesChange) onImagesChange(imagesArray);
    } catch (error: any) {
      console.error('Error loading images:', error);
      setError('Error al cargar imágenes');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Formato no válido. Use PNG, JPEG, SVG o GIF');
      return;
    }

    // Validar tamaño (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('El archivo es muy grande. Máximo 2MB');
      return;
    }

    setUploadFormData(prev => ({ ...prev, file }));
    setError('');
  };

  const handleUpload = async () => {
    if (!entityId || !uploadFormData.file) return;

    try {
      setUploading(true);
      setError('');

      if (entityType === 'model') {
        await assetFilesService.uploadModelImage(
          entityId,
          uploadFormData.file,
          uploadFormData.title,
          uploadFormData.imageType,
          uploadFormData.order
        );
      } else {
        await assetFilesService.uploadAssetImage(
          entityId,
          uploadFormData.file,
          uploadFormData.title,
          uploadFormData.imageType,
          uploadFormData.order
        );
      }

      // Recargar imágenes
      await loadImages();
      
      // Reset form
      setUploadFormData({
        file: null,
        title: '',
        imageType: 'PHOTO',
        order: images.length,
      });
      setUploadDialogOpen(false);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setError(error.response?.data?.error || 'Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (image: ImageItem) => {
    if (!entityId || !image.id) return;
    
    if (!window.confirm('¿Está seguro de eliminar esta imagen?')) return;

    try {
      if (entityType === 'model') {
        await assetFilesService.deleteModelImage(entityId, image.id);
      } else {
        // Solo eliminar si es del asset, no del modelo (heredadas)
        if (image.source === 'asset') {
          await assetFilesService.deleteAssetImage(entityId, image.id);
        } else {
          alert('No se pueden eliminar imágenes heredadas del modelo');
          return;
        }
      }
      
      await loadImages();
    } catch (error: any) {
      console.error('Error deleting image:', error);
      setError('Error al eliminar imagen');
    }
  };

  const handleEdit = (image: ImageItem) => {
    setEditingImage(image);
    setUploadFormData({
      file: null,
      title: image.title || '',
      imageType: image.imageType || 'PHOTO',
      order: image.order || 0,
    });
    setUploadDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!entityId || !editingImage?.id) return;

    try {
      setUploading(true);
      setError('');

      const updateData = {
        title: uploadFormData.title,
        imageType: uploadFormData.imageType,
        order: uploadFormData.order,
      };

      if (entityType === 'model') {
        await assetFilesService.updateModelImage(entityId, editingImage.id, updateData);
      } else {
        if (editingImage.source === 'asset') {
          await assetFilesService.updateAssetImage(entityId, editingImage.id, updateData);
        } else {
          alert('No se pueden editar imágenes heredadas del modelo');
          return;
        }
      }

      await loadImages();
      setUploadDialogOpen(false);
      setEditingImage(null);
      setUploadFormData({
        file: null,
        title: '',
        imageType: 'PHOTO',
        order: 0,
      });
    } catch (error: any) {
      console.error('Error updating image:', error);
      setError(error.response?.data?.error || 'Error al actualizar imagen');
    } finally {
      setUploading(false);
    }
  };

  const getImageUrl = (imageUrl: string) => {
    // Si es base64, retornar directamente
    if (imageUrl.startsWith('data:')) return imageUrl;
    // Si es URL relativa, construir URL completa
    if (imageUrl.startsWith('/uploads')) {
      return `${import.meta.env.VITE_API_URL || 'http://localhost:4701'}${imageUrl}`;
    }
    // Si ya es URL completa, retornar
    return imageUrl;
  };

  if (!entityId) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">Primero debe guardar el {entityType === 'model' ? 'modelo' : 'activo'}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Imágenes {entityType === 'model' ? 'del Modelo' : 'del Activo'}
        </Typography>
        {!readonly && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingImage(null);
              setUploadFormData({
                file: null,
                title: '',
                imageType: 'PHOTO',
                order: images.length,
              });
              setUploadDialogOpen(true);
            }}
            sx={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)',
              color: 'white',
            }}
          >
            Agregar Imagen
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : images.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center', border: '2px dashed #ddd', borderRadius: 2 }}>
          <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body2" color="textSecondary">
            No hay imágenes {entityType === 'model' ? 'del modelo' : 'del activo'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {images.map((image, index) => (
            <Grid item xs={12} sm={6} md={4} key={image.id || index}>
              <Box
                sx={{
                  position: 'relative',
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  overflow: 'hidden',
                  '&:hover': {
                    boxShadow: 2,
                  },
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: '75%', // Aspect ratio 4:3
                    backgroundColor: '#f5f5f5',
                  }}
                >
                  <img
                    src={getImageUrl(image.imageUrl)}
                    alt={image.title || 'Imagen'}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW4gTm8gRGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                  {image.source === 'model' && entityType === 'asset' && (
                    <Chip
                      label="Del Modelo"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(255, 107, 107, 0.9)',
                        color: 'white',
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ p: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                    {image.title || 'Sin título'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {imageTypeOptions.find(opt => opt.value === image.imageType)?.label || image.imageType}
                  </Typography>
                </Box>
                {!readonly && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      display: 'flex',
                      gap: 0.5,
                    }}
                  >
                    {!(image.source === 'model' && entityType === 'asset') && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(image)}
                          sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(image)}
                          sx={{
                            backgroundColor: 'rgba(255, 107, 107, 0.9)',
                            color: 'white',
                            '&:hover': { backgroundColor: 'rgba(255, 107, 107, 1)' },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </Box>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog para subir/editar imagen */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => {
          if (!uploading) {
            setUploadDialogOpen(false);
            setEditingImage(null);
            setUploadFormData({
              file: null,
              title: '',
              imageType: 'PHOTO',
              order: 0,
            });
            setError('');
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingImage ? 'Editar Imagen' : 'Subir Imagen'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {error && (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {!editingImage && (
              <Box>
                <input
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/gif"
                  style={{ display: 'none' }}
                  id="image-upload"
                  type="file"
                  onChange={handleFileSelect}
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    startIcon={<ImageIcon />}
                    sx={{
                      borderColor: '#FF6B6B',
                      color: '#FF6B6B',
                      '&:hover': {
                        borderColor: '#FF5252',
                        backgroundColor: 'rgba(255, 107, 107, 0.04)',
                      },
                    }}
                  >
                    {uploadFormData.file ? uploadFormData.file.name : 'Seleccionar Imagen (PNG, JPEG, SVG, GIF - Máx. 2MB)'}
                  </Button>
                </label>
                {uploadFormData.file && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Avatar
                      src={URL.createObjectURL(uploadFormData.file)}
                      alt="Preview"
                      sx={{ width: 120, height: 120 }}
                    />
                  </Box>
                )}
              </Box>
            )}

            <TextField
              fullWidth
              label="Título"
              value={uploadFormData.title}
              onChange={(e) => setUploadFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ej: Vista frontal, Diagrama técnico, etc."
            />

            <FormControl fullWidth>
              <InputLabel>Tipo de Imagen</InputLabel>
              <Select
                value={uploadFormData.imageType}
                onChange={(e) => setUploadFormData(prev => ({ ...prev, imageType: e.target.value }))}
                label="Tipo de Imagen"
              >
                {imageTypeOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="number"
              label="Orden"
              value={uploadFormData.order}
              onChange={(e) => setUploadFormData(prev => ({ ...prev, order: Number(e.target.value) }))}
              helperText="Orden de visualización (0 = primero)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setUploadDialogOpen(false);
              setEditingImage(null);
              setUploadFormData({
                file: null,
                title: '',
                imageType: 'PHOTO',
                order: 0,
              });
              setError('');
            }}
            disabled={uploading}
          >
            Cancelar
          </Button>
          <Button
            onClick={editingImage ? handleUpdate : handleUpload}
            variant="contained"
            disabled={uploading || (!editingImage && !uploadFormData.file)}
            sx={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)',
              color: 'white',
            }}
          >
            {uploading ? 'Guardando...' : editingImage ? 'Actualizar' : 'Subir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImageUploader;

