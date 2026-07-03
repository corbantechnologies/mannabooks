// drizzle.config.ts
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing from environment layout contexts.');
}

export default defineConfig({
    schema: './src/db/schema.ts', // Points straight to your database definitions
    out: './drizzle',             // Where generated SQL migration files will be saved
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
    verbose: true,
    strict: true,
});