# ITDimenzion Enterprise Management System

A modern, full-stack enterprise management system built with cutting-edge technologies for scalable business operations.

## Developer

**Iltonys Verbel**  
**VERBELTECH Solutions**  
iltonysverbel@gmail.com

- **Frontend**: React 19.1 + TypeScript + Material-UI v7
- **Backend**: Node.js + Express + TypeScript
- **Database**: MySQL 8.0 + Prisma ORM
- **Authentication**: JWT with role-based access control
- **Deployment**: Docker & Docker Compose ready

## Key Features

### Authentication & Security
- Multi-level user authentication (SUPER_ADMIN, ADMIN, SUPERVISOR, USER)
- JWT-based session management with secure tokens
- Password hashing with bcrypt (12 rounds)
- CORS protection and comprehensive security headers
- Role-based access control system

### User Management
- Hierarchical company structure
- Multi-step user registration with validation
- Document type support (CEDULA, PASSPORT, NIT, etc.)
- Advanced phone number handling with country codes
- Location-based user organization

### Enterprise Features
- Company → Headquarters → Users hierarchy
- Multi-location support and management
- Department and job title organization
- Process-based workflow tracking
- Complete audit logging system

### Modern UI/UX
- Responsive Material Design components
- Progressive multi-step forms
- Loading screens with success feedback
- Consistent pink/coral corporate theme (#FF69B4)
- Mobile-first responsive design

## Security Features

- JWT authentication with automatic token refresh
- Password hashing with bcrypt (12 rounds)
- Rate limiting and brute force protection
- Input validation and sanitization
- XSS and SQL injection prevention
- Security headers with Helmet middleware
- CORS protection with origin allowlist
- Account locking after failed attempts
- Complete audit logging system

## Database Modules

1. **User Management**: Complete user lifecycle with roles
2. **Company Management**: Multi-company support with NIT
3. **Headquarters Management**: Multiple locations per company
4. **Job Title Management**: Position definitions per location
5. **Process Management**: Business process tracking
6. **Audit System**: Complete activity tracking
7. **Authentication System**: Login/logout with security monitoring

## User Roles

- **SUPER_ADMIN**: System-wide administrative access
- **ADMIN**: Company-level administrative access
- **SUPERVISOR**: Department-level management access
- **USER**: Basic system access with restrictions

## Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- MySQL 8.0+
- Git

### Development Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/iltonys/itdimenzion.git
   cd itdimenzion
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Configure Database**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE itdimenzion_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   
   # Update backend/.env with your database credentials
   DATABASE_URL="mysql://username:password@localhost:3306/itdimenzion_db"
   ```

4. **Initialize Database**
   ```bash
   cd backend
   pnpm db:push
   pnpm init-super-admin
   pnpm create-test-users
   ```

5. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   pnpm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   pnpm start
   ```

6. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000/api
   - Health Check: http://localhost:4000/health

## Default Credentials

### Super Administrators
- iltonysverbel@gmail.com / H3lpD3sk.2025
- admin@itdimenzion.com / H3lpD3sk.2025

### Test Users
- ADMIN: admin.test@itdimenzion.com / H3lpD3sk.2025
- SUPERVISOR: supervisor.test@itdimenzion.com / H3lpD3sk.2025
- USER: user.test@itdimenzion.com / H3lpD3sk.2025

## API Documentation

### Authentication Endpoints
- POST `/api/auth/login` - User authentication
- POST `/api/auth/logout` - User logout
- POST `/api/auth/refresh-token` - Token refresh
- GET `/api/auth/profile` - Get user profile

### Security Testing
- GET `/api/auth/test` - Authentication test
- GET `/api/auth/admin-test` - Admin role test

## Environment Configuration

### Development
- Backend Port: 4000
- Frontend Port: 3000
- Database: MySQL localhost

### Production
- Configure production environment variables
- Update security secrets
- Enable HTTPS
- Configure proper CORS origins

## Security Considerations

1. Change all default passwords in production
2. Update JWT secrets with strong random values
3. Configure HTTPS for all communications
4. Implement proper firewall rules
5. Regular security audits and dependency updates
6. Monitor authentication logs for suspicious activity

## File Structure

```
itdimenzion/
├── backend/          # API server
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── config/
│   │   └── scripts/
│   └── prisma/       # Database schema
├── frontend/         # React application
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── config/
│       └── types/
├── tests/           # Testing framework
└── docs/           # Documentation
```

## Contributing

1. Follow security-first development practices
2. Maintain comprehensive test coverage
3. Document all API changes
4. Regular security audits
5. Code review for all changes

## License

Copyright (c) 2025 ILTONYS VERBEL RAMOS - VerbelTech Solutions
All rights reserved.

## Support

For technical support or questions:
- Developer: ILTONYS VERBEL RAMOS
- Email: iltonysverbel@gmail.com
- Company: VerbelTech Solutions

## Changelog

### Version 1.0.0 (2025-08-05)
- Initial release with complete security architecture
- Full authentication and authorization system
- Multi-module enterprise management
- Comprehensive audit logging
- Production-ready security implementation
