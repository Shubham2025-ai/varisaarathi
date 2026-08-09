import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 requires an explicit driver adapter — PrismaClient() no longer
// auto-reads DATABASE_URL from the environment at runtime (see seed.ts for
// the same fix, applied here for every API route that imports this file).

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Standard Next.js dev-mode singleton pattern — avoids exhausting Neon's
// connection pool from hot-reload creating a new client on every save.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;