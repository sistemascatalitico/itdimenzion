import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

import { connectDatabase, disconnectDatabase } from './config/database';
import { securityConfig } from './config/security';
import {
  helmetMiddleware,
  rateLimitMiddleware,
  sanitizeInput,
  detectSuspiciousActivity,
} from './middleware/security';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4701;
const isProduction = process.env.NODE_ENV === 'production';

// --------------- CORS (must be before other middleware) ---------------
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim().replace(/\/+$/, ''))
  : ['http://localhost:3701', 'http://127.0.0.1:3701'];

const corsOptions: cors.CorsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, origin);
    // Permitir cualquier subdominio de vercel.app en producción (con credentials hay que devolver el origen exacto)
    if (process.env.NODE_ENV === 'production' && /^https:\/\/[^/]+\.vercel\.app$/.test(origin)) {
      return cb(null, origin);
    }
    cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length'],
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// --------------- Security Middleware ---------------
app.use(helmetMiddleware);
app.use(rateLimitMiddleware);
app.use(sanitizeInput);
app.use(detectSuspiciousActivity);

// --------------- Body parsing ---------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// --------------- Logging ---------------
app.use(morgan(isProduction ? 'combined' : 'dev'));

// --------------- Static files ---------------
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --------------- Health check ---------------
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    port: PORT,
  });
});

// --------------- Routes ---------------
import authRoutes from './routes/auth.routes';
// Rutas que requieren schema nuevo - deshabilitadas hasta alinear schema en repo
// import enhancedUserRoutes from './routes/enhancedUsers';
// import companyRoutes from './routes/companies';
// import headquartersRoutes from './routes/headquarters';
// import processRoutes from './routes/processes';
// import jobTitleRoutes from './routes/jobTitles';
// import assetsCatalogsRoutes from './routes/assetsCatalogs';
// import assetsRoutes from './routes/assets';
// import assetDocumentsRoutes from './routes/assetDocuments';
// import assetAssignmentsRoutes from './routes/assetAssignments';
// import assetTransfersRoutes from './routes/assetTransfers';
// import assetComponentsRoutes from './routes/assetComponents';
// import assetModelFilesRoutes from './routes/assetModelFiles';
// import assetFilesRoutes from './routes/assetFiles';
// import racksRoutes from './routes/racks';
// import customFieldsRoutes from './routes/customFields';
// import formBuilderRoutes from './routes/formBuilder.routes';
// import suppliersRoutes from './routes/suppliers.routes';

app.use('/api/auth', authRoutes);
// app.use('/api/users', enhancedUserRoutes);
// app.use('/api/companies', companyRoutes);
// app.use('/api/headquarters', headquartersRoutes);
// app.use('/api/processes', processRoutes);
// app.use('/api/job-titles', jobTitleRoutes);
// app.use('/api', assetsCatalogsRoutes);
// app.use('/api', assetsRoutes);
// app.use('/api', assetDocumentsRoutes);
// app.use('/api', assetAssignmentsRoutes);
// app.use('/api', assetTransfersRoutes);
// app.use('/api', assetComponentsRoutes);
// app.use('/api', assetModelFilesRoutes);
// app.use('/api', assetFilesRoutes);
// app.use('/api', racksRoutes);
// app.use('/api', customFieldsRoutes);
// app.use('/api/forms', formBuilderRoutes);
// app.use('/api/suppliers', suppliersRoutes);

// --------------- API root ---------------
app.get('/api', (_req, res) => {
  res.status(200).json({
    message: 'ITDimenzion API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// --------------- 404 handler ---------------
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    statusCode: 404,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

// --------------- Global error handler ---------------
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Global error:', err.message);

  res.status(err.status || 500).json({
    error: isProduction ? 'Internal server error' : err.message,
    statusCode: err.status || 500,
    timestamp: new Date().toISOString(),
    ...(!isProduction && { stack: err.stack }),
  });
});

// --------------- Graceful shutdown ---------------
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down...`);
  try {
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// --------------- Start server ---------------
const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`ITDimenzion API running on http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
