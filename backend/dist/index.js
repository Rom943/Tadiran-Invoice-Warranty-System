"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const os_1 = require("os");
const routes_1 = __importDefault(require("./routes"));
const debug_routes_1 = __importDefault(require("./routes/debug.routes"));
const env_config_1 = __importDefault(require("./config/env.config"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// 🛡️ Manual CORS Middleware (works on Render!)
const allowedOrigins = [
    'https://tadiran-invoice-warranty-system.vercel.app',
    'https://tadiran-invoice-warranty-system-h7ilvomsf-rom943s-projects.vercel.app',
    'http://localhost:5173'
];
app.use((req, res, next) => {
    const origin = req.headers.origin;
    // Allow requests from web origins or mobile apps (no origin)
    if (!origin || allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
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
// 🧱 Middlewares
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)(env_config_1.default.cookie.secret));
// 📁 Dev static files
if (process.env.NODE_ENV !== 'production') {
    if (!fs_1.default.existsSync(env_config_1.default.tempDir)) {
        fs_1.default.mkdirSync(env_config_1.default.tempDir, { recursive: true });
    }
    app.use('/temp', express_1.default.static(env_config_1.default.tempDir));
}
// 📘 Swagger
const openApiSpec = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, 'config', 'openapi.json'), 'utf8'));
openApiSpec.servers = [
    { url: 'https://tadiran-invoice-warranty-system.onrender.com', description: 'Production server' },
];
app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openApiSpec));
// 🛣️ Routes
app.use('/', routes_1.default);
app.use('/api/debug', debug_routes_1.default);
// 🩺 Health
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        clientIp: req.ip,
    });
});
// ❌ Error handler
app.use((err, req, res, next) => {
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
// 🌐 IP log
const nets = (0, os_1.networkInterfaces)();
const addresses = [];
for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
            addresses.push(net.address);
        }
    }
}
// 🚀 Start
const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📘 Swagger: http://localhost:${PORT}/docs`);
    addresses.forEach(addr => console.log(`🌐 http://${addr}:${PORT}`));
});
