# ITDimenzion Backup System Guide

## Overview

The ITDimenzion project includes a comprehensive backup system that creates complete snapshots of your project and database with timestamp-based naming for easy management.

## Quick Start

### For Complete Project Backup
```bash
# Navigate to scripts directory
cd scripts

# Run project backup
backup-project.bat
```

### For Database Backup Only
```bash
# Navigate to scripts directory  
cd scripts

# Run database backup
backup-database.bat
```

### For Complete System Backup (Recommended)
```bash
# Run both scripts for complete backup
cd scripts
backup-project.bat
backup-database.bat
```

## Backup Scripts

### 1. Project Backup (`backup-project.bat`)

**What it does:**
- Creates timestamped backup of entire project
- Excludes unnecessary files (node_modules, .git, build artifacts)
- Includes source code, configuration files, documentation
- Creates restore script for easy recovery
- Generates detailed backup information file

**Files included:**
- ✅ Frontend React application
- ✅ Backend Node.js application  
- ✅ Configuration files (package.json, .gitignore, etc.)
- ✅ Documentation (README.md, CLAUDE.md)
- ✅ Database schema files (Prisma)
- ✅ Scripts and utilities

**Files excluded:**
- ❌ node_modules directories
- ❌ .git repository data
- ❌ Build artifacts (dist, build)
- ❌ Environment files (.env)
- ❌ Log files and temporary files
- ❌ Previous backups

### 2. Database Backup (`backup-database.bat`)

**What it does:**
- Creates complete MySQL database dump
- Includes schema, data, procedures, triggers
- Creates schema-only backup for development setup
- Generates restore script with connection details
- Tests database connection before backup

**Backup contents:**
- ✅ All tables with complete data
- ✅ Stored procedures and functions
- ✅ Triggers and constraints
- ✅ Indexes and foreign keys
- ✅ User permissions and grants

## Backup File Structure

```
Backups/
├── ITDimenzion_Backup_YYYY-MM-DD_HH-MM/
│   ├── project/                    # Complete project files
│   ├── BACKUP_INFO.txt             # Backup details and restore instructions
│   └── RESTORE.bat                 # Automated restore script
├── ITDimenzion_Database_YYYY-MM-DD_HH-MM.sql    # Full database backup
├── ITDimenzion_Schema_YYYY-MM-DD_HH-MM.sql      # Schema-only backup
├── Database_Backup_Info_YYYY-MM-DD_HH-MM.txt    # Database backup info
└── restore-database_YYYY-MM-DD_HH-MM.bat        # Database restore script
```

## Prerequisites

### For Project Backup
- Windows operating system
- No additional requirements

### For Database Backup
- MySQL client installed and accessible from command line
- Database connection credentials
- MySQL server running and accessible

#### Installing MySQL Client (if needed):
```bash
# Option 1: Download from official site
# https://dev.mysql.com/downloads/mysql/

# Option 2: Using Chocolatey
choco install mysql

# Option 3: Using Winget
winget install Oracle.MySQL
```

## Configuration

### Database Configuration
The database backup script will:
1. First check for environment variables in `backend/.env`
2. Use default values if not found:
   - Host: localhost
   - Port: 3306
   - Database: itdimenzion_db
   - User: root

### Environment Variables (Optional)
Create or update `backend/.env` with your database configuration:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=itdimenzion_db
DB_USER=root
DB_PASSWORD=your_password

# Or use connection string format:
DATABASE_URL="mysql://username:password@localhost:3306/itdimenzion_db"
```

## Usage Examples

### Daily Development Backup
```bash
# Quick project backup before major changes
cd scripts
backup-project.bat
```

### Before Database Migrations
```bash
# Backup database before schema changes
cd scripts  
backup-database.bat
```

### Complete System Backup
```bash
# Full backup before deployment or major updates
cd scripts
backup-project.bat
backup-database.bat
```

## Restoration Procedures

### Project Restoration

#### Method 1: Using Restore Script (Recommended)
1. Navigate to backup folder: `Backups/ITDimenzion_Backup_YYYY-MM-DD_HH-MM/`
2. Run: `RESTORE.bat`
3. Follow the on-screen instructions

#### Method 2: Manual Restoration
1. Copy project folder to desired location
2. Navigate to project directory
3. Run: `pnpm install`
4. Configure environment variables
5. Restore database separately
6. Run: `pnpm start`

### Database Restoration

#### Method 1: Using Restore Script (Recommended)
1. Navigate to `Backups/` directory
2. Run: `restore-database_YYYY-MM-DD_HH-MM.bat`
3. Enter MySQL credentials when prompted

#### Method 2: Manual Command Line
```bash
# Full database restore
mysql -u[username] -p[password] < ITDimenzion_Database_YYYY-MM-DD_HH-MM.sql

# Restore to specific database
mysql -u[username] -p[password] [database_name] < ITDimenzion_Database_YYYY-MM-DD_HH-MM.sql
```

#### Method 3: MySQL Workbench
1. Open MySQL Workbench
2. Connect to your MySQL server
3. Go to Server > Data Import
4. Select "Import from Self-Contained File"
5. Browse and select the backup SQL file
6. Click "Start Import"

### Schema-Only Restoration (Development Setup)
```bash
# Create new database with schema only
mysql -u[username] -p[password] [new_database] < ITDimenzion_Schema_YYYY-MM-DD_HH-MM.sql
```

## Best Practices

### Backup Frequency
- **Development**: Daily or before major changes
- **Staging**: Before each deployment
- **Production**: Multiple times daily, before any updates

### Backup Storage
- Keep at least 7 days of backups
- Store critical backups on separate drives/cloud storage
- Verify backup integrity periodically

### Security Considerations
- Backup files contain sensitive data
- Store backups in secure locations
- Use encryption for backups containing production data
- Never commit backup files to git repository

### Backup Verification
- Periodically test restore procedures
- Verify backup file integrity
- Ensure restore scripts work correctly
- Test database connectivity before backups

## Troubleshooting

### Common Issues

#### "MySQL client not found"
**Solution**: Install MySQL client and add to PATH

#### "Cannot connect to database"
**Solutions**:
- Ensure MySQL server is running
- Verify database credentials
- Check database exists and user has permissions
- Test connection manually: `mysql -u[user] -p[password] [database]`

#### "Permission denied" errors
**Solutions**:
- Run command prompt as administrator
- Check file/directory permissions
- Ensure backup directory is writable

#### Large database backup takes too long
**Solutions**:
- Use `--single-transaction` option (already included)
- Consider schema-only backup for development
- Run backups during low-usage periods

### Getting Help

If you encounter issues:
1. Check the backup information files for details
2. Verify all prerequisites are met
3. Test database connectivity manually
4. Check Windows Event Viewer for system errors
5. Consult MySQL error logs for database issues

## Advanced Usage

### Custom Backup Locations
Edit the backup scripts to change the backup directory:
```batch
:: In backup-project.bat or backup-database.bat
set "BACKUP_DIR=D:\MyCustomBackups"
```

### Automated Backups
Create scheduled tasks using Windows Task Scheduler:
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (daily, weekly, etc.)
4. Set action to run backup scripts
5. Configure appropriate user permissions

### Network Database Backups
For remote databases, update connection parameters:
```batch
set "DB_HOST=your-remote-host.com"
set "DB_PORT=3306"
set "DB_USER=your_remote_user"
```

## Maintenance

### Cleanup Old Backups
Create a cleanup script to remove backups older than specified days:
```batch
:: Remove backups older than 30 days
forfiles /p "Backups" /m "*.*" /d -30 /c "cmd /c del @path"
```

### Monitor Backup Success
- Check backup completion messages
- Verify backup file sizes are reasonable
- Test restore procedures periodically
- Monitor available disk space

---

**Last Updated**: Generated automatically by backup scripts  
**Version**: 1.0  
**Compatible with**: ITDimenzion V3, MySQL 5.7+, Windows 10+