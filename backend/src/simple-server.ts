import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

dotenv.config();

console.log('🚀 Starting simple server...');

const app = express();
const PORT = 4007;
const prisma = new PrismaClient();

// Basic middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

console.log('✅ Middleware configured');

// Basic routes
app.get('/health', (req, res) => {
  console.log('🏥 Health check hit');
  res.json({ status: 'OK', message: 'Simple server working' });
});

app.post('/api/auth/login', async (req, res) => {
  console.log('🔐 Login request:', req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son requeridos',
        statusCode: 400
      });
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        headquarters: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        error: 'Credenciales inválidas',
        statusCode: 401
      });
    }

    console.log('👤 User found:', { email: user.email, role: user.role });

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({
        error: 'Credenciales inválidas',
        statusCode: 401
      });
    }

    console.log('✅ Login successful for:', email);

    // Return success
    res.json({
      message: 'Login exitoso',
      accessToken: 'simple-token-' + Date.now(),
      user: {
        documentNumber: user.documentNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        headquarters: user.headquarters,
      },
      statusCode: 200
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      statusCode: 500,
      debug: error instanceof Error ? error.message : String(error)
    });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  console.log('📝 Register request:', req.body);
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      documentType,
      documentNumber,
      phone,
      headquartersId,
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { documentNumber },
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Usuario ya existe con este email o documento',
        statusCode: 409,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate username
    const username = `user_${documentNumber}`;

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username,
        password: hashedPassword,
        firstName,
        lastName,
        documentType,
        documentNumber,
        phone,
        headquartersId: parseInt(headquartersId, 10),
        role: 'USER',
        status: 'ACTIVE',
      },
      select: {
        documentNumber: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    console.log('✅ User registered successfully:', newUser.email);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: newUser,
      statusCode: 201,
    });

  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      statusCode: 500,
      debug: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get users endpoint
app.get('/api/users', async (req, res) => {
  console.log('👥 Get users requested');
  try {
    const users = await prisma.user.findMany({
      select: {
        documentNumber: true,
        documentType: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        username: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
            nit: true,
          }
        },
        headquarters: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        jobTitle: {
          select: {
            id: true,
            name: true,
            code: true,
            process: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Found ${users.length} users`);
    res.json({
      users: users,
      pagination: {
        page: 1,
        limit: 50,
        total: users.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      error: 'Error loading users',
      statusCode: 500
    });
  }
});

// Get companies endpoint
app.get('/api/companies', async (req, res) => {
  console.log('🏢 Get companies requested');
  try {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        nit: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      where: {
        status: 'ACTIVE'
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`✅ Found ${companies.length} companies`);
    res.json({
      companies: companies
    });
  } catch (error) {
    console.error('❌ Get companies error:', error);
    res.status(500).json({
      error: 'Error loading companies',
      statusCode: 500
    });
  }
});

// Get headquarters endpoint
app.get('/api/headquarters', async (req, res) => {
  console.log('🏢 Get headquarters requested');
  try {
    const headquarters = await prisma.headquarters.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        companyId: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      where: {
        status: 'ACTIVE'
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`✅ Found ${headquarters.length} headquarters`);
    res.json({
      headquarters: headquarters
    });
  } catch (error) {
    console.error('❌ Get headquarters error:', error);
    res.status(500).json({
      error: 'Error loading headquarters',
      statusCode: 500
    });
  }
});

// Get processes endpoint
app.get('/api/processes', async (req, res) => {
  console.log('⚙️ Get processes requested');
  try {
    const processes = await prisma.process.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      where: {
        status: 'ACTIVE'
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`✅ Found ${processes.length} processes`);
    res.json({
      processes: processes
    });
  } catch (error) {
    console.error('❌ Get processes error:', error);
    res.status(500).json({
      error: 'Error loading processes',
      statusCode: 500
    });
  }
});

// Get job titles endpoint
app.get('/api/job-titles', async (req, res) => {
  console.log('💼 Get job titles requested');
  try {
    const jobTitles = await prisma.jobTitle.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        processId: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      where: {
        status: 'ACTIVE'
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`✅ Found ${jobTitles.length} job titles`);
    res.json({
      jobTitles: jobTitles
    });
  } catch (error) {
    console.error('❌ Get job titles error:', error);
    res.status(500).json({
      error: 'Error loading job titles',
      statusCode: 500
    });
  }
});

// Create user endpoint
app.post('/api/users', async (req, res) => {
  console.log('➕ Create user requested:', req.body);
  try {
    const {
      firstName,
      lastName,
      email,
      username,
      password,
      documentType,
      documentNumber,
      phone,
      role,
      companyId,
      headquartersId,
      processId,
      jobTitleId
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { documentNumber },
          ...(username ? [{ username }] : [])
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Usuario ya existe con este email, documento o username',
        statusCode: 409,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username || `user_${documentNumber}`,
        password: hashedPassword,
        firstName,
        lastName,
        documentType,
        documentNumber,
        phone,
        role: role || 'USER',
        status: 'ACTIVE',
        companyId: companyId ? parseInt(companyId) : null,
        headquartersId: headquartersId ? parseInt(headquartersId) : null,
        processId: processId ? parseInt(processId) : null,
        jobTitleId: jobTitleId ? parseInt(jobTitleId) : null,
      },
      select: {
        documentNumber: true,
        documentType: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
    });

    console.log('✅ User created successfully:', newUser.email);

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: newUser,
      statusCode: 201,
    });

  } catch (error) {
    console.error('❌ Create user error:', error);
    res.status(500).json({
      error: 'Error creando usuario',
      statusCode: 500,
      debug: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get('/', (req, res) => {
  console.log('🏠 Root hit');
  res.json({ message: 'Simple server running' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err);
  res.status(500).json({ error: err.message });
});

// Start server
console.log('🔧 Starting server on port', PORT);
app.listen(PORT, () => {
  console.log(`✅ Simple server running on http://localhost:${PORT}`);
});