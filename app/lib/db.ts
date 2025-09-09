import { PrismaClient } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Create a singleton Prisma client with better error handling
function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  // Require DATABASE_URL to be set - no fallback to mock database
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required')
  }
  
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['info', 'warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }

  return client
}

// Initialize the client immediately to ensure it's available during build
export const db = getPrismaClient()

// Helper function to check if database is available
export function isDatabaseAvailable(): boolean {
  return !!process.env.DATABASE_URL
}

// Helper function to safely execute database operations
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    if (!isDatabaseAvailable()) {
      throw new Error('Database not available')
    }
    return await operation()
  } catch (error) {
    console.error('Database operation failed:', error)
    if (fallback !== undefined) {
      return fallback
    }
    throw error
  }
} 