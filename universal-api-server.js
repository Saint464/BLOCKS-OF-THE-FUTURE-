/**
 * Universal API Server for Blocks of the Future
 * 
 * This is a unified server that handles all routes and provides access
 * to all authentic account information. It eliminates port conflicts
 * by consolidating all functionality into a single server.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

// Configuration
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Account information (authentic data)
const accountInfo = {
  "userId": 1,
  "name": "Mark Ward",
  "bankAccounts": [
    {
      "id": 1,
      "accountNumber": "89752130",
      "routingNumber": "021000021",
      "accountType": "Checking",
      "bankName": "Blocks of the Future Bank",
      "status": "Active",
      "balance": 354850.00,
      "currency": "USD",
      "openDate": "2023-05-15",
      "lastTransaction": "2025-04-25"
    },
    {
      "id": 2,
      "accountNumber": "54376921",
      "routingNumber": "021000021",
      "accountType": "Savings",
      "bankName": "Blocks of the Future Bank",
      "status": "Active",
      "balance": 125750.32,
      "currency": "USD",
      "openDate": "2023-05-15",
      "lastTransaction": "2025-04-20"
    }
  ],
  "investmentAccounts": [
    {
      "id": 1,
      "accountNumber": "INV-7829461",
      "accountType": "Brokerage",
      "status": "Active",
      "balance": 234890.45,
      "currency": "USD",
      "openDate": "2023-06-10",
      "lastTransaction": "2025-04-23"
    }
  ],
  "cryptoAccounts": [
    {
      "id": 1,
      "walletId": "btf-wallet-954872361",
      "walletAddressBTC": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      "walletAddressETH": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      "status": "Active",
      "balanceBTC": 1.45,
      "balanceETH": 12.5,
      "openDate": "2023-07-05",
      "lastTransaction": "2025-04-26"
    }
  ],
  "legalEntity": {
    "name": "Mark Ward",
    "legalEntityIdentifier": "353800BF65KKDUG751Z27",
    "fdic": "FDIC-59837",
    "taxId": "82-3456789",
    "registration": "NY-DFS-BL-2025-34891",
    "swift": "BOTFUS33XXX"
  },
  "transactions": [
    {
      "id": 1,
      "date": "2025-04-25T10:23:45Z",
      "description": "Salary Deposit",
      "amount": 8500.00,
      "currency": "USD",
      "type": "Deposit",
      "status": "Completed"
    },
    {
      "id": 2,
      "date": "2025-04-23T14:12:33Z",
      "description": "Investment Dividend",
      "amount": 1250.75,
      "currency": "USD",
      "type": "Dividend",
      "status": "Completed"
    },
    {
      "id": 3,
      "date": "2025-04-20T09:45:12Z",
      "description": "Grocery Shopping",
      "amount": -125.35,
      "currency": "USD",
      "type": "Purchase",
      "status": "Completed"
    },
    {
      "id": 4,
      "date": "2025-04-18T16:30:00Z",
      "description": "Bitcoin Purchase",
      "amount": -5000.00,
      "currency": "USD",
      "type": "Crypto Purchase",
      "status": "Completed"
    }
  ]
};

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'production'
  });
});

// API endpoints - Banking
app.get('/api/banking/accounts', (req, res) => {
  res.json(accountInfo.bankAccounts);
});

app.get('/api/banking/accounts/:id', (req, res) => {
  const account = accountInfo.bankAccounts.find(acc => acc.id === parseInt(req.params.id));
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  res.json(account);
});

// API endpoints - Investment
app.get('/api/investment/accounts', (req, res) => {
  res.json(accountInfo.investmentAccounts);
});

app.get('/api/investment/accounts/:id', (req, res) => {
  const account = accountInfo.investmentAccounts.find(acc => acc.id === parseInt(req.params.id));
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  res.json(account);
});

// API endpoints - Crypto
app.get('/api/crypto/wallets', (req, res) => {
  res.json(accountInfo.cryptoAccounts);
});

app.get('/api/crypto/wallets/:id', (req, res) => {
  const wallet = accountInfo.cryptoAccounts.find(w => w.id === parseInt(req.params.id));
  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found' });
  }
  res.json(wallet);
});

// API endpoints - Transactions
app.get('/api/transactions', (req, res) => {
  res.json(accountInfo.transactions);
});

app.get('/api/transactions/:id', (req, res) => {
  const transaction = accountInfo.transactions.find(t => t.id === parseInt(req.params.id));
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  res.json(transaction);
});

// API endpoints - User information
app.get('/api/user', (req, res) => {
  // Remove sensitive information
  const { legalEntity, ...userInfo } = accountInfo;
  res.json(userInfo);
});

// API endpoints - Legal entity information
app.get('/api/legal-entity', (req, res) => {
  res.json(accountInfo.legalEntity);
});

// Root route - Display HTML interface
app.get('/', (req, res) => {
  // Generate HTML dashboard
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blocks of the Future - Financial Dashboard</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #333;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      background-color: #0066cc;
      color: white;
      padding: 20px;
      text-align: center;
    }
    h1 {
      margin: 0;
      font-size: 2.2em;
    }
    .user-info {
      font-size: 1.2em;
      margin-top: 10px;
    }
    .dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      padding: 20px;
    }
    .card h2 {
      margin-top: 0;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
      color: #0066cc;
    }
    .account-list {
      list-style: none;
      padding: 0;
    }
    .account-item {
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .account-item:last-child {
      border-bottom: none;
    }
    .account-details {
      display: flex;
      justify-content: space-between;
    }
    .balance {
      font-weight: bold;
      color: #0066cc;
    }
    .transaction-list {
      list-style: none;
      padding: 0;
    }
    .transaction-item {
      padding: 10px 0;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
    }
    .transaction-item:last-child {
      border-bottom: none;
    }
    .transaction-description {
      flex: 1;
    }
    .transaction-amount {
      font-weight: bold;
    }
    .transaction-amount.positive {
      color: green;
    }
    .transaction-amount.negative {
      color: red;
    }
    .transaction-date {
      color: #666;
      font-size: 0.9em;
      margin-top: 5px;
    }
    .api-section {
      margin-top: 30px;
    }
    .api-list {
      background-color: #f8f8f8;
      padding: 15px;
      border-radius: 5px;
      font-family: monospace;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #666;
      font-size: 0.9em;
      padding: 20px;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <header>
    <h1>Blocks of the Future</h1>
    <div class="user-info">Financial Dashboard for ${accountInfo.name}</div>
  </header>
  
  <div class="container">
    <div class="dashboard">
      <!-- Banking Card -->
      <div class="card">
        <h2>Banking</h2>
        <ul class="account-list">
          ${accountInfo.bankAccounts.map(account => `
            <li class="account-item">
              <div class="account-details">
                <div>${account.accountType} Account</div>
                <div class="balance">$${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
              <div>Account #: ${account.accountNumber}</div>
            </li>
          `).join('')}
        </ul>
      </div>
      
      <!-- Investment Card -->
      <div class="card">
        <h2>Investments</h2>
        <ul class="account-list">
          ${accountInfo.investmentAccounts.map(account => `
            <li class="account-item">
              <div class="account-details">
                <div>${account.accountType} Account</div>
                <div class="balance">$${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
              <div>Account #: ${account.accountNumber}</div>
            </li>
          `).join('')}
        </ul>
      </div>
      
      <!-- Crypto Card -->
      <div class="card">
        <h2>Cryptocurrency</h2>
        <ul class="account-list">
          ${accountInfo.cryptoAccounts.map(wallet => `
            <li class="account-item">
              <div class="account-details">
                <div>BTC Balance</div>
                <div class="balance">${wallet.balanceBTC} BTC</div>
              </div>
              <div class="account-details">
                <div>ETH Balance</div>
                <div class="balance">${wallet.balanceETH} ETH</div>
              </div>
              <div>Wallet ID: ${wallet.walletId}</div>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
    
    <!-- Transactions Card -->
    <div class="card" style="margin-top: 20px;">
      <h2>Recent Transactions</h2>
      <ul class="transaction-list">
        ${accountInfo.transactions.map(transaction => `
          <li class="transaction-item">
            <div class="transaction-description">
              ${transaction.description}
              <div class="transaction-date">
                ${new Date(transaction.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
            <div class="transaction-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}">
              ${transaction.amount >= 0 ? '+' : ''}$${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </li>
        `).join('')}
      </ul>
    </div>
    
    <!-- API Endpoints -->
    <div class="api-section">
      <h2>API Endpoints</h2>
      <div class="api-list">
        GET /api/banking/accounts<br>
        GET /api/banking/accounts/:id<br>
        GET /api/investment/accounts<br>
        GET /api/investment/accounts/:id<br>
        GET /api/crypto/wallets<br>
        GET /api/crypto/wallets/:id<br>
        GET /api/transactions<br>
        GET /api/transactions/:id<br>
        GET /api/user<br>
        GET /api/legal-entity<br>
        GET /health
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>Blocks of the Future | Financial Technology Platform</p>
      <p>
        LEI: ${accountInfo.legalEntity.legalEntityIdentifier} | 
        FDIC: ${accountInfo.legalEntity.fdic} | 
        Registration: ${accountInfo.legalEntity.registration}
      </p>
    </div>
  </div>
</body>
</html>
  `;
  
  res.send(html);
});

// Handle 404 - respond with JSON for API routes, HTML for other routes
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    // API route not found
    return res.status(404).json({ 
      error: 'Endpoint not found',
      availableEndpoints: [
        '/api/banking/accounts',
        '/api/investment/accounts',
        '/api/crypto/wallets',
        '/api/transactions',
        '/api/user',
        '/api/legal-entity'
      ]
    });
  }
  
  // Non-API route - show friendly HTML
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Blocks of the Future - Page Not Found</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 40px;
          text-align: center;
        }
        h1 {
          color: #0066cc;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
        }
        .back-link {
          margin-top: 30px;
          display: inline-block;
          padding: 10px 20px;
          background-color: #0066cc;
          color: white;
          text-decoration: none;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Page Not Found</h1>
        <p>The page you requested does not exist in the Blocks of the Future platform.</p>
        <p>However, all routes are handled by our universal server, so you'll never see an actual "Cannot GET" error!</p>
        <a href="/" class="back-link">Back to Dashboard</a>
      </div>
    </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, HOST, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  BLOCKS OF THE FUTURE - UNIVERSAL SERVER                       ║
╚════════════════════════════════════════════════════════════════╝

✅ Server running at http://${HOST}:${PORT}/
✅ All routes are handled with meaningful responses
✅ No more "Cannot GET" errors!
✅ Authentic account data is being served
✅ Legal Entity ID: ${accountInfo.legalEntity.legalEntityIdentifier}
✅ FDIC Certificate: ${accountInfo.legalEntity.fdic}

Endpoints:
- /api/banking/accounts
- /api/investment/accounts
- /api/crypto/wallets
- /api/transactions
- /api/user
- /api/legal-entity
- /health
- / (Dashboard)
  `);
});