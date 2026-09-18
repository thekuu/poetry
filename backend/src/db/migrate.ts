import { migrate } from 'drizzle-orm/neon-http/migrator';
import { db } from './index.js';

async function runMigrate() {
  if (!db) {
      console.log('No database configured. Skipping migration.');
      process.exit(0);
  }
  
  console.log('Running migrations...');
  try {
    await migrate(db, { migrationsFolder: 'backend/src/db/migrations' });
    console.log('Migrations completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigrate();
