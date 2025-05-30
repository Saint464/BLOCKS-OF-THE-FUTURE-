/**
 * Traditional Banking Server on Port 3000
 * 
 * This server handles traditional banking functionality
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Set up CORS and security headers
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add security headers
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Banking account endpoints
app.get('/api/banking/accounts', (req, res) => {
  // Simulated banking accounts
  res.json([
    { 
      id: 1, 
      name: 'Checking Account', 
      accountNumber: '********3421', 
      balance: 5280.45, 
      available: 5280.45,
      currency: 'USD',
      type: 'checking'
    },
    { 
      id: 2, 
      name: 'Savings Account', 
      accountNumber: '********7890', 
      balance: 12590.00, 
      available: 12590.00,
      currency: 'USD',
      type: 'savings',
      interestRate: 2.5
    },
    { 
      id: 3, 
      name: 'Investment Account', 
      accountNumber: '********4321', 
      balance: 354850.00, 
      available: 354850.00,
      currency: 'USD',
      type: 'investment'
    }
  ]);
});

// Transaction history endpoint
app.get('/api/banking/transactions', (req, res) => {
  // Simulated transaction history
  res.json([
    { 
      id: 1, 
      date: '2025-04-20', 
      description: 'Grocery Store', 
      amount: -125.65, 
      type: 'debit',
      category: 'Food',
      accountId: 1
    },
    { 
      id: 2, 
      date: '2025-04-18', 
      description: 'Salary Deposit', 
      amount: 3200.00, 
      type: 'credit',
      category: 'Income',
      accountId: 1
    },
    { 
      id: 3, 
      date: '2025-04-15', 
      description: 'Restaurant Payment', 
      amount: -85.20, 
      type: 'debit',
      category: 'Dining',
      accountId: 1
    },
    { 
      id: 4, 
      date: '2025-04-12', 
      description: 'Online Shopping', 
      amount: -250.00, 
      type: 'debit',
      category: 'Shopping',
      accountId: 1
    },
    { 
      id: 5, 
      date: '2025-04-10', 
      description: 'Interest Payment', 
      amount: 12.30, 
      type: 'credit',
      category: 'Income',
      accountId: 2
    }
  ]);
});

// Account statements endpoint
app.get('/api/banking/statements', (req, res) => {
  // Simulated statements list
  res.json([
    {
      id: 1,
      accountId: 1,
      period: 'April 2025',
      startDate: '2025-04-01',
      endDate: '2025-04-30',
      openingBalance: 2430.75,
      closingBalance: 5280.45,
      transactions: 12,
      downloadUrl: '/api/banking/statements/1/download'
    },
    {
      id: 2,
      accountId: 1,
      period: 'March 2025',
      startDate: '2025-03-01',
      endDate: '2025-03-31',
      openingBalance: 1875.32,
      closingBalance: 2430.75,
      transactions: 15,
      downloadUrl: '/api/banking/statements/2/download'
    },
    {
      id: 3,
      accountId: 2,
      period: 'April 2025',
      startDate: '2025-04-01',
      endDate: '2025-04-30',
      openingBalance: 11950.25,
      closingBalance: 12590.00,
      transactions: 3,
      downloadUrl: '/api/banking/statements/3/download'
    }
  ]);
});

// Support API endpoints
app.get('/api/*', (req, res) => {
  // Forward all other API requests to the vehicle marketplace server
  res.redirect(`http://localhost:4000${req.originalUrl}`);
});

// Serve the main application
app.get('*', (req, res) => {
  res.redirect('http://localhost:4000/');
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Traditional Banking server running on port ${PORT}`);
});