import { db } from './index.js';
import { users } from './schema.js';
import bcrypt from 'bcryptjs';

async function runSeed() {
  if (!db) {
      console.log('No database configured. Skipping seed.');
      process.exit(0);
  }
  
  console.log('Seeding database with admin user...');
  
  try {
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    await db.insert(users).values({
      username: 'admin',
      passwordHash,
      role: 'admin',
    });

    console.log('Admin user seeded successfully! username: admin, password: admin123');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

runSeed();
