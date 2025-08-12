# ITDimenzion Backup System Guide

## Overview

The ITDimenzion project includes a comprehensive backup system that creates complete ZIP archives of your project and database with standardized timestamp naming (YYYY-MM-DD-hh-mm-ss format) and organized directory structure.

## Quick Start

### For Complete System Backup (Recommended)
```bash
# Navigate to scripts directory
cd scripts

# Run full backup (includes both project and database)
backup-full.bat
```

### For Project Backup Only
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

## Backup Scripts

### 1. Full System Backup (`backup-full.bat`) - **NEW**

**What it does:**
- Executes both project and database backups sequentially
- Creates comprehensive log file with detailed progress
- Provides unified interface for complete system backup
- Validates successful completion of both operations
- Displays summary of created files with sizes

### 2. Project Backup (`backup-project.bat`)

**What it does:**
- Creates timestamped ZIP archive of entire project
- Uses fixed directory structure: `D:\DEV\ITDIMENZION\Backups\Project\`
- Filename format: `ITDimenzion_Project_YYYY-MM-DD-hh-mm-ss.zip`
- Uses PowerShell native compression (no external dependencies)
- Excludes unnecessary files (node_modules, .git, build artifacts)
- Includes source code, configuration files, documentation
- Generates detailed backup information file inside ZIP

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

### 3. Database Backup (`backup-database.bat`)

**What it does:**
- Creates complete MySQL database dump in ZIP format
- Uses fixed directory structure: `D:\DEV\ITDIMENZION\Backups\DB\`
- Filename format: `ITDimenzion_DB_YYYY-MM-DD-hh-mm-ss.zip`
- Uses PowerShell native compression (no external dependencies)
- Creates both full backup and schema-only backup
- Includes comprehensive backup information file
- Tests database connection before backup

**Backup contents (all in ZIP archive):**
- ✅ Complete database dump (`.sql` file)
- ✅ Schema-only backup for development setup
- ✅ Detailed backup information file
- ✅ All tables with complete data
- ✅ Stored procedures and functions
- ✅ Triggers and constraints
- ✅ Indexes and foreign keys
- ✅ User permissions and grants

## Backup File Structure

**NEW ORGANIZED STRUCTURE:**
```
D:\DEV\ITDIMENZION\Backups\
├── Project\
│   ├── ITDimenzion_Project_YYYY-MM-DD-hh-mm-ss.zip
│   │   ├── project/                          # Complete project files
│   │   └── BACKUP_INFO.txt                   # Backup details and restore instructions
│   └── ITDimenzion_Project_YYYY-MM-DD-hh-mm-ss.zip (other dates)
├── DB\
│   ├── ITDimenzion_DB_YYYY-MM-DD-hh-mm-ss.zip
│   │   ├── ITDimenzion_DB_YYYY-MM-DD-hh-mm-ss.sql      # Full database backup
│   │   ├── ITDimenzion_Schema_YYYY-MM-DD-hh-mm-ss.sql  # Schema-only backup
│   │   └── Database_Backup_Info_YYYY-MM-DD-hh-mm-ss.txt # Database backup info
│   └── ITDimenzion_DB_YYYY-MM-DD-hh-mm-ss.zip (other dates)
└── backup-full-YYYY-MM-DD-hh-mm-ss.log              # Full backup logs
```

**Key Improvements:**
- ✅ **Fixed directory structure** - Always saves to `D:\DEV\ITDIMENZION\Backups\`
- ✅ **Organized by type** - Separate `Project\` and `DB\` directories
- ✅ **Standardized naming** - All files use `YYYY-MM-DD-hh-mm-ss` format
- ✅ **ZIP compression** - All backups are compressed for space efficiency
- ✅ **No external dependencies** - Uses Windows PowerShell native compression

## Prerequisites

### For Project Backup
- Windows operating system with PowerShell (included in Windows 10+)
- No additional external tools required

### For Database Backup
- Windows operating system with PowerShell (included in Windows 10+)
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
# Full backup before deployment or major updates (RECOMMENDED)
cd scripts
backup-full.bat

# OR run individual scripts
backup-project.bat
backup-database.bat
```

## Restoration Procedures

### Project Restoration

#### Method 1: Extract and Setup (Recommended)
1. Navigate to: `D:\DEV\ITDIMENZION\Backups\Project\`
2. Extract: `ITDimenzion_Project_YYYY-MM-DD-hh-mm-ss.zip`
3. Copy extracted `project` folder to desired location
4. Open `BACKUP_INFO.txt` for detailed restoration instructions
5. Navigate to project directory
6. Run: `pnpm install`
7. Configure environment variables (.env files)
8. Restore database separately (see Database Restoration)
9. Run: `pnpm start`

#### Method 2: Quick Development Setup
1. Extract project ZIP to temporary location
2. Copy only necessary files (src/, package.json, etc.)
3. Run `pnpm install` in target directory
4. Configure for development environment

### Database Restoration

#### Method 1: Extract and Restore (Recommended)
1. Navigate to: `D:\DEV\ITDIMENZION\Backups\DB\`
2. Extract: `ITDimenzion_DB_YYYY-MM-DD-hh-mm-ss.zip`
3. Open `Database_Backup_Info_YYYY-MM-DD-hh-mm-ss.txt` for connection details
4. Use MySQL command line:
```bash
# Full database restore
mysql -u[username] -p[password] < ITDimenzion_DB_YYYY-MM-DD-hh-mm-ss.sql

# Restore to specific database
mysql -u[username] -p[password] [database_name] < ITDimenzion_DB_YYYY-MM-DD-hh-mm-ss.sql
```

#### Method 2: Schema Only (Development)
```bash
# Create new database with schema only
mysql -u[username] -p[password] [new_database] < ITDimenzion_Schema_YYYY-MM-DD-hh-mm-ss.sql
```

#### Method 3: MySQL Workbench
1. Extract the database ZIP file first
2. Open MySQL Workbench
3. Connect to your MySQL server
4. Go to Server > Data Import
5. Select "Import from Self-Contained File"
6. Browse and select: `ITDimenzion_DB_YYYY-MM-DD-hh-mm-ss.sql`
7. Click "Start Import"

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
:: Remove project backups older than 30 days
forfiles /p "D:\DEV\ITDIMENZION\Backups\Project" /m "*.zip" /d -30 /c "cmd /c del @path"

:: Remove database backups older than 30 days
forfiles /p "D:\DEV\ITDIMENZION\Backups\DB" /m "*.zip" /d -30 /c "cmd /c del @path"

:: Remove old logs older than 30 days
forfiles /p "D:\DEV\ITDIMENZION\Backups" /m "backup-full-*.log" /d -30 /c "cmd /c del @path"
```

### Monitor Backup Success
- Check backup completion messages
- Verify backup file sizes are reasonable
- Test restore procedures periodically
- Monitor available disk space

---

**Last Updated**: 2025-08-08 (Scripts v2.0 - ZIP format with organized structure)  
**Version**: 2.0  
**Compatible with**: ITDimenzion V3+, MySQL 5.7+, Windows 10+ with PowerShell

## Summary of Changes in v2.0

### ✅ **Fixed Issues**
- **Corrected backup location**: Now saves to `D:\DEV\ITDIMENZION\Backups\` (fixed path)
- **Standardized date format**: All files use `YYYY-MM-DD-hh-mm-ss` format
- **Organized structure**: Separate `Project\` and `DB\` directories
- **ZIP compression**: All backups are now compressed for space efficiency
- **No external dependencies**: Uses Windows PowerShell native compression
- **Added full backup script**: New `backup-full.bat` for complete system backup

### 🔧 **Technical Improvements**
- PowerShell `Compress-Archive` replaces external 7-Zip dependency
- Unified timestamp function across all scripts
- Better error handling and cleanup procedures
- Comprehensive logging for full system backups
- Improved file organization and naming consistency