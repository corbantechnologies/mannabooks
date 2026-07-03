// src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is missing.');
}

// Establish a reusable connection pool for high-velocity database access
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // Maintain a clean connection cap for serverless/edge pathways
});

export const db = drizzle(pool, { schema });