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
app.use(cors({  origin: function(origin, callback) {
    // Allow requests with no origin 
    // (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173', // React Admin
      'http://localhost:3000', // Backend URL
      'http://10.100.102.13:3000',
      'https://tadiran.com'
    ];
    
    if(allowedOrigins.indexOf(origin) === -1){
      console.log(`Origin ${origin} not allowed by CORS`);
      return callback(null, false);
    }
    
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
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

// Get all network interfaces for better logging
import { networkInterfaces } from 'os';

// Get all network interfaces
const nets = networkInterfaces();
const addresses: string[] = [];

// Extract all IPv4 addresses
for (const name of Object.keys(nets)) {
  for (const net of nets[name] || []) {
    // Skip over non-IPv4 and internal addresses
    if (net.family === 'IPv4' && !net.internal) {
      addresses.push(net.address);
    }
  }
}

// Add a health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    clientIp: req.ip
  });
});

// Initialize server
const PORT = parseInt(process.env.PORT || '3000', 10);

// Bind to 0.0.0.0 to allow connections from any network interface
app.listen(PORT, '0.0.0.0', () => {
  console.log('=========================================');
  console.log(`Server running on port ${PORT}`);
  console.log('Access locally via:');
  console.log(`- http://localhost:${PORT}`);
  console.log(`- http://127.0.0.1:${PORT}`);
  
  console.log('\nAccess from other devices via:');
  if (addresses.length > 0) {
    addresses.forEach(address => {
      console.log(`- http://${address}:${PORT}`);
    });
    console.log(`\nAPI base URL for mobile app: http://${addresses[0]}:${PORT}/api`);
  } else {
    console.log('No external network interfaces found.');
  }
  
  console.log(`\nSwagger UI on http://localhost:${PORT}/docs`);
  console.log('=========================================');
});
