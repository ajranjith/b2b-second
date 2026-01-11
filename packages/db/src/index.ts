import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

export * from '@prisma/client';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/hotbray?schema=public';

const pool = new Pool({
    connectionString,
    // Explicit configuration to avoid parsing issues
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'hotbray',
});

const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter } as any);
