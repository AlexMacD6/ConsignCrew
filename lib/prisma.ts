import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaExitHandlerRegistered?: boolean
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown - only register the handler once
if (process.env.NODE_ENV !== 'production' && !globalForPrisma.prismaExitHandlerRegistered) {
  globalForPrisma.prismaExitHandlerRegistered = true
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
