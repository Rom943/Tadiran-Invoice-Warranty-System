import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export default {
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },  cookie: {
    secret: process.env.COOKIE_SECRET || 'default_cookie_secret',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const, // Changed from 'strict' to 'lax' to allow cross-origin requests
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  },
  environment: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
  },  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'warranties',
  },  googleVision: {
    keyFilePath: process.env.GOOGLE_VISION_KEY_FILE_PATH || '', // Can be file path or base64-encoded JSON
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
    languageHints: ['en', 'he', 'ar'], // English, Hebrew, Arabic
  },
  tempDir: path.resolve(__dirname, '../../temp'),
};
