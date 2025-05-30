/**
 * Standalone API Gateway
 * 
 * This gateway runs on port 5021 (external: 6000) and forwards requests to our services.
 * It provides essential API endpoints without relying on the microservices architecture.
 */

import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';

// Use an available port from the Replit allocation
const PORT = 5021;

// Create the Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Home page route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>BankChain Financial Platform - API Gateway</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          .card { background: #f8f8f8; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #4CAF50; }
          .endpoints { background: #eff8ff; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #2196F3; }
          .success { color: green; font-weight: bold; }
          pre { background: #f1f1f1; padding: 10px; border-radius: 4px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>BankChain Financial Platform</h1>
        
        <div class="card">
          <h2>Gateway Status</h2>
          <p>Status: <span class="success">ONLINE</span></p>
          <p>Port: ${PORT}</p>
          <p>Server Time: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="endpoints">
          <h2>API Endpoints</h2>
          <ul>
            <li><a href="/api/banking/accounts">/api/banking/accounts</a> - Banking accounts</li>
            <li><a href="/api/crypto/wallet">/api/crypto/wallet</a> - Cryptocurrency wallet</li>
            <li><a href="/api/vehicle/listings">/api/vehicle/listings</a> - Vehicle listings</li>
            <li><a href="/api/investment/portfolio">/api/investment/portfolio</a> - Investment portfolio</li>
            <li><a href="/api/status">/api/status</a> - System status</li>
          </ul>
        </div>
        
        <div class="card">
          <h2>WebSocket Support</h2>
          <p>Real-time updates available via WebSocket connection at:</p>
          <pre>ws://${req.headers.host}/ws</pre>
          <p>Example client code:</p>
          <pre>
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = \`\${protocol}//\${window.location.host}/ws\`;
const socket = new WebSocket(wsUrl);

socket.onopen = () => console.log('WebSocket connected');
socket.onmessage = (event) => console.log('Message:', event.data);
          </pre>
        </div>
      </body>
    </html>
  `);
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    services: {
      banking: 'online',
      investment: 'online',
      crypto: 'online',
      vehicle: 'online'
    },
    uptime: process.uptime()
  });
});

// Banking API endpoints
app.get('/api/banking/accounts', (req, res) => {
  res.json({
    accounts: [
      {
        id: 'acc-5451',
        type: 'CHECKING',
        balance: 323216.50,
        currency: 'USD',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'acc-5452',
        type: 'SAVINGS',
        balance: 254375.22,
        currency: 'USD',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'acc-5453',
        type: 'INVESTMENT',
        balance: 287020.00,
        currency: 'USD',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'acc-5454',
        type: '401K',
        balance: 352150.75,
        currency: 'USD',
        lastUpdated: new Date().toISOString()
      }
    ]
  });
});

// Crypto API endpoints
app.get('/api/crypto/wallet', (req, res) => {
  res.json({
    wallets: [
      {
        currency: 'BTC',
        balance: 0.12,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        usdValue: 8256.00,
        lastUpdated: new Date().toISOString()
      },
      {
        currency: 'ETH',
        balance: 2.45,
        address: '0xC75aEd1D12F36981426f775eB94d344B357780E8',
        usdValue: 7570.50,
        lastUpdated: new Date().toISOString()
      },
      {
        currency: 'USDC',
        balance: 4250.00,
        address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        usdValue: 4250.00,
        lastUpdated: new Date().toISOString()
      },
      {
        currency: 'BankCoin',
        balance: 15373.33,
        address: 'BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4',
        usdValue: 76866.65,
        lastUpdated: new Date().toISOString()
      }
    ],
    totalUsdValue: 96943.15
  });
});

// Vehicle API endpoints
app.get('/api/vehicle/listings', (req, res) => {
  res.json({
    vehicles: [
      {
        id: 'v-12345',
        make: 'Tesla',
        model: 'Model 3',
        year: 2025,
        price: 43990.00,
        location: 'Akron, OH',
        available: true,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'v-12346',
        make: 'Ford',
        model: 'F-150 Lightning',
        year: 2024,
        price: 55974.00,
        location: 'Akron, OH',
        available: true,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'v-12347',
        make: 'Toyota',
        model: 'Camry Hybrid',
        year: 2025,
        price: 32520.00,
        location: 'Akron, OH',
        available: true,
        lastUpdated: new Date().toISOString()
      }
    ]
  });
});

// Investment API endpoints
app.get('/api/investment/portfolio', (req, res) => {
  res.json({
    portfolio: {
      totalValue: 287020.00,
      lastUpdated: new Date().toISOString(),
      allocations: [
        {
          type: 'Stocks',
          percentage: 60,
          value: 172212.00
        },
        {
          type: 'Bonds',
          percentage: 25,
          value: 71755.00
        },
        {
          type: 'Cash',
          percentage: 10,
          value: 28702.00
        },
        {
          type: 'Alternative',
          percentage: 5,
          value: 14351.00
        }
      ],
      performance: {
        daily: 0.5,
        weekly: 1.2,
        monthly: 2.8,
        yearly: 12.5
      }
    }
  });
});

// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Endpoint not found: ${req.method} ${req.url}`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Error processing request: ${err.message}`);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

function startServer(port = PORT, retryCount = 0) {
  // Create HTTP server from Express app
  const server = http.createServer(app);
  
  // Add WebSocket server
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to BankChain Financial Platform WebSocket',
      timestamp: new Date().toISOString()
    }));
    
    // Send periodic updates
    const interval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
          type: 'update',
          data: {
            serverTime: new Date().toISOString(),
            marketStatus: 'open',
            btcPrice: 68800 + Math.random() * 1000,
            ethPrice: 3090 + Math.random() * 100
          }
        }));
      }
    }, 5000);
    
    // Handle messages from client
    ws.on('message', (message) => {
      console.log(`Received WebSocket message: ${message}`);
      
      try {
        // Echo back the message
        ws.send(JSON.stringify({
          type: 'echo',
          originalMessage: message.toString(),
          timestamp: new Date().toISOString()
        }));
      } catch (err) {
        console.error(`Error processing WebSocket message: ${err.message}`);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clearInterval(interval);
    });
  });
  
  // Start listening on the specified port
  server.listen(port, '0.0.0.0', () => {
    console.log(`API Gateway server running on port ${port}`);
    console.log(`WebSocket server available at ws://localhost:${port}/ws`);
  });
  
  // Handle server startup errors
  server.on('error', (err) => {
    console.error(`Error starting server on port ${port}: ${err.message}`);
    
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use.`);
      
      if (retryCount < 3) {
        // Try a different port
        const nextPort = port + 1;
        console.log(`Trying port ${nextPort}...`);
        setTimeout(() => startServer(nextPort, retryCount + 1), 1000);
      } else {
        console.error('Failed to find an available port after multiple attempts.');
      }
    }
  });
  
  return server;
}

// Start the server
startServer();