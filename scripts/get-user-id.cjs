const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getUserId() {
  try {
    console.log('🔍 Looking for users in the database...\n');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      },
      take: 10 // Limit to first 10 users
    });

    if (users.length === 0) {
      console.log('❌ No users found in the database.');
      console.log('   You need to create a user first before running the seed script.');
      return null;
    }

    console.log('✅ Found users:');
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ID: ${user.id}`);
      console.log(`      Email: ${user.email || 'No email'}`);
      console.log(`      Name: ${user.name || 'No name'}`);
      console.log(`      Created: ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    // Suggest the first user
    const suggestedUser = users[0];
    console.log(`💡 Suggested user ID: ${suggestedUser.id}`);
    console.log(`   Copy this ID and replace 'test-user-id' in the seed script.`);
    
    return suggestedUser.id;
  } catch (error) {
    console.error('❌ Error getting users:', error.message);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
async function main() {
  await getUserId();
}

if (require.main === module) {
  main();
}

module.exports = { getUserId };
