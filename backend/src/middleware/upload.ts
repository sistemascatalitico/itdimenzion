import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Crear directorios si no existen
const uploadsDir = path.join(__dirname, '../../uploads');
const manufacturersDir = path.join(uploadsDir, 'manufacturers');
const modelsImagesDir = path.join(uploadsDir, 'models/images');
const modelsDocsDir = path.join(uploadsDir, 'models/documents');
const assetsImagesDir = path.join(uploadsDir, 'assets/images');
const assetsDocsDir = path.join(uploadsDir, 'assets/documents');

[uploadsDir, manufacturersDir, modelsImagesDir, modelsDocsDir, assetsImagesDir, assetsDocsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadsDir;
    
    // Determinar ruta según el tipo
    if (req.path.includes('/manufacturers')) {
      uploadPath = manufacturersDir;
    } else if (req.path.includes('/models') && file.fieldname === 'image') {
      uploadPath = modelsImagesDir;
    } else if (req.path.includes('/models') && file.fieldname === 'document') {
      uploadPath = modelsDocsDir;
    } else if (req.path.includes('/assets') && file.fieldname === 'image') {
      uploadPath = assetsImagesDir;
    } else if (req.path.includes('/assets') && file.fieldname === 'document') {
      uploadPath = assetsDocsDir;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// Filtros de validación
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (JPEG, PNG, SVG, GIF)'));
  }
};

const documentFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten PDFs o imágenes'));
  }
};

// Configuraciones de multer
export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

export const uploadDocument = multer({
  storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB para documentos
  }
});

export const uploadMultipleImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 10 // Máximo 10 imágenes
  }
});

// Helper para convertir archivo a base64 o URL
export const getFileUrl = (file: Express.Multer.File | undefined): string | null => {
  if (!file) return null;
  
  // Si es una imagen pequeña, convertir a base64
  if (file.size < 100 * 1024 && file.mimetype.startsWith('image/')) {
    try {
      const fileBuffer = fs.readFileSync(file.path);
      const base64 = fileBuffer.toString('base64');
      // Eliminar archivo temporal después de convertir a base64
      fs.unlinkSync(file.path);
      return `data:${file.mimetype};base64,${base64}`;
    } catch (error) {
      console.error('Error converting file to base64:', error);
      // Si falla, retornar URL
    }
  }
  
  // Para archivos grandes, retornar URL relativa
  // file.path ya es la ruta completa, necesitamos extraer la parte después de uploads
  const uploadsIndex = file.path.indexOf('uploads');
  if (uploadsIndex !== -1) {
    return `/uploads/${file.path.substring(uploadsIndex + 7).replace(/\\/g, '/')}`;
  }
  
  // Fallback: retornar path completo relativo a uploads
  return file.path.replace(/\\/g, '/');
};

