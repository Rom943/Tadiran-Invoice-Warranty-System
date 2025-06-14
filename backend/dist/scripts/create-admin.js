"use strict";
/**
 * Script to create an admin user and generate a token for testing
 *
 * Usage:
 * npx ts-node src/scripts/create-admin.ts --email "admin@example.com" --password "123456789" --name "Admin User"
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../../generated/prisma");
const password_service_1 = __importDefault(require("../services/password.service"));
const jwt_service_1 = __importDefault(require("../services/jwt.service"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const prisma = new prisma_1.PrismaClient();
async function createAdmin(params) {
    try {
        const { email, password, name } = params;
        // Check if admin already exists
        const existingAdmin = await prisma.adminUser.findUnique({
            where: { email }
        });
        if (existingAdmin) {
            console.log(`\nAdmin with email ${email} already exists. Generating token for existing admin.\n`);
            // Generate token for existing admin
            const token = jwt_service_1.default.generateToken(existingAdmin.id, 'admin', existingAdmin.email);
            console.log('=== TOKEN FOR EXISTING ADMIN ===');
            console.log(`\nToken: ${token}\n`);
            console.log('Use this token in Postman by adding it as a Cookie header:');
            console.log(`Cookie: token=${token}\n`);
            console.log('Or use it as a cookie in your browser.\n');
            return;
        }
        // Hash password
        const hashedPassword = await password_service_1.default.hashPassword(password);
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
        const token = jwt_service_1.default.generateToken(createdAdmin.id, 'admin', createdAdmin.email);
        console.log('=== TOKEN FOR TESTING ===');
        console.log(`\nToken: ${token}\n`);
        console.log('Use this token in Postman by adding it as a Cookie header:');
        console.log(`Cookie: token=${token}\n`);
        console.log('Or use it as a cookie in your browser.\n');
    }
    catch (error) {
        console.error('Error creating admin:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const params = {};
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--email' && args[i + 1]) {
            params.email = args[i + 1];
            i++;
        }
        else if (args[i] === '--password' && args[i + 1]) {
            params.password = args[i + 1];
            i++;
        }
        else if (args[i] === '--name' && args[i + 1]) {
            params.name = args[i + 1];
            i++;
        }
    }
    if (!params.email || !params.password) {
        console.error('Missing required parameters. Usage:');
        console.error('npx ts-node src/scripts/create-admin.ts --email admin@example.com --password securepassword --name "Admin User"');
        process.exit(1);
    }
    return params;
}
// Main execution
const params = parseArgs();
createAdmin(params).catch(console.error);
