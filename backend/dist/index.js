"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const prisma_1 = require("../generated/prisma");
const routes_1 = __importDefault(require("./routes"));
const env_config_1 = __importDefault(require("./config/env.config"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
// Initialize Prisma client
const prisma = new prisma_1.PrismaClient();
// Ensure temp directory exists
if (!fs_1.default.existsSync(env_config_1.default.tempDir)) {
    fs_1.default.mkdirSync(env_config_1.default.tempDir, { recursive: true });
}
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true })); // For parsing form data
app.use((0, cookie_parser_1.default)(env_config_1.default.cookie.secret));
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin 
        // (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [,
            'http://10.100.102.13:3000',
            'https://tadiran.com'
        ];
        if (allowedOrigins.indexOf(origin) === -1) {
            console.log(`Origin ${origin} not allowed by CORS`);
        }
        return callback(null, true); // Allow all origins for development
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
// Serve temporary files if needed (for development testing)
if (process.env.NODE_ENV !== 'production') {
    app.use('/temp', express_1.default.static(env_config_1.default.tempDir));
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
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
// API Routes
app.use('/', routes_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Not Found - The requested resource does not exist'
    });
});
// Get all network interfaces for better logging
const os_1 = require("os");
// Get all network interfaces
const nets = (0, os_1.networkInterfaces)();
const addresses = [];
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
    }
    else {
        console.log('No external network interfaces found.');
    }
    console.log(`\nSwagger UI on http://localhost:${PORT}/docs`);
    console.log('=========================================');
});
