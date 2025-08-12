const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('📋 Usuarios en la base de datos:\n');
    
    const users = await prisma.user.findMany({
      select: {
        documentNumber: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        headquarters: {
          select: {
            name: true,
            company: {
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

    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      return;
    }

    users.forEach((user, index) => {
      console.log(`${index + 1}. 👤 ${user.firstName} ${user.lastName}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🆔 Documento: ${user.documentNumber}`);
      console.log(`   🎭 Rol: ${user.role}`);
      console.log(`   📊 Estado: ${user.status}`);
      console.log(`   🏢 Empresa: ${user.headquarters?.company?.name || 'N/A'}`);
      console.log(`   🏬 Sede: ${user.headquarters?.name || 'N/A'}`);
      console.log(`   📅 Creado: ${new Date(user.createdAt).toLocaleDateString('es-CO')}`);
      console.log('');
    });

    console.log(`📊 Total de usuarios: ${users.length}`);
    
    // Estadísticas por rol
    const roleStats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📈 Estadísticas por rol:');
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} usuario(s)`);
    });

  } catch (error) {
    console.error('❌ Error consultando usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();