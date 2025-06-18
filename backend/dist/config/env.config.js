"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.default = {
    jwt: {
        secret: process.env.JWT_SECRET || 'default_jwt_secret_key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    }, cookie: {
        secret: process.env.COOKIE_SECRET || 'default_cookie_secret',
        options: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        },
    },
    environment: process.env.NODE_ENV,
    database: {
        url: process.env.DATABASE_URL,
    }, cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
        folder: process.env.CLOUDINARY_FOLDER,
    }, googleVision: {
        keyFilePath: process.env.GOOGLE_VISION_KEY_FILE_PATH || '', // Can be file path or base64-encoded JSON
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
        languageHints: ['en', 'he', 'ar'], // English, Hebrew, Arabic
    },
    tempDir: path_1.default.resolve(__dirname, '../../temp'),
};
