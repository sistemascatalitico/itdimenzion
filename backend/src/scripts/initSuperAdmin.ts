import dotenv from 'dotenv';
import { prisma } from '../config/database';
import { hashPassword } from '../utils/encryption';

// Cargar variables de entorno
dotenv.config();

const initSuperAdmin = async () => {
  try {
    console.log('🚀 Iniciando creación de usuarios super administradores...');

    // Crear empresa por defecto
    const defaultCompany = await prisma.company.upsert({
      where: { nit: '900000000-1' },
      update: {},
      create: {
        name: 'ITDimenzion',
        code: 'ITD001',
        nit: '900000000-1',
        address: 'Calle Principal #123',
        phone: '+57 300 123 4567',
        email: 'admin@itdimenzion.com',
        website: 'https://itdimenzion.com',
        status: 'ACTIVE',
      },
    });

    console.log('✅ Empresa por defecto creada/actualizada:', defaultCompany.name);

    // Crear sede principal
    const headquarters = await prisma.headquarters.upsert({
      where: { id: defaultCompany.id },
      update: {},
      create: {
        name: 'Sede Principal',
        code: 'ITD001-HQ',
        address: 'Calle Principal #123',
        phone: '+57 300 123 4567',
        email: 'principal@itdimenzion.com',
        companyId: defaultCompany.id,
        status: 'ACTIVE',
      },
    });

    console.log('✅ Sede principal creada/actualizada:', headquarters.name);

    // Crear proceso por defecto
    const defaultProcess = await prisma.process.upsert({
      where: { 
        code: 'ADMIN-PROC' 
      },
      update: {},
      create: {
        name: 'Administración General',
        code: 'ADMIN-PROC',
        description: 'Proceso de administración general del sistema',
        status: 'ACTIVE',
      },
    });

    console.log('✅ Proceso por defecto creado/actualizado');

    // Crear cargo de Administrador
    const adminJobTitle = await prisma.jobTitle.upsert({
      where: { 
        code: 'ADMIN-SYS' 
      },
      update: {},
      create: {
        name: 'Administrador del Sistema',
        code: 'ADMIN-SYS',
        description: 'Administrador con acceso completo al sistema',
        processId: defaultProcess.id,
        status: 'ACTIVE',
      },
    });

    console.log('✅ Cargo de administrador creado/actualizado');

    // Contraseña por defecto
    const defaultPassword = 'H3lpD3sk.2025';
    const hashedPassword = await hashPassword(defaultPassword);

    // Lista de usuarios super administradores
    const superAdmins = [
      {
        email: 'iltonysverbel@gmail.com',
        username: 'iltony.admin',
        firstName: 'Iltony',
        lastName: 'Sverbel',
        documentType: 'CEDULA' as const,
        documentNumber: '1000000001',
        phone: '+57 300 123 4567',
      },
      {
        email: 'admin@itdimenzion.com',
        username: 'super.admin',
        firstName: 'Super',
        lastName: 'Admin',
        documentType: 'CEDULA' as const,
        documentNumber: '1000000002',
        phone: '+57 300 123 4568',
      },
    ];

    // Crear usuarios super administradores
    for (const adminData of superAdmins) {
      const existingUser = await prisma.user.findUnique({
        where: { email: adminData.email },
      });

      if (existingUser) {
        console.log(`⚠️  Usuario ya existe: ${adminData.email}`);
        
        // Actualizar si existe pero asegurar que tenga los permisos correctos
        await prisma.user.update({
          where: { documentNumber: existingUser.documentNumber },
          data: {
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
            loginAttempts: 0,
            lockedUntil: null,
          },
        });
        
        console.log(`✅ Permisos actualizados para: ${adminData.email}`);
      } else {
        const newAdmin = await prisma.user.create({
          data: {
            ...adminData,
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            headquartersId: headquarters.id,
            jobTitleId: adminJobTitle.id,
            processId: defaultProcess.id,
            emailVerified: true,
            loginAttempts: 0,
          },
        });

        console.log(`✅ Super administrador creado: ${newAdmin.email}`);
      }
    }

    console.log('\n🎉 Inicialización completada exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('👤 Usuarios: iltonysverbel@gmail.com, admin@itdimenzion.com');
    console.log('🔑 Contraseña: H3lpD3sk.2025');
    console.log('\n⚠️  IMPORTANTE: Cambia estas contraseñas en producción');

    // Mostrar estadísticas
    const stats = await Promise.all([
      prisma.company.count(),
      prisma.headquarters.count(),
      prisma.user.count(),
      prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
    ]);

    console.log('\n📊 Estadísticas del sistema:');
    console.log(`🏢 Empresas: ${stats[0]}`);
    console.log(`🏬 Sedes: ${stats[1]}`);
    console.log(`👥 Usuarios totales: ${stats[2]}`);
    console.log(`🔑 Super administradores: ${stats[3]}`);

  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
};

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  initSuperAdmin();
}

export { initSuperAdmin };