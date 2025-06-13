/**
 * Script to create installer registration keys
 * 
 * Usage: 
 * npx ts-node src/scripts/create-registration-keys.ts --count 5
 */

import { PrismaClient } from '../../generated/prisma';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function createKeys(count: number = 5) {
  try {
    const keys = [];
    
    for (let i = 0; i < count; i++) {
      // Generate a random registration key
      const key = generateRegistrationKey();
      
      // Create registration key record
      const keyRecord = await prisma.installerRegistrationKey.create({
        data: {
          key
        }
      });
      
      keys.push({
        id: keyRecord.id,
        key: keyRecord.key
      });
    }
    
    console.log(`\n=== CREATED ${count} REGISTRATION KEYS ===\n`);
    
    // Display the keys in a formatted table
    console.log('ID\t\t\t\tKey');
    console.log('----------------------------------------');
    
    keys.forEach(key => {
      console.log(`${key.id}\t${key.key}`);
    });
    
    console.log('\nThese keys can be used for installer registration.');
    
  } catch (error) {
    console.error('Error creating registration keys:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Generate a registration key
function generateRegistrationKey(): string {
  // Simple implementation: use first 8 chars from a UUID without dashes
  return uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let count = 5; // Default count
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) {
      count = parseInt(args[i + 1], 10);
      if (isNaN(count) || count <= 0) {
        count = 5;
      }
      i++;
    }
  }
  
  return count;
}

// Main execution
const count = parseArgs();
createKeys(count).catch(console.error);
