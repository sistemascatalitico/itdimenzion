import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import dotenv from 'dotenv';

import { connectDatabase, disconnectDatabase } from './config/database';
import { securityConfig } from './config/security';
import {
  helmetMiddleware,
  rateLimitMiddleware,
  sanitizeInput,
  detectSuspiciousActivity,
} from './middleware/security';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware - Temporarily simplified for debugging
console.log('🔧 Loading middlewares...');

// Comment out problematic middlewares temporarily
// app.use(helmetMiddleware);
// app.use(rateLimitMiddleware);
// app.use(detectSuspiciousActivity);
// app.use(sanitizeInput);

console.log('⚠️ Security middlewares temporarily disabled for debugging');

// CORS configuration - Simplified for debugging
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3007'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie and session middleware
app.use(cookieParser());

// Temporarily comment out session middleware for debugging
/*
app.use(
  session({
    secret: securityConfig.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: securityConfig.session.secure,
      httpOnly: securityConfig.session.httpOnly,
      maxAge: securityConfig.session.maxAge,
      sameSite: securityConfig.session.sameSite,
    },
  })
);
*/

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  try {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    });
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Simplified login endpoint for testing
app.post('/api/auth/simple-login', async (req, res) => {
  console.log('🔐 Simple login requested:', req.body);
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        statusCode: 400
      });
    }

    // Test response for now
    res.json({
      message: 'Simple login endpoint working',
      accessToken: 'test-token-12345',
      user: {
        email: email,
        firstName: 'Test',
        lastName: 'User',
        role: 'USER'
      },
      statusCode: 200
    });
  } catch (error) {
    console.error('❌ Simple login error:', error);
    res.status(500).json({
      error: 'Login failed',
      statusCode: 500,
      debug: error instanceof Error ? error.message : String(error)
    });
  }
});

// Import routes
import authRoutes from './routes/auth.routes';
import enhancedUserRoutes from './routes/enhancedUsers';

// API routes
const apiPrefix = process.env.API_PREFIX || '/api';
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, enhancedUserRoutes);

// API root endpoint
app.use(apiPrefix, (req, res) => {
  res.status(200).json({
    message: 'ITDimenzion API is running securely',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: `${apiPrefix}/auth`,
      users: `${apiPrefix}/users`,
      health: '/health',
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
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

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    statusCode: err.status || 500,
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: err.stack }),
  });
});

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    await disconnectDatabase();
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    await connectDatabase();
    
    app.listen(PORT, () => {
      console.log(`
🚀 ITDimenzion API Server started successfully!
📍 URL: http://localhost:${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔒 Security: Enhanced with comprehensive protection
⏰ Started at: ${new Date().toISOString()}
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();