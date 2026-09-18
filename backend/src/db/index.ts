import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema.ts';
import * as dotenv from 'dotenv';
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.warn("DATABASE_URL is not set. Database operations will fail if invoked.");
}

const sql = databaseUrl ? neon(databaseUrl) : (null as any);
export const db = databaseUrl ? drizzle(sql, { schema }) : (null as any);
