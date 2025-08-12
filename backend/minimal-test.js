const http = require('http');

const server = http.createServer((req, res) => {
  console.log('Request received:', req.method, req.url);
  
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'http://localhost:3003',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true'
  });
  
  if (req.method === 'OPTIONS') {
    res.end();
    return;
  }
  
  if (req.url === '/health') {
    res.end(JSON.stringify({
      status: 'OK',
      message: 'Minimal server working',
      timestamp: new Date().toISOString()
    }));
  } else if (req.url === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      console.log('Login request body:', body);
      res.end(JSON.stringify({
        message: 'Minimal login test successful',
        accessToken: 'minimal-test-token',
        user: { email: 'test@test.com', firstName: 'Test', lastName: 'User' }
      }));
    });
  } else {
    res.end(JSON.stringify({
      message: 'Minimal test server is running'
    }));
  }
});

const PORT = 4002;
server.listen(PORT, () => {
  console.log(`🚀 Minimal server running on http://localhost:${PORT}`);
});