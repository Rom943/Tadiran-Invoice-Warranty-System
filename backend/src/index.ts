import express from 'express';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import routes from './routes';
import debugRoutes from './routes/debug.routes';
import config from './config/env.config';

// Load environment variables
dotenv.config();

const app = express();

// Ensure temp directory exists
if (!fs.existsSync(config.tempDir)) {
  fs.mkdirSync(config.tempDir, { recursive: true });
}

// Apply CORS middleware first
app.use(cors({
  origin: (origin, callback) => {
const allowedOrigins = [
  'https://tadiran-invoice-warranty-system-h7ilvomsf-rom943s-projects.vercel.app',
  'https://tadiran-invoice-warranty-system.vercel.app',
  'https://tadiran-invoice-warranty-system.vercel.app/#/login',
  'http://localhost:5173',
];

    if (!origin || allowedOrigins.includes(origin)) {
      console.log(`CORS allowed for origin: ${origin}`);
      callback(null, true);
    } else {
      console.log(`CORS rejected for origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing form data
app.use(cookieParser(config.cookie.secret));

// Serve temporary files if needed (for development testing)
if (process.env.NODE_ENV !== 'production') {
  app.use('/temp', express.static(config.tempDir));
}

const isProd = process.env.NODE_ENV === 'production';

// Load static OpenAPI specification
const openApiSpec = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'config', 'openapi.json'), 'utf8')
);

// Update server URL based on environment
openApiSpec.servers = isProd 
  ? [{ url: 'https://tadiran-invoice-warranty-system.onrender.com', description: 'Production server' }]
  : [{ url: 'http://localhost:3000', description: 'Development server' }];

// Setup Swagger UI with static spec
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// API Routes
app.use('/', routes);
app.use('/api/debug', debugRoutes);

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
  

  if (addresses.length > 0) {
    addresses.forEach(address => {
      console.log(`- http://${address}:${PORT}`);
    });
    console.log(`API base URL for mobile app: http://${addresses[0]}:${PORT}/api`);
  } else {
    console.log('No external network interfaces found.');
  }
  
  console.log(`Swagger UI on http://localhost:${PORT}/docs`);

});
