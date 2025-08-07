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

## Backup and Recovery

### Quick Backup Commands
```bash
# Complete project backup
cd scripts
backup-project.bat

# Database backup only
cd scripts
backup-database.bat

# Full system backup (recommended)
cd scripts
backup-project.bat && backup-database.bat
```

### Backup System Features
- ✅ **Automated timestamping**: Backups named with date/time
- ✅ **Complete project backup**: Source code, configs, documentation
- ✅ **MySQL database backup**: Schema, data, procedures, triggers
- ✅ **Selective exclusion**: Skips node_modules, .git, build artifacts
- ✅ **Restore scripts**: Automated restoration with guided setup
- ✅ **Backup verification**: Connection tests and file integrity checks
- ✅ **Gitignore integration**: Backups folder automatically ignored

### Backup File Structure
```
Backups/
├── ITDimenzion_Backup_YYYY-MM-DD_HH-MM/     # Project backup
│   ├── project/                              # Complete project files
│   ├── BACKUP_INFO.txt                       # Backup information
│   └── RESTORE.bat                           # Restore script
├── ITDimenzion_Database_YYYY-MM-DD_HH-MM.sql  # Database backup
└── restore-database_YYYY-MM-DD_HH-MM.bat      # DB restore script
```

### Prerequisites for Database Backup
- MySQL client installed and accessible from command line
- Database connection credentials configured

**Install MySQL Client:**
```bash
# Option 1: Download from https://dev.mysql.com/downloads/mysql/
# Option 2: Using Chocolatey
choco install mysql
# Option 3: Using Winget  
winget install Oracle.MySQL
```

### Restoration Procedures
**Project Restore:**
1. Navigate to backup folder: `Backups/ITDimenzion_Backup_YYYY-MM-DD_HH-MM/`
2. Run: `RESTORE.bat`
3. Follow on-screen instructions

**Database Restore:**
1. Navigate to `Backups/` directory
2. Run: `restore-database_YYYY-MM-DD_HH-MM.bat`
3. Enter MySQL credentials when prompted

**See `scripts/BACKUP_GUIDE.md` for complete documentation.**

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

### Implementación Multi-Step Form - 2025-08-07T15:45:00Z

**COMPLETADO**: Sistema completo de formulario multi-paso con tema rosa

#### Funcionalidades Implementadas:

**1. Sistema Multi-Step:**
- ✅ **useMultiStep Hook**: Hook personalizado para navegación entre pasos
- ✅ **MultiStepForm Component**: Componente con navegador y barra de progreso
- ✅ **Validación por pasos**: Validación progresiva con bloqueo de navegación
- ✅ **Indicadores visuales**: Dots clickeables y barra de progreso animada

**2. RegisterForm Rediseñado:**
- ✅ **Paso 1 - Datos Personales**: Nombre, apellido, documento, email, teléfono (campos completos)
- ✅ **Paso 2 - Ubicación**: País, departamento, ciudad (layout vertical completo)
- ✅ **Paso 3 - Contraseñas**: Contraseña y confirmación con validación robusta
- ✅ **Navegación intuitiva**: Botones Atrás/Siguiente con estado inteligente

**3. Tema Rosa Unificado (#FF69B4):**
- ✅ **Focus styling**: Todos los campos con iluminación rosa al hacer foco
- ✅ **Labels internos**: Etiquetas dentro de los campos como estándar del proyecto
- ✅ **Consistencia visual**: Tema aplicado en todos los formularios del sistema
- ✅ **Botones temáticos**: Navegación y acciones con colores corporativos

**4. Layout Mejorado:**
- ✅ **Campos verticales**: Todo el layout en formato vertical (sin side-by-side)
- ✅ **SecureLocationSelectors**: País, departamento y ciudad en columna completa
- ✅ **Responsive design**: Adaptación perfecta para móviles y desktop
- ✅ **Separación visual**: Secciones bien definidas con iconos temáticos

#### Archivos Modificados:
- `frontend/src/hooks/useMultiStep.tsx` - Hook de navegación
- `frontend/src/components/common/MultiStepForm.tsx` - Componentes de navegación
- `frontend/src/components/auth/RegisterForm.tsx` - Formulario rediseñado
- `frontend/src/components/common/SecureLocationSelectors.tsx` - Layout vertical
- `frontend/src/components/users/UserForm.tsx` - Importaciones actualizadas
- `frontend/src/components/companies/CompanyForm.tsx` - Importaciones actualizadas  
- `frontend/src/components/headquarters/HeadquartersForm.tsx` - Importaciones actualizadas

#### Estado Técnico:
- **TypeScript**: Sin errores de compilación
- **Frontend**: Servidor corriendo en puerto 3007
- **Tema consistente**: Rosa (#FF69B4) aplicado en toda la aplicación
- **Validación**: Sistema robusto de validación por pasos implementado

### Corrección LocationSelectors Layout - 2025-08-07T16:15:00Z

**SOLUCIONADO**: Layout horizontal persistente en LocationSelectors.tsx

#### Problema Identificado:
- **Issue**: LocationSelectors seguía mostrando campos lado a lado en pantallas medianas/grandes
- **Causa**: `md={4}` en Grid items mantenía layout horizontal
- **Síntoma**: Usuario intentó usar `position: 'absolute'` pero rompía el flujo del layout

#### Solución Implementada:
- ✅ **Grid Layout Fixed**: Cambiado `xs={12} md={4}` a solo `xs={12}` en los 3 selectores
- ✅ **Position Absolute Removed**: Eliminado position problemático que sacaba elementos del flujo
- ✅ **Pink Theme Applied**: Tema rosa (#FF69B4) aplicado consistentemente
- ✅ **CSS Global Styling**: Agregados estilos globales para react-country-state-city
- ✅ **Layout Vertical Garantizado**: Ahora siempre apilado verticalmente desde el inicio

#### Cambios Técnicos:
```typescript
// ANTES:
<Grid item xs={12} md={4}> // Horizontal en pantallas medianas
  <Box sx={{ position: 'absolute' }}> // Rompía el flujo

// DESPUÉS:  
<Grid item xs={12}> // Siempre vertical
  <Box sx={{ position: 'relative' }}> // Flujo natural
```

#### Archivos Modificados:
- `frontend/src/components/common/LocationSelectors.tsx` - Layout vertical + tema rosa
- CSS global agregado para componentes de react-country-state-city
- Estilos hover/focus con tema rosa unificado

#### Resultado Final:
- **Layout**: País → Departamento → Ciudad (siempre vertical)
- **Tema**: Rosa consistente (#FF69B4) en todos los selectores  
- **UX**: Transiciones suaves y estados visuales mejorados
- **Responsive**: Funciona correctamente en todas las resoluciones
