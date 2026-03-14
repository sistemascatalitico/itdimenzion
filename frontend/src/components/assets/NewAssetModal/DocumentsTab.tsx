import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
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
  Description as DocumentIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
} from '@mui/icons-material';

interface DocumentItem {
  id?: string;
  file: File;
  docType: 'INVOICE' | 'MANUAL' | 'DATASHEET' | 'OTHER';
  title: string;
  otherType?: string; // Si docType es OTHER
}

interface DocumentsTabProps {
  documents: DocumentItem[];
  onChange: (documents: DocumentItem[]) => void;
  loading?: boolean;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
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
    docType: 'INVOICE' as 'INVOICE' | 'MANUAL' | 'DATASHEET' | 'OTHER',
    otherType: '',
  });

  const docTypeOptions = [
    { value: 'INVOICE', label: 'Factura' },
    { value: 'MANUAL', label: 'Manual' },
    { value: 'DATASHEET', label: 'Datasheet' },
    { value: 'OTHER', label: 'Otro' },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Solo se permiten archivos PDF o imágenes (JPG, PNG)');
      return;
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      setError(`El archivo excede el tamaño máximo de 50MB (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      return;
    }

    setUploadFormData({
      file,
      title: file.name.replace(/\.[^/.]+$/, ''), // Nombre sin extensión
      docType: 'INVOICE',
      otherType: '',
    });
    setError('');
    setUploadDialogOpen(true);
  };

  const handleAddDocument = () => {
    if (!uploadFormData.file) return;

    // Validar que si es OTHER, tenga otherType
    if (uploadFormData.docType === 'OTHER' && !uploadFormData.otherType?.trim()) {
      setError('Debes especificar el tipo de documento cuando seleccionas "Otro"');
      return;
    }

    const newDocument: DocumentItem = {
      id: `temp_${Date.now()}`,
      file: uploadFormData.file,
      docType: uploadFormData.docType,
      title: uploadFormData.title || uploadFormData.file.name,
      otherType: uploadFormData.docType === 'OTHER' ? uploadFormData.otherType : undefined,
    };

    onChange([...documents, newDocument]);
    setUploadFormData({
      file: null,
      title: '',
      docType: 'INVOICE',
      otherType: '',
    });
    setUploadDialogOpen(false);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = (docId: string) => {
    onChange(documents.filter(d => d.id !== docId));
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') {
      return <PdfIcon />;
    }
    return <ImageIcon />;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Documentos del Activo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Agrega documentos relacionados (factura, manual, datasheet, etc.). Máximo 50MB por documento.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          Agregar Documento
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/jpg,image/png"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {documents.length === 0 ? (
        <Box
          sx={{
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
          }}
        >
          <DocumentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No hay documentos agregados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Haz clic en "Agregar Documento" para comenzar
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {documents.map((doc) => (
            <Grid item xs={12} sm={6} md={4} key={doc.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                      <Box sx={{ color: 'text.secondary' }}>
                        {getFileIcon(doc.file.type)}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>
                          {doc.title}
                        </Typography>
                        <Chip
                          label={doc.docType === 'OTHER' ? doc.otherType : docTypeOptions.find(o => o.value === doc.docType)?.label || doc.docType}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteDocument(doc.id!)}
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

      {/* Dialog para configurar documento */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configurar Documento</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Título"
              value={uploadFormData.title}
              onChange={(e) => setUploadFormData({ ...uploadFormData, title: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Tipo de Documento</InputLabel>
              <Select
                value={uploadFormData.docType}
                label="Tipo de Documento"
                onChange={(e) => setUploadFormData({ ...uploadFormData, docType: e.target.value as any, otherType: '' })}
              >
                {docTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {uploadFormData.docType === 'OTHER' && (
              <TextField
                label="Especificar tipo de documento"
                value={uploadFormData.otherType}
                onChange={(e) => setUploadFormData({ ...uploadFormData, otherType: e.target.value })}
                fullWidth
                required
                helperText="Ej: Certificado, Licencia, etc."
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleAddDocument}
            disabled={!uploadFormData.file || uploading || (uploadFormData.docType === 'OTHER' && !uploadFormData.otherType?.trim())}
          >
            {uploading ? <CircularProgress size={20} /> : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentsTab;

