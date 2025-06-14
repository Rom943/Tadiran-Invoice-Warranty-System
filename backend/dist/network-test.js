"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const os_1 = require("os");
const cors_1 = __importDefault(require("cors"));
// Create a simple test server
const app = (0, express_1.default)();
// Enable CORS for all origins
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
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
// Simple endpoint to test connectivity
app.get('/', (req, res) => {
    res.json({
        message: 'Network test server is running!',
        clientIp: req.ip,
        serverAddresses: addresses
    });
});
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});
// Start the server on all interfaces
const PORT = 3001; // Use a different port from main app
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Network test server running on port ${PORT}`);
    console.log('Server accessible at:');
    addresses.forEach(address => {
        console.log(`- http://${address}:${PORT}`);
    });
});
