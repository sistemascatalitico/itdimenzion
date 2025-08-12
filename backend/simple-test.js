const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4001; // Use different port to avoid conflicts

// Basic middleware
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.use(express.json());

// Simple test routes
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.status(200).json({
    status: 'OK',
    message: 'Simple test server is running',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Login test requested:', req.body);
  res.json({
    message: 'Test login successful',
    accessToken: 'test-token-123',
    user: {
      email: req.body.email,
      firstName: 'Test',
      lastName: 'User',
      role: 'USER'
    }
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'Simple test API is running',
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple test server running on http://localhost:${PORT}`);
});