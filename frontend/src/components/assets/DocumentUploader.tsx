import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
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
  Link,
} from '@mui/material';
import {
  Description as DocumentIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import assetFilesService from '../../services/assetFilesService';

interface DocumentUploaderProps {
  entityType: 'model' | 'asset';
  entityId: number | null;
  onDocumentsChange?: (documents: any[]) => void;
  readonly?: boolean;
}

interface DocumentItem {
  id?: number;
  fileUrl: string;
  title: string;
  docType?: string;
  fileSize?: number;
  mimeType?: string;
  source?: 'model' | 'asset'; // Para distinguir origen cuando se heredan
  externalRef?: string;
  supplier?: string;
  amount?: number;
  documentDate?: string;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  entityType,
  entityId,
  onDocumentsChange,
  readonly = false,
}) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<DocumentItem | null>(null);
  
  const [uploadFormData, setUploadFormData] = useState({
    file: null as File | null,
    title: '',
    docType: entityType === 'model' ? 'MANUAL' : 'INVOICE',
    externalRef: '',
    supplier: '',
    amount: '',
    documentDate: '',
  });

  // Opciones de tipo de documento según entityType
  const modelDocTypeOptions = [
    { value: 'MANUAL', label: 'Manual de Usuario' },
    { value: 'DATASHEET', label: 'Hoja de Datos Técnica' },
    { value: 'WARRANTY', label: 'Garantía' },
    { value: 'OTHER', label: 'Otro' },
  ];

  const assetDocTypeOptions = [
    { value: 'INVOICE', label: 'Factura' },
    { value: 'CONTRACT', label: 'Contrato' },
    { value: 'WARRANTY', label: 'Garantía' },
    { value: 'DELIVERY', label: 'Entrega de Activo' },
    { value: 'TRANSFER', label: 'Traslado de Activo' },
    { value: 'PHOTO', label: 'Foto del Activo' },
    { value: 'OTHER', label: 'Otro' },
  ];

  const docTypeOptions = entityType === 'model' ? modelDocTypeOptions : assetDocTypeOptions;

  useEffect(() => {
    if (entityId) {
      loadDocuments();
    } else {
      setDocuments([]);
    }
  }, [entityId, entityType]);

  const loadDocuments = async () => {
    if (!entityId) return;
    
    try {
      setLoading(true);
      let data;
      if (entityType === 'model') {
        data = await assetFilesService.getModelDocuments(entityId);
      } else {
        // Para assets, usar resolved para ver modelo + asset
        data = await assetFilesService.getResolvedAssetDocuments(entityId);
        const docsArray = data.documents || [];
        setDocuments(docsArray);
        if (onDocumentsChange) onDocumentsChange(docsArray);
        setLoading(false);
        return;
      }
      
      const docsArray = Array.isArray(data) ? data : [];
      setDocuments(docsArray);
      if (onDocumentsChange) onDocumentsChange(docsArray);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      setError('Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo (PDF o imagen)
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Formato no válido. Use PDF o imagen (PNG, JPEG)');
      return;
    }

    // Validar tamaño (10MB para documentos)
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo es muy grande. Máximo 10MB');
      return;
    }

    setUploadFormData(prev => ({
      ...prev,
      file,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ''), // Nombre sin extensión
    }));
    setError('');
  };

  const handleUpload = async () => {
    if (!entityId || !uploadFormData.file) return;

    try {
      setUploading(true);
      setError('');

      if (entityType === 'model') {
        await assetFilesService.uploadModelDocument(
          entityId,
          uploadFormData.file,
          uploadFormData.title,
          uploadFormData.docType
        );
      } else {
        await assetFilesService.uploadAssetDocument(
          entityId,
          uploadFormData.file,
          uploadFormData.docType,
          uploadFormData.title,
          {
            externalRef: uploadFormData.externalRef || undefined,
            supplier: uploadFormData.supplier || undefined,
            amount: uploadFormData.amount ? Number(uploadFormData.amount) : undefined,
            documentDate: uploadFormData.documentDate || undefined,
          }
        );
      }

      await loadDocuments();
      
      setUploadFormData({
        file: null,
        title: '',
        docType: entityType === 'model' ? 'MANUAL' : 'INVOICE',
        externalRef: '',
        supplier: '',
        amount: '',
        documentDate: '',
      });
      setUploadDialogOpen(false);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      setError(error.response?.data?.error || 'Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (document: DocumentItem) => {
    if (!entityId || !document.id) return;
    
    if (!window.confirm('¿Está seguro de eliminar este documento?')) return;

    try {
      if (entityType === 'model') {
        await assetFilesService.deleteModelDocument(entityId, document.id);
      } else {
        if (document.source === 'asset') {
          await assetFilesService.deleteAssetDocument(entityId, document.id);
        } else {
          alert('No se pueden eliminar documentos heredados del modelo');
          return;
        }
      }
      
      await loadDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      setError('Error al eliminar documento');
    }
  };

  const handleEdit = (document: DocumentItem) => {
    setEditingDocument(document);
    setUploadFormData({
      file: null,
      title: document.title,
      docType: document.docType || (entityType === 'model' ? 'MANUAL' : 'INVOICE'),
      externalRef: document.externalRef || '',
      supplier: document.supplier || '',
      amount: document.amount?.toString() || '',
      documentDate: document.documentDate?.split('T')[0] || '',
    });
    setUploadDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!entityId || !editingDocument?.id) return;

    try {
      setUploading(true);
      setError('');

      const updateData: any = {
        title: uploadFormData.title,
        docType: uploadFormData.docType,
      };

      if (entityType === 'asset') {
        updateData.externalRef = uploadFormData.externalRef || undefined;
        updateData.supplier = uploadFormData.supplier || undefined;
        updateData.amount = uploadFormData.amount ? Number(uploadFormData.amount) : undefined;
        updateData.documentDate = uploadFormData.documentDate || undefined;
      }

      if (entityType === 'model') {
        await assetFilesService.updateModelDocument(entityId, editingDocument.id, updateData);
      } else {
        if (editingDocument.source === 'asset') {
          await assetFilesService.updateAssetDocument(entityId, editingDocument.id, updateData, uploadFormData.file || undefined);
        } else {
          alert('No se pueden editar documentos heredados del modelo');
          return;
        }
      }

      await loadDocuments();
      setUploadDialogOpen(false);
      setEditingDocument(null);
      setUploadFormData({
        file: null,
        title: '',
        docType: entityType === 'model' ? 'MANUAL' : 'INVOICE',
        externalRef: '',
        supplier: '',
        amount: '',
        documentDate: '',
      });
    } catch (error: any) {
      console.error('Error updating document:', error);
      setError(error.response?.data?.error || 'Error al actualizar documento');
    } finally {
      setUploading(false);
    }
  };

  const getDocumentUrl = (fileUrl: string) => {
    // Si ya es una URL completa, retornar directamente
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }
    
    // Normalizar la URL base (eliminar slash final si existe)
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:4701/api').replace(/\/$/, '');
    
    // Normalizar fileUrl (eliminar slash inicial si existe, luego agregar uno)
    const normalizedPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    
    // Construir URL completa evitando doble slash
    if (normalizedPath.startsWith('/uploads')) {
      return `${baseUrl}${normalizedPath}`;
    }
    
    // Si no empieza con /uploads, agregarlo
    return `${baseUrl}/uploads${normalizedPath}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType?: string) => {
    if (mimeType === 'application/pdf') return <PdfIcon />;
    if (mimeType?.startsWith('image/')) return <ImageIcon />;
    return <DocumentIcon />;
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
          Documentos {entityType === 'model' ? 'del Modelo' : 'del Activo'}
        </Typography>
        {!readonly && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingDocument(null);
              setUploadFormData({
                file: null,
                title: '',
                docType: entityType === 'model' ? 'MANUAL' : 'INVOICE',
                externalRef: '',
                supplier: '',
                amount: '',
                documentDate: '',
              });
              setUploadDialogOpen(true);
            }}
            sx={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)',
              color: 'white',
            }}
          >
            Agregar Documento
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
      ) : documents.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center', border: '2px dashed #ddd', borderRadius: 2 }}>
          <DocumentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body2" color="textSecondary">
            No hay documentos {entityType === 'model' ? 'del modelo' : 'del activo'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {documents.map((doc, index) => (
            <Grid item xs={12} sm={6} md={4} key={doc.id || index}>
              <Box
                sx={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  p: 2,
                  '&:hover': {
                    boxShadow: 2,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {getFileIcon(doc.mimeType)}
                  <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
                    {doc.title}
                  </Typography>
                  {doc.source === 'model' && entityType === 'asset' && (
                    <Chip
                      label="Del Modelo"
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(255, 107, 107, 0.9)',
                        color: 'white',
                      }}
                    />
                  )}
                </Box>
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
                  {docTypeOptions.find(opt => opt.value === doc.docType)?.label || doc.docType}
                </Typography>
                {doc.fileSize && (
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
                    {formatFileSize(doc.fileSize)}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                  <Link
                    href={getDocumentUrl(doc.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Abrir en Nueva Pestaña
                  </Link>
                  {doc.mimeType === 'application/pdf' || doc.fileUrl.toLowerCase().endsWith('.pdf') ? (
                    <Link
                      component="button"
                      variant="body2"
                      onClick={() => {
                        setViewingDocument(doc);
                        setPdfViewerOpen(true);
                      }}
                      sx={{ fontSize: '0.75rem', cursor: 'pointer', textAlign: 'left', p: 0 }}
                    >
                      Ver PDF
                    </Link>
                  ) : null}
                </Box>
                {!readonly && !(doc.source === 'model' && entityType === 'asset') && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(doc)}
                      sx={{ color: '#FF6B6B' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(doc)}
                      sx={{ color: '#FF6B6B' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog para subir/editar documento */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => {
          if (!uploading) {
            setUploadDialogOpen(false);
            setEditingDocument(null);
            setUploadFormData({
              file: null,
              title: '',
              docType: entityType === 'model' ? 'MANUAL' : 'INVOICE',
              externalRef: '',
              supplier: '',
              amount: '',
              documentDate: '',
            });
            setError('');
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingDocument ? 'Editar Documento' : 'Subir Documento'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {error && (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {!editingDocument && (
              <Box>
                <input
                  accept="application/pdf,image/png,image/jpeg,image/jpg"
                  style={{ display: 'none' }}
                  id="document-upload"
                  type="file"
                  onChange={handleFileSelect}
                />
                <label htmlFor="document-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    startIcon={<DocumentIcon />}
                    sx={{
                      borderColor: '#FF6B6B',
                      color: '#FF6B6B',
                      '&:hover': {
                        borderColor: '#FF5252',
                        backgroundColor: 'rgba(255, 107, 107, 0.04)',
                      },
                    }}
                  >
                    {uploadFormData.file ? uploadFormData.file.name : 'Seleccionar Documento (PDF o Imagen - Máx. 10MB)'}
                  </Button>
                </label>
              </Box>
            )}

            <TextField
              fullWidth
              label="Título *"
              value={uploadFormData.title}
              onChange={(e) => setUploadFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />

            <FormControl fullWidth>
              <InputLabel>Tipo de Documento *</InputLabel>
              <Select
                value={uploadFormData.docType}
                onChange={(e) => setUploadFormData(prev => ({ ...prev, docType: e.target.value }))}
                label="Tipo de Documento *"
              >
                {docTypeOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {entityType === 'asset' && (
              <>
                <TextField
                  fullWidth
                  label="Referencia Externa"
                  value={uploadFormData.externalRef}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, externalRef: e.target.value }))}
                />
                <TextField
                  fullWidth
                  label="Proveedor"
                  value={uploadFormData.supplier}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, supplier: e.target.value }))}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Monto"
                  value={uploadFormData.amount}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, amount: e.target.value }))}
                />
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha del Documento"
                  value={uploadFormData.documentDate}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, documentDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setUploadDialogOpen(false);
              setEditingDocument(null);
              setUploadFormData({
                file: null,
                title: '',
                docType: entityType === 'model' ? 'MANUAL' : 'INVOICE',
                externalRef: '',
                supplier: '',
                amount: '',
                documentDate: '',
              });
              setError('');
            }}
            disabled={uploading}
          >
            Cancelar
          </Button>
          <Button
            onClick={editingDocument ? handleUpdate : handleUpload}
            variant="contained"
            disabled={uploading || (!editingDocument && !uploadFormData.file) || !uploadFormData.title}
            sx={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E6B 100%)',
              color: 'white',
            }}
          >
            {uploading ? 'Guardando...' : editingDocument ? 'Actualizar' : 'Subir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Visor de PDF */}
      <Dialog
        open={pdfViewerOpen}
        onClose={() => {
          setPdfViewerOpen(false);
          setViewingDocument(null);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle>
          {viewingDocument?.title || 'Visor de PDF'}
          <IconButton
            aria-label="close"
            onClick={() => {
              setPdfViewerOpen(false);
              setViewingDocument(null);
            }}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <DeleteIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
          {viewingDocument && (
            <Box sx={{ height: '100%', width: '100%' }}>
              <iframe
                src={getDocumentUrl(viewingDocument.fileUrl)}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                title={viewingDocument.title}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DocumentUploader;

