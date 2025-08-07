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

**IMPORTANT**: This project uses **pnpm** as the package manager. Do NOT use npm directly for dependency installation.

```bash
# Backend development
cd backend
pnpm run dev

# Frontend development (separate terminal)
cd frontend
pnpm start

# Database operations
cd backend
pnpm run db:generate    # Generate Prisma client
pnpm run db:push        # Push schema to database
pnpm run db:migrate     # Run migrations
pnpm run db:studio      # Open Prisma Studio
pnpm run init-super-admin  # Initialize super admin users
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
pnpm run dev

# Build TypeScript
pnpm run build

# Start production server
pnpm start

# Database operations
pnpm run db:generate    # Generate Prisma client
pnpm run db:push        # Push schema to database
pnpm run db:migrate     # Run migrations
pnpm run db:studio      # Open Prisma Studio

# Initialize super admin user
pnpm run init-super-admin

# Run tests
pnpm test
```

### Frontend Commands (from /frontend directory)
```bash
# Development mode
pnpm start

# Build for production
pnpm run build

# Run tests
pnpm test

# Type checking
pnpm exec tsc --noEmit
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

**Prerequisites**: Install [pnpm](https://pnpm.io/installation) globally: `npm install -g pnpm`

1. **Setup Database**: Install MySQL and create `itdimenzion_db` database
2. **Configure Environment**: Copy `.env.example` files and configure database connection
3. **Install Dependencies**: Run `pnpm install` from the root directory (installs all workspaces)
4. **Initialize Database**: Run `pnpm run db:push` and `pnpm run init-super-admin` in backend
5. **Start Development**: Run `pnpm run dev` (backend) and `pnpm start` (frontend)

See `DEV-SETUP.md` for detailed setup instructions.

## Claude Activity Summary

Este archivo no contiene el log completo. Las acciones se registran en `CLAUDE.log` con timestamp UTC.

### Últimos Cambios Críticos - 2025-08-06T20:30:00Z

**COMPLETADO**: Layout sin separaciones + sombra coral + autenticación funcional

#### Cambios Implementados:

**1. Layout Perfecto Sin Separaciones:**
- ✅ **AppBar fijo**: `position="fixed"` cubriendo toda la pantalla (`width: '100vw'`)
- ✅ **Sin separación lateral**: AppBar desde extremo izquierdo a derecho
- ✅ **Sidebar superpuesto**: Z-index alto para estar sobre AppBar
- ✅ **Sombra coral**: `boxShadow: '0 14px 12px rgba(255, 107, 107, 0.3)'`
- ✅ **Fondo unificado**: Gradiente coral/blanco tanto en sidebar como AppBar

**2. Sistema de Autenticación Completo:**
- ✅ **Login funcional** con validación robusta y UI refinada
- ✅ **Registro funcional** con todos los campos requeridos
- ✅ **Validación completa**: Contraseñas seguras, emails, teléfonos, documentos
- ✅ **Base de datos MySQL**: Usuarios se crean y autentican correctamente
- ✅ **Navegación fluida**: Router funcionando sin errores

**3. UI/UX Final Implementado:**
- ✅ **Layout responsivo**: Sidebar colapsible con animaciones
- ✅ **Colores consistentes**: Coral (#FF6B6B) para elementos principales
- ✅ **Fondos optimizados**: Blanco para contenido, coral para navegación
- ✅ **Tipografía**: "IT" blanco + "DIMENZION" naranja en headers
- ✅ **Debug logs**: Limpiados para producción

**4. Diseño Minimalista (Anterior):**
- ✅ Formularios con campos rectangulares (borderRadius: 1)
- ✅ Campos obligatorios marcados con asterisco (*)
- ✅ Teléfono con bandera y código de país inteligente
- ✅ Responsive design completo
- ✅ Color scheme: IT (#FF69B4), DIMENZION (#FFA726)

3. **Scripts Duplicados Corregidos**:
   - `package.json` (root): Consolidado scripts duplicados
   - `backend/package.json`: Eliminado script "start" duplicado

4. **AuthContext Mejorado**: 
   - Funciones login/register ahora retornan `{success: boolean, error?: string}`
   - Compatible con implementación de LoginForm existente
   - Validaciones mejoradas con sanitización

5. **MainLayout Actualizado**: 
   - Soporte para children props además de Outlet
   - Compatible con routing directo y rutas anidadas
   - Mantiene sidebar coral/rojo según referencias visuales

#### Estado UI/UX vs Referencias:
- ✅ **LoginForm**: Coincide con imagen referencia (fondo degradado coral)
- ✅ **RegisterForm**: Implementado con todos los campos requeridos  
- ✅ **MainLayout**: Sidebar rojo + contenido central correctamente implementado
- ✅ **Theme**: Colores coral/naranja (#FF6B6B, #FF8E6B) según referencias

#### Configuración Verificada:
- React Router DOM configurado correctamente
- Autenticación funcional end-to-end
- Responsive design implementado
- Gradiente de fondo coincide con referencias visuales

Últimos cambios técnicos:
- 2025-08-05T23:30:00.000Z | React Router configurado en App.tsx
- 2025-08-05T23:30:15.000Z | ProtectedRoute component creado
- 2025-08-05T23:30:30.000Z | Scripts duplicados eliminados
- 2025-08-05T23:30:45.000Z | AuthContext actualizado para compatibilidad
- 2025-08-05T23:31:00.000Z | MainLayout modificado para soporte children

### Últimas Correcciones - 2025-08-07T03:00:00Z

**SOLUCIONADO**: Error de importación formik/yup + gestión de dependencias

#### Problema Resuelto:
- ❌ **Error**: "Failed to resolve import 'formik'" en JobTitleForm.tsx
- ❌ **Causa**: Conflicto entre npm workspace y gestión de dependencias
- ❌ **Síntoma**: Pantalla en blanco tras error de importación

#### Solución Implementada:
- ✅ **Migración a pnpm**: Proyecto ahora usa pnpm como gestor principal
- ✅ **Dependencias instaladas**: formik 2.4.6 + yup 1.7.0 correctamente
- ✅ **Workspace limpio**: Eliminado package-lock.json, usa pnpm-lock.yaml
- ✅ **Servidor funcional**: Frontend en http://localhost:3001 
- ✅ **Componentes listos**: JobTitle, Company, Headquarters, Process forms

#### Configuración de Desarrollo:
- **Gestor de paquetes**: pnpm (OBLIGATORIO)
- **Instalación**: `pnpm install` desde root
- **Frontend**: `pnpm start` (puerto 3001)
- **Backend**: `pnpm run dev` (puerto 4000)
