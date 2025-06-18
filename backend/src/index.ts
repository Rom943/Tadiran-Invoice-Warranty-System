import express from 'express';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { networkInterfaces } from 'os';

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

// ✅ CORS - handled manually
const allowedOrigins = [
  'https://tadiran-invoice-warranty-system.vercel.app',
  'https://tadiran-invoice-warranty-system-h7ilvomsf-rom943s-projects.vercel.app',
  'http://localhost:5173',
];

app.use((req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept');
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

// 🧱 Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(config.cookie.secret));

// 🧪 Dev-only static temp
if (process.env.NODE_ENV !== 'production') {
  app.use('/temp', express.static(config.tempDir));
}

// 📘 Swagger UI
const openApiSpec = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'config', 'openapi.json'), 'utf8')
);

openApiSpec.servers = [
  { url: 'https://tadiran-invoice-warranty-system.onrender.com', description: 'Production server' },
];

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// 🛣 Routes
app.use('/', routes);
app.use('/api/debug', debugRoutes);

// ❤️ Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    clientIp: req.ip,
  });
});

// ❌ Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Not Found - The requested resource does not exist',
  });
});

// 🌐 Print network IPs
const nets = networkInterfaces();
const addresses: string[] = [];
for (const name of Object.keys(nets)) {
  for (const net of nets[name] || []) {
    if (net.family === 'IPv4' && !net.internal) {
      addresses.push(net.address);
    }
  }
}

// 🚀 Start server
const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log('=========================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📘 Swagger UI: http://localhost:${PORT}/docs`);
  addresses.forEach(addr => console.log(`🌐 http://${addr}:${PORT}`));
});
