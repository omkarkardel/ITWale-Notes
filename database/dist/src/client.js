import { PrismaClient } from '@prisma/client';
// Singleton across hot reloads
const globalForPrisma = global;
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = prisma;
