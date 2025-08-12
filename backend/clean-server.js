const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// Import the auth controller and routes
const authRoutes = require('./src/routes/auth.routes.ts');

const app = express();
const PORT = 4000;

console.log('🚀 Starting ITDimenzion Clean Server...');

// Basic middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3007'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes.default || authRoutes);

// API root
app.get('/api', (req, res) => {
  res.json({
    message: 'ITDimenzion API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      health: '/health'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 Not found:', req.originalUrl);
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`
🚀 ITDimenzion Clean Server started successfully!
📍 URL: http://localhost:${PORT}
🌍 Environment: development  
🏥 Health: http://localhost:${PORT}/health
🔐 Auth API: http://localhost:${PORT}/api/auth
⏰ Started at: ${new Date().toISOString()}
  `);
});

module.exports = app;