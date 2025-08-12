const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4001;

// CORS muy permisivo para testing
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  console.log('Health check received');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Simple login endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required'
    });
  }
  
  // Simulate successful login
  res.json({
    message: 'Login successful',
    accessToken: 'test-token-12345',
    user: {
      id: 1,
      email: email,
      firstName: 'Test',
      lastName: 'User',
      role: 'USER'
    }
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Test API is running',
    endpoints: {
      health: '/health',
      login: '/api/auth/login'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login endpoint: http://localhost:${PORT}/api/auth/login`);
});