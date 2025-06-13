import express from 'express';
import { networkInterfaces } from 'os';
import cors from 'cors';

// Create a simple test server
const app = express();

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
