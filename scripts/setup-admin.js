import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    console.log('Setting up admin organization...');

    // Create default admin organization
    const adminOrg = await prisma.organization.upsert({
      where: { slug: 'treasurehub-admin' },
      update: {},
      create: {
        name: 'TreasureHub Admin',
        slug: 'treasurehub-admin',
        metadata: JSON.stringify({
          description: 'Default admin organization for TreasureHub',
          type: 'admin',
        }),
      },
    });

    console.log('Admin organization created/updated:', adminOrg.id);

    // Find the first user (or you can specify by email)
    const firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!firstUser) {
      console.log('No users found. Please create a user first.');
      return;
    }

    console.log('Found user in database');

    // Check if user is already a member
    const existingMember = await prisma.member.findFirst({
      where: {
        userId: firstUser.id,
        organizationId: adminOrg.id,
      },
    });

    if (existingMember) {
      // Update to admin role
      await prisma.member.update({
        where: { id: existingMember.id },
        data: { role: 'OWNER' },
      });
      console.log('Updated existing member to OWNER role');
    } else {
      // Create new admin member
      await prisma.member.create({
        data: {
          userId: firstUser.id,
          organizationId: adminOrg.id,
          role: 'OWNER',
        },
      });
      console.log('Created new admin member with OWNER role');
    }

    console.log('Admin setup complete!');
    console.log('User is now an OWNER of the admin organization');

  } catch (error) {
    console.error('Error setting up admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupAdmin(); 