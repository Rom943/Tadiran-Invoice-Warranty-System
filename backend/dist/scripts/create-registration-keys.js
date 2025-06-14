"use strict";
/**
 * Script to create installer registration keys
 *
 * Usage:
 * npx ts-node src/scripts/create-registration-keys.ts --count 5
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../../generated/prisma");
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const prisma = new prisma_1.PrismaClient();
async function createKeys(count = 5) {
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
    }
    catch (error) {
        console.error('Error creating registration keys:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
// Generate a registration key
function generateRegistrationKey() {
    // Simple implementation: use first 8 chars from a UUID without dashes
    return (0, uuid_1.v4)().replace(/-/g, '').substring(0, 8).toUpperCase();
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
