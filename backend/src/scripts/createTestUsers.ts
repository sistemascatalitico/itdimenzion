import { PrismaClient, UserRole, Status, DocumentType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('Creating test users with different roles...');

    // Get the default headquarters
    const headquarters = await prisma.headquarters.findFirst();
    if (!headquarters) {
      throw new Error('No headquarters found. Run init-super-admin first.');
    }

    // Get job title and process
    const jobTitle = await prisma.jobTitle.findFirst();
    const process = await prisma.process.findFirst();

    const testUsers = [
      {
        email: 'admin.test@itdimenzion.com',
        password: 'H3lpD3sk.2025',
        firstName: 'Admin',
        lastName: 'Test User',
        documentType: DocumentType.CEDULA,
        documentNumber: '12345678',
        phone: '3001234567',
        role: UserRole.ADMIN,
      },
      {
        email: 'supervisor.test@itdimenzion.com',
        password: 'H3lpD3sk.2025',
        firstName: 'Supervisor',
        lastName: 'Test User',
        documentType: DocumentType.CEDULA,
        documentNumber: '87654321',
        phone: '3007654321',
        role: UserRole.SUPERVISOR,
      },
      {
        email: 'user.test@itdimenzion.com',
        password: 'H3lpD3sk.2025',
        firstName: 'Regular',
        lastName: 'Test User',
        documentType: DocumentType.CEDULA,
        documentNumber: '11223344',
        phone: '3009876543',
        role: UserRole.USER,
      },
    ];

    const saltRounds = 12;

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          documentType: userData.documentType,
          documentNumber: userData.documentNumber,
          phone: userData.phone,
          role: userData.role,
          status: Status.ACTIVE,
          emailVerified: true,
          headquartersId: headquarters.id,
          jobTitleId: jobTitle?.id,
          processId: process?.id,
        },
      });

      console.log(`✅ Created ${userData.role} user: ${userData.email}`);
    }

    // Display final statistics
    const stats = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true,
      },
    });

    console.log('\n📊 User Statistics by Role:');
    for (const stat of stats) {
      console.log(`${stat.role}: ${stat._count.role} users`);
    }

    console.log('\n🎉 Test users creation completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('👤 All test users password: H3lpD3sk.2025');
    console.log('📧 Emails:');
    testUsers.forEach(user => {
      console.log(`   - ${user.role}: ${user.email}`);
    });

  } catch (error) {
    console.error('❌ Error creating test users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();