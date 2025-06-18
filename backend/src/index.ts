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
import { networkInterfaces } from 'os';

// Load environment variables
dotenv.config();

const app = express();

// Ensure temp directory exists
if (!fs.existsSync(config.tempDir)) {
  fs.mkdirSync(config.tempDir, { recursive: true });
}

// 🛡️ CORS setup
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://tadiran-invoice-warranty-system-h7ilvomsf-rom943s-projects.vercel.app',
      'https://tadiran-invoice-warranty-system.vercel.app',
      'http://localhost:5173',
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};

// 🧠 Apply CORS before any routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // 🔥 critical for preflight requests

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(config.cookie.secret));

// Serve temp files in development
if (process.env.NODE_ENV !== 'production') {
  app.use('/temp', express.static(config.tempDir));
}

// Swagger UI
const openApiSpec = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'config', 'openapi.json'), 'utf8')
);
openApiSpec.servers = [
  { url: 'https://tadiran-invoice-warranty-system.onrender.com', description: 'Production server' },
];
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// API Routes
app.use('/', routes);
app.use('/api/debug', debugRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    clientIp: req.ip,
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Not Found - The requested resource does not exist',
  });
});

// Logging available addresses
const nets = networkInterfaces();
const addresses: string[] = [];
for (const name of Object.keys(nets)) {
  for (const net of nets[name] || []) {
    if (net.family === 'IPv4' && !net.internal) {
      addresses.push(net.address);
    }
  }
}

// Start the server
const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log('=========================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/docs`);
  addresses.forEach(addr => console.log(`- http://${addr}:${PORT}`));
});
