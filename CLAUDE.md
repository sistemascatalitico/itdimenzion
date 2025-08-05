# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ITDimenzion is a modern enterprise management system with a full-stack architecture consisting of:
- **Frontend**: React + TypeScript with Material-UI
- **Backend**: Node.js + Express + TypeScript
- **Database**: MySQL with Prisma ORM (configured for Docker deployment)
- **Containerization**: Docker with docker-compose setup

## Development Commands

### Local Development (Without Docker) - RECOMMENDED
```bash
# Backend development
cd backend
npm run dev

# Frontend development (separate terminal)
cd frontend
npm start

# Database operations
cd backend
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio
npm run init-super-admin  # Initialize super admin users
```

### Docker Commands (Future Implementation)
```bash
# Start all services with Docker
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]
```

### Backend Commands (from /backend directory)
```bash
# Development mode
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio

# Initialize super admin user
npm run init-super-admin

# Run tests
npm test
```

### Frontend Commands (from /frontend directory)
```bash
# Development mode
npm start

# Build for production
npm run build

# Run tests
npm test

# Type checking
npx tsc --noEmit
```

## Project Architecture

### Backend Architecture
- **Entry Point**: `backend/src/index.ts` - Express server with security middleware
- **Routes**: `backend/src/routes/` - API route handlers
- **Controllers**: `backend/src/controllers/` - Business logic
- **Models**: Defined in `backend/prisma/schema.prisma` using Prisma ORM
- **Middleware**: `backend/src/middleware/` - Authentication and validation
- **Scripts**: `backend/src/scripts/` - Utility scripts (user initialization, etc.)

### Frontend Architecture
- **Entry Point**: `frontend/src/index.tsx`
- **Main App**: `frontend/src/App.tsx` - React Router configuration
- **Components**: `frontend/src/components/` - React components
- **Theme**: `frontend/src/theme.ts` - Material-UI theme configuration
- **Types**: `frontend/src/types/` - TypeScript type definitions

### Database Schema
The system uses a hierarchical company structure:
- **Company** → **Headquarters** → **Users** with **Processes** and **JobTitles**
- **User Roles**: SUPER_ADMIN, ADMIN, SUPERVISOR, USER
- **Status Types**: ACTIVE, INACTIVE
- **Document Types**: CEDULA, TARJETA_IDENTIDAD, CEDULA_EXTRANJERIA, NIT, RUT

## Development Environment

### Docker Configuration
- **Frontend**: Runs on port 3000, connects to backend at port 4000
- **Backend**: Runs on port 4000, connects to MySQL on port 3306
- **MySQL**: Runs on port 3306 (mapped to 27017 for MongoDB compatibility in current config)

### Environment Variables
Backend requires:
- `DATABASE_URL`: MySQL connection string
- `JWT_SECRET`: JWT signing secret
- `NODE_ENV`: development/production
- `PORT`: Server port (default 4000)

Frontend requires:
- `REACT_APP_API_URL`: Backend API URL

### Default Test Users (Created via init-super-admin script)
- **Email**: iltonysverbel@gmail.com (SUPER_ADMIN)
- **Email**: admin@itdimenzion.com (SUPER_ADMIN)
- **Password**: H3lpD3sk.2025

**Note**: Users are now stored in MySQL database using Prisma ORM, not hardcoded in memory.

## Key Features

### Authentication & Authorization
- JWT-based authentication with role-based access control
- Password hashing with bcrypt
- Login attempt tracking and account locking
- Secure CORS configuration

### User Management
- Hierarchical user structure with companies and headquarters
- Role-based permissions system
- User creation restricted by role level
- Document type validation for different ID types

### Security Features
- Helmet middleware for security headers
- CORS protection with specific origin allowlist
- Input validation using express-validator
- Request logging with Morgan
- Graceful shutdown handling

## Testing Strategy

The project uses Jest for testing:
- Backend: Unit tests for controllers and middleware
- Frontend: React Testing Library for component tests
- Integration tests for API endpoints

## Important Notes

- **✅ MIGRATION COMPLETED**: System fully migrated from MongoDB to MySQL + Prisma
- **🚀 LOCAL DEVELOPMENT**: Configured for development without Docker (see DEV-SETUP.md)
- **🔐 DATABASE USERS**: Authentication now uses MySQL database, no more hardcoded users
- **⚙️ PRISMA ORM**: All database operations use Prisma Client
- Frontend uses Material-UI v5 with custom theming
- All timestamps use UTC
- API endpoints are prefixed with `/api/`
- File uploads are supported via `/uploads` static route

## Quick Start

1. **Setup Database**: Install MySQL and create `itdimenzion_db` database
2. **Configure Environment**: Copy `.env.example` files and configure database connection
3. **Install Dependencies**: Run `npm install` in both backend and frontend directories
4. **Initialize Database**: Run `npm run db:push` and `npm run init-super-admin` in backend
5. **Start Development**: Run `npm run dev` (backend) and `npm start` (frontend)

See `DEV-SETUP.md` for detailed setup instructions.

## Claude Activity Summary

Este archivo no contiene el log completo. Las acciones se registran en `CLAUDE.log` con timestamp UTC.
Últimos cambios clave:
- 2025-08-05T12:13:43.574Z | Archivo modificado: CLAUDE.md
- 2025-08-05T12:13:44.202Z | Archivo modificado: CLAUDE.md
- 2025-08-05T12:13:45.204Z | Archivo modificado: CLAUDE.md
