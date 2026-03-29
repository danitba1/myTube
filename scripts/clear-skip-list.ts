// Script to clear all skipped videos from the database
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { skippedVideos } from '../src/db/schema';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local file manually
const envPath = path.join(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envLines = envFile.split('\n');
for (const line of envLines) {
  const match = line.match(/^\s*([A-Z_]+)=(.+)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    process.env[key] = value;
  }
}

async function clearSkipList() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment');
    }

    console.log('🗑️  Deleting all skipped videos from database...');
    
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);
    
    const result = await db.delete(skippedVideos).returning();
    
    console.log(`✅ Successfully deleted ${result.length} skipped videos`);
    console.log('Skip list has been cleared!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing skip list:', error);
    process.exit(1);
  }
}

clearSkipList();
