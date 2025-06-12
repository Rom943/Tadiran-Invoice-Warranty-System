import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '../generated/prisma';
import routes from './routes';
import config from './config/env.config';

// Load environment variables
dotenv.config();

const app = express();

// Initialize Prisma client
const prisma = new PrismaClient();

// Ensure temp directory exists
if (!fs.existsSync(config.tempDir)) {
  fs.mkdirSync(config.tempDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing form data
app.use(cookieParser(config.cookie.secret));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://tadiran.com' : 'http://localhost:3000',
  credentials: true
}));

// Serve temporary files if needed (for development testing)
if (process.env.NODE_ENV !== 'production') {
  app.use('/temp', express.static(config.tempDir));
}

const isProd = process.env.NODE_ENV === 'production';
// Swagger setup
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tadiran Warranty API',
      version: '1.0.0',
      description: 'Warranty activation backend API',
    },
    servers: [{ url: isProd ? 'https://api.tadiran.com' : 'http://localhost:3000' }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token'
        }
      }
    },
    security: [
      {
        cookieAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Files to scan for annotations
};

const swaggerSpec = swaggerJsdoc(options);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/', routes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: 'Not Found - The requested resource does not exist'
  });
});

// Initialize server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger UI on http://localhost:${PORT}/docs`);
});
