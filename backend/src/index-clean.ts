import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { connectDatabase } from './config/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4002; // Use environment PORT or 4002 as fallback

console.log('🚀 Starting ITDimenzion Clean Server...');

// Basic CORS - permissive for debugging
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3007'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    port: PORT
  });
});

// Import routes
import authRoutes from './routes/auth.routes';
import enhancedUserRoutes from './routes/enhancedUsers';
import companyRoutes from './routes/companies';
import roleRoutes from './routes/roles';
import processRoutes from './routes/processes';
import headquartersRoutes from './routes/headquarters';
import jobTitleRoutes from './routes/jobTitles';

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', enhancedUserRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/processes', processRoutes);
app.use('/api/headquarters', headquartersRoutes);
app.use('/api/job-titles', jobTitleRoutes);

// API root endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'ITDimenzion API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      companies: '/api/companies',
      roles: '/api/roles',
      processes: '/api/processes',
      headquarters: '/api/headquarters',
      jobTitles: '/api/job-titles',
      health: '/health',
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 Not found:', req.originalUrl);
  res.status(404).json({
    error: 'Route not found',
    statusCode: 404,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Global error handler:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    statusCode: err.status || 500,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
const startServer = async () => {
  try {
    console.log('🔌 Connecting to database...');
    await connectDatabase();
    console.log('✅ Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`
🚀 ITDimenzion Clean Server started successfully!
📍 URL: http://localhost:${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🏥 Health: http://localhost:${PORT}/health
🔐 Auth: http://localhost:${PORT}/api/auth
⏰ Started at: ${new Date().toISOString()}
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();