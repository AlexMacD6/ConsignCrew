/**
 * Emergency script to revoke all exposed session tokens
 * 
 * These tokens were accidentally committed to the repository:
 * - 2I97VN3JkA3OJXo3Cg2bKabI3cw9BvlU
 * - RM0tIYaGstBbQUQWuSnf8DiX4PVPLuGZ
 * - IqMyZO3Vy6pkg0hbeJwa2wij1V0OhK88
 * - GaAH6rVhCd3nx6mQpcMB2PZEDcqVdSQZ
 * - 6hpKMYqrj0lcJwsHKR0r7jifCY663QgT
 * - lWOVgCatgt2Poq7LFn2o5Db940HotHrw
 * - NL4l4xnIWnGf7n84uFxJ3mu3Z36mjCyS
 * - xoctMOqjTpH43E92qXhks4RsI8DEZ993
 * - Wi0OUp429G0dMDqvo6QiEWz886sKs67J
 * - NTtqqRDdaTg2blCga4t28VAon7GUDrZ0
 * - aEbqHCPIOrgWo7CuC7NpUUA9zjvogt7Q
 * - acZXMnw1CmQLWPuycO58Ao9Dc2eMdKQ7
 * - 73RIe5fY03eDO8h8PCSiG3njHIEPmbbd
 */

const { PrismaClient } = require('@prisma/client');

const exposedTokens = [
  '2I97VN3JkA3OJXo3Cg2bKabI3cw9BvlU',
  'RM0tIYaGstBbQUQWuSnf8DiX4PVPLuGZ',
  'IqMyZO3Vy6pkg0hbeJwa2wij1V0OhK88',
  'GaAH6rVhCd3nx6mQpcMB2PZEDcqVdSQZ',
  '6hpKMYqrj0lcJwsHKR0r7jifCY663QgT',
  'lWOVgCatgt2Poq7LFn2o5Db940HotHrw',
  'NL4l4xnIWnGf7n84uFxJ3mu3Z36mjCyS',
  'xoctMOqjTpH43E92qXhks4RsI8DEZ993',
  'Wi0OUp429G0dMDqvo6QiEWz886sKs67J',
  'NTtqqRDdaTg2blCga4t28VAon7GUDrZ0',
  'aEbqHCPIOrgWo7CuC7NpUUA9zjvogt7Q',
  'acZXMnw1CmQLWPuycO58Ao9Dc2eMdKQ7',
  '73RIe5fY03eDO8h8PCSiG3njHIEPmbbd'
];

async function revokeExposedSessions() {
  const prisma = new PrismaClient();

  try {
    console.log('🚨 Starting emergency session revocation...');
    
    // Delete all sessions with exposed tokens
    const result = await prisma.session.deleteMany({
      where: {
        token: {
          in: exposedTokens
        }
      }
    });

    console.log(`✅ Successfully revoked ${result.count} exposed session(s)`);
    
    // Also expire any sessions for the affected user as a precaution
    const affectedUserId = 'AnyPPTDBnnFve9pJz2Vkqd7rvoNWIjit';
    
    const expiredResult = await prisma.session.updateMany({
      where: {
        userId: affectedUserId,
        expiresAt: {
          gt: new Date()
        }
      },
      data: {
        expiresAt: new Date() // Expire immediately
      }
    });

    console.log(`✅ Expired ${expiredResult.count} remaining session(s) for affected user`);
    console.log('🔒 All exposed sessions have been revoked. User will need to log in again.');
    
  } catch (error) {
    console.error('❌ Error revoking sessions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
revokeExposedSessions();
