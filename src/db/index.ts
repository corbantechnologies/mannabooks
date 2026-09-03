// src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is missing.');
}

const globalForDb = globalThis as unknown as {
    pool?: Pool;
    db?: ReturnType<typeof drizzle<typeof schema>>;
};

// Establish a reusable connection pool for high-velocity database access
const pool = globalForDb.pool ?? new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // Maintain a clean connection cap for serverless/edge pathways
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool;

export const db = globalForDb.db ?? drizzle(pool, { schema });
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;