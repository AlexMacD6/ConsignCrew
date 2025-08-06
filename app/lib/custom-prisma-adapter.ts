import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'

// Create a custom adapter that handles name field mapping
const customPrismaAdapter = prismaAdapter(prisma, { provider: 'postgresql' })

// Override the createUser method to handle name field mapping
const originalCreateUser = customPrismaAdapter.createUser

customPrismaAdapter.createUser = async (data: any) => {
  console.log('Custom createUser called with data')
  
  // Handle OAuth providers that send 'name' instead of firstName/lastName
  // Only map if firstName and lastName are not already provided
  if (data.name && (!data.firstName || !data.lastName)) {
    const nameParts = data.name.trim().split(' ')
    data.firstName = data.firstName || nameParts[0] || ''
    data.lastName = data.lastName || nameParts.slice(1).join(' ') || ''
    console.log('Processed name mapping completed')
  }
  
  // Always remove the name field since we don't have it in our Prisma schema
  delete data.name
  
  return originalCreateUser(data)
}

export { customPrismaAdapter } 