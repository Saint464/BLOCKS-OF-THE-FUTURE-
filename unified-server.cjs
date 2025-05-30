/**
 * Unified Server for Blockchain Auto Marketplace (CommonJS Version)
 * 
 * This server provides all essential functionality on a single port
 * avoiding microservices architecture port conflicts.
 * 
 * Important: This file uses CommonJS format for maximum compatibility in Replit.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const net = require('net');
const process = require('process');

// Confirmed available ports
const AVAILABLE_PORTS = [5010, 5013, 5019, 5021, 5022, 5023, 5026, 5029];
let PORT = 5029; // Default port

// Utility function to check if a port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', () => {
      console.log(`Port ${port} is in use`);
      resolve(false);
    });
    
    server.once('listening', () => {
      server.close();
      console.log(`Port ${port} is available`);
      resolve(true);
    });
    
    server.listen(port, '0.0.0.0');
  });
}

// Find an available port from our list
async function findAvailablePort() {
  console.log('Searching for an available port...');
  
  for (const port of AVAILABLE_PORTS) {
    if (await isPortAvailable(port)) {
      console.log(`Will use port ${port}`);
      return port;
    }
  }
  
  console.log('No confirmed available ports found, using default 5029');
  return 5029;
}

// Sample data for our API
const accounts = [
  { id: 1, userId: 1, type: 'checking', balance: 5280.42, currency: 'USD' },
  { id: 2, userId: 1, type: 'savings', balance: 12750.00, currency: 'USD' },
  { id: 3, userId: 1, type: 'investment', balance: 32605.78, currency: 'USD' },
  { id: 4, userId: 1, type: 'crypto', balance: 2.5, currency: 'BTC' }
];

const vehicles = [
  { 
    id: 1, 
    make: 'Tesla', 
    model: 'Model 3', 
    year: 2023, 
    price: 42990,
    vin: '5YJ3E1EA1PF123456',
    blockchain_verified: true,
    verification_hash: '0x8a9b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b'
  },
  { 
    id: 2, 
    make: 'Toyota', 
    model: 'Camry Hybrid', 
    year: 2023, 
    price: 32990,
    vin: 'JTDBBRBE6P3123456',
    blockchain_verified: true,
    verification_hash: '0x7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8'
  },
  { 
    id: 3, 
    make: 'Ford', 
    model: 'Mustang Mach-E', 
    year: 2024, 
    price: 48995,
    vin: '3FMTK3SU1PP123456',
    blockchain_verified: true,
    verification_hash: '0x6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7'
  }
];

// Main function to start the server
async function startServer() {
  // Get an available port
  PORT = await findAvailablePort();
  
  // Create Express app
  const app = express();
  
  // Configure middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      port: PORT
    });
  });
  
  // Root route with HTML documentation
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Blockchain Auto Marketplace</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #2563eb; }
          .card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
          pre { background: #f7f7f7; padding: 10px; border-radius: 4px; overflow: auto; }
          .success { color: #059669; }
          .subtitle { color: #4b5563; font-size: 18px; margin-top: -10px; }
        </style>
      </head>
      <body>
        <h1>Blockchain Auto Marketplace</h1>
        <p class="subtitle">Unified API Server</p>
        
        <div class="card">
          <h2>Status: <span class="success">Online</span></h2>
          <p>Server running on port ${PORT}</p>
          <p>This consolidated server provides all microservices on a single port to avoid conflicts.</p>
        </div>
        
        <h2>Available Endpoints</h2>
        <div class="card">
          <h3>Banking</h3>
          <p><code>GET /api/banking/accounts</code> - Get user accounts</p>
          <p><code>POST /api/banking/transfer</code> - Initiate a transfer</p>
        </div>
        
        <div class="card">
          <h3>Vehicle Marketplace</h3>
          <p><code>GET /api/vehicles</code> - List all vehicles</p>
          <p><code>GET /api/vehicles/:id</code> - Get vehicle details</p>
        </div>
        
        <div class="card">
          <h3>Blockchain</h3>
          <p><code>GET /api/blockchain/status</code> - Get blockchain status</p>
          <p><code>POST /api/blockchain/verify</code> - Verify transaction</p>
        </div>
        
        <div class="card">
          <h3>System</h3>
          <p><code>GET /health</code> - API health check</p>
        </div>
      </body>
      </html>
    `);
  });
  
  // Banking routes
  app.get('/api/banking/accounts', (req, res) => {
    try {
      res.json({ success: true, data: accounts });
    } catch (err) {
      console.error('Error in /api/banking/accounts:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });
  
  app.post('/api/banking/transfer', (req, res) => {
    try {
      const { fromAccountId, toAccountId, amount } = req.body;
      
      if (!fromAccountId || !toAccountId || !amount) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }
      
      res.json({ 
        success: true, 
        data: {
          transferId: `TRX-${Date.now()}`,
          status: 'completed',
          fromAccountId,
          toAccountId,
          amount,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('Error in /api/banking/transfer:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });
  
  // Vehicle routes
  app.get('/api/vehicles', (req, res) => {
    try {
      res.json({ success: true, data: vehicles });
    } catch (err) {
      console.error('Error in /api/vehicles:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });
  
  app.get('/api/vehicles/:id', (req, res) => {
    try {
      const vehicle = vehicles.find(v => v.id === parseInt(req.params.id));
      
      if (!vehicle) {
        return res.status(404).json({ 
          success: false, 
          error: 'Vehicle not found' 
        });
      }
      
      res.json({ success: true, data: vehicle });
    } catch (err) {
      console.error(`Error in /api/vehicles/${req.params.id}:`, err);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });
  
  // Blockchain routes
  app.get('/api/blockchain/status', (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          network: 'Ethereum Mainnet',
          blockHeight: 19326584,
          gasPrice: '32 gwei',
          status: 'operational',
          verifiedTransactions: 15428
        }
      });
    } catch (err) {
      console.error('Error in /api/blockchain/status:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });
  
  app.post('/api/blockchain/verify', (req, res) => {
    try {
      const { hash } = req.body;
      
      if (!hash) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing transaction hash' 
        });
      }
      
      res.json({
        success: true,
        data: {
          hash,
          verified: true,
          timestamp: new Date().toISOString(),
          confirmations: 28,
          network: 'Ethereum Mainnet'
        }
      });
    } catch (err) {
      console.error('Error in /api/blockchain/verify:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });
  
  // Catch-all 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found'
    });
  });
  
  // Error handler
  app.use((err, req, res, next) => {
    console.error(`Error: ${err.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  });
  
  // Create HTTP server
  const server = http.createServer(app);
  
  // Start the server with error handling
  server.on('error', (err) => {
    console.error(`Server error on port ${PORT}:`, err);
    
    // If the port is already in use, try another one
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} is already in use, trying another port...`);
      
      // Close the current server
      server.close();
      
      // Try the next port in our list
      const currentIndex = AVAILABLE_PORTS.indexOf(PORT);
      if (currentIndex >= 0 && currentIndex < AVAILABLE_PORTS.length - 1) {
        PORT = AVAILABLE_PORTS[currentIndex + 1];
      } else {
        PORT = AVAILABLE_PORTS[0];
      }
      
      console.log(`Retrying with port ${PORT}`);
      server.listen(PORT, '0.0.0.0');
    }
  });
  
  // Listen on the port
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Blockchain Auto Marketplace API running at http://localhost:${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
  
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

// Start the server
console.log('Starting unified server...');
startServer().catch(err => {
  console.error('Failed to start server:', err);
});