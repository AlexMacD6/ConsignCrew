// Re-export the shared Prisma client from the root lib
import { prisma } from '../../lib/prisma';

export const db = prisma; 