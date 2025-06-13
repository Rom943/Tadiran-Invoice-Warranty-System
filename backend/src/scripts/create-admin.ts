/**
 * Script to create an admin user and generate a token for testing
 * 
 * Usage: 
 * npx ts-node src/scripts/create-admin.ts --email "admin@example.com" --password "123456789" --name "Admin User"
 */

import { PrismaClient } from '../../generated/prisma';
import passwordService from '../services/password.service';
import jwtService from '../services/jwt.service';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

interface AdminCreationParams {
  email: string;
  password: string;
  name?: string;
}

async function createAdmin(params: AdminCreationParams) {
  try {
    const { email, password, name } = params;
    
    // Check if admin already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      console.log(`\nAdmin with email ${email} already exists. Generating token for existing admin.\n`);
      
      // Generate token for existing admin
      const token = jwtService.generateToken(existingAdmin.id, 'admin', existingAdmin.email);
      
      console.log('=== TOKEN FOR EXISTING ADMIN ===');
      console.log(`\nToken: ${token}\n`);
      console.log('Use this token in Postman by adding it as a Cookie header:');
      console.log(`Cookie: token=${token}\n`);
      console.log('Or use it as a cookie in your browser.\n');
      
      return;
    }

    // Hash password
    const hashedPassword = await passwordService.hashPassword(password);

    // Create admin user
    const createdAdmin = await prisma.adminUser.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0]
      }
    });

    console.log('\n=== ADMIN CREATED SUCCESSFULLY ===');
    console.log(`\nAdmin ID: ${createdAdmin.id}`);
    console.log(`Admin Email: ${createdAdmin.email}`);
    console.log(`Admin Name: ${createdAdmin.name || 'Not provided'}\n`);

    // Generate token for testing
    const token = jwtService.generateToken(createdAdmin.id, 'admin', createdAdmin.email);
    
    console.log('=== TOKEN FOR TESTING ===');
    console.log(`\nToken: ${token}\n`);
    console.log('Use this token in Postman by adding it as a Cookie header:');
    console.log(`Cookie: token=${token}\n`);
    console.log('Or use it as a cookie in your browser.\n');

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params: Partial<AdminCreationParams> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      params.email = args[i + 1];
      i++;
    } else if (args[i] === '--password' && args[i + 1]) {
      params.password = args[i + 1];
      i++;
    } else if (args[i] === '--name' && args[i + 1]) {
      params.name = args[i + 1];
      i++;
    }
  }

  if (!params.email || !params.password) {
    console.error('Missing required parameters. Usage:');
    console.error('npx ts-node src/scripts/create-admin.ts --email admin@example.com --password securepassword --name "Admin User"');
    process.exit(1);
  }

  return params as AdminCreationParams;
}

// Main execution
const params = parseArgs();
createAdmin(params).catch(console.error);
