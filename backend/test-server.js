const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4001;

// Middleware básico
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Ruta de prueba
app.get('/health', (req, res) => {
  console.log('Health check received');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Test server is working'
  });
});

// Ruta de login de prueba
app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  res.json({
    message: 'Login endpoint is working',
    accessToken: 'test-token',
    user: {
      email: req.body.email,
      firstName: 'Test',
      lastName: 'User',
      role: 'USER'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});