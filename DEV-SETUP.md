# 🚀 CONFIGURACIÓN DE DESARROLLO LOCAL - ITDimenzion

Este documento te guiará para configurar el proyecto ITDimenzion en tu entorno de desarrollo local **sin Docker**.

## 📋 Requisitos Previos

### Software Requerido:
- **Node.js** v18 o superior
- **MySQL** 8.0 o superior
- **Git**
- **VS Code** (recomendado)

### Herramientas de Desarrollo:
```bash
# Instalar pnpm (recomendado) o usar npm
npm install -g pnpm

# Verificar versiones
node --version    # >= v18.0.0
mysql --version   # >= 8.0.0
```

## 🗄️ Configuración de Base de Datos MySQL

### 1. Instalar MySQL
- **Windows**: Descargar desde [MySQL Official](https://dev.mysql.com/downloads/mysql/)
- **macOS**: `brew install mysql`
- **Linux**: `sudo apt install mysql-server`

### 2. Configurar Base de Datos
```sql
-- Conectar a MySQL como root
mysql -u root -p

-- Crear base de datos
CREATE DATABASE itdimenzion_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario dedicado (opcional pero recomendado)
CREATE USER 'itdimenzion_user'@'localhost' IDENTIFIED BY 'secure_password_2024';
GRANT ALL PRIVILEGES ON itdimenzion_db.* TO 'itdimenzion_user'@'localhost';
FLUSH PRIVILEGES;

-- Verificar
SHOW DATABASES;
exit;
```

### 3. Configurar Variables de Entorno
```bash
# En backend/.env
DATABASE_URL="mysql://root:password@localhost:3306/itdimenzion_db"
# o si creaste usuario dedicado:
# DATABASE_URL="mysql://itdimenzion_user:secure_password_2024@localhost:3306/itdimenzion_db"
```

## ⚙️ Instalación del Proyecto

### 1. Clonar y Configurar
```bash
# Navegar al directorio del proyecto
cd itdimenzion

# Instalar dependencias del backend
cd backend
pnpm install  # o npm install

# Instalar dependencias del frontend
cd ../frontend
pnpm install  # o npm install
```

### 2. Configurar Variables de Entorno
```bash
# Backend - copiar archivo de ejemplo
cd backend
cp .env.example .env
# Editar .env con tu configuración de MySQL

# Frontend - copiar archivo de ejemplo
cd ../frontend
cp .env.example .env
# Verificar que REACT_APP_API_URL=http://localhost:4000
```

### 3. Configurar Base de Datos con Prisma
```bash
cd backend

# Generar cliente de Prisma
pnpm db:generate

# Aplicar migraciones (crear tablas)
pnpm db:push

# Verificar en Prisma Studio (opcional)
pnpm db:studio
```

### 4. Inicializar Datos
```bash
# Crear usuarios administradores iniciales
cd backend
pnpm init-super-admin
```

## 🏃‍♂️ Ejecutar en Modo Desarrollo

### Terminal 1 - Backend:
```bash
cd backend
pnpm dev
# Servidor corriendo en http://localhost:4000
```

### Terminal 2 - Frontend:
```bash
cd frontend
pnpm start
# Aplicación corriendo en http://localhost:3000
```

## 🔐 Credenciales de Acceso

**Usuarios de prueba creados automáticamente:**
- **Email**: `iltonysverbel@gmail.com`
- **Email**: `admin@itdimenzion.com`
- **Contraseña**: `H3lpD3sk.2025`
- **Rol**: SUPER_ADMIN

## 🧪 Verificar Instalación

### 1. Probar Backend
```bash
# Health check
curl http://localhost:4000/api/health

# Info del sistema
curl http://localhost:4000/api/info
```

### 2. Probar Frontend
- Abrir http://localhost:3000
- Hacer login con las credenciales de prueba

### 3. Probar Login API
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@itdimenzion.com", "password": "H3lpD3sk.2025"}'
```

## 📚 Scripts Útiles

### Backend Scripts:
```bash
pnpm dev              # Modo desarrollo con nodemon
pnpm build            # Compilar TypeScript
pnpm start            # Ejecutar versión compilada
pnpm db:generate      # Generar cliente Prisma
pnpm db:push          # Aplicar cambios de schema
pnpm db:migrate       # Crear migraciones
pnpm db:studio        # Abrir Prisma Studio
pnpm init-super-admin # Crear usuarios admin
```

### Frontend Scripts:
```bash
pnpm start            # Servidor de desarrollo
pnpm build            # Build para producción
pnpm test             # Ejecutar tests
```

## 🔧 Solución de Problemas

### Error de Conexión MySQL:
```bash
# Verificar que MySQL esté corriendo
sudo service mysql status  # Linux
brew services list | grep mysql  # macOS

# Reiniciar MySQL si es necesario
sudo service mysql restart  # Linux
brew services restart mysql  # macOS

# Verificar puerto MySQL
netstat -tlnp | grep :3306
```

### Error de Prisma:
```bash
# Regenerar cliente
pnpm db:generate

# Reset completo de base de datos (¡CUIDADO!)
pnpm prisma db push --force-reset
pnpm init-super-admin
```

### Error de CORS en Frontend:
- Verificar que `REACT_APP_API_URL=http://localhost:4000` en frontend/.env
- Verificar que el backend esté corriendo en puerto 4000

## 🚀 Próximos Pasos

Una vez que tengas el entorno funcionando:

1. **Explorar la aplicación**: Login, crear usuarios, explorar roles
2. **Revisar el código**: Familiarizarte con la arquitectura
3. **Desarrollar nuevas features**: Sistema modular de inventarios
4. **Testing**: Implementar tests unitarios e integración

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs del backend y frontend
2. Verifica la configuración de base de datos
3. Asegúrate de que todos los servicios estén corriendo
4. Consulta los archivos de log en las consolas de desarrollo

---

**¡Listo para desarrollar! 🎉**