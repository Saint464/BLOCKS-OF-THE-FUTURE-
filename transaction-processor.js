/**
 * Blocks of the Future - Transaction Processor
 * 
 * This module handles all financial transactions across the platform,
 * including banking transfers, investment operations, and cryptocurrency
 * transactions.
 */

// Transaction database (in-memory for demonstration)
const transactions = [
  {
    id: '1001',
    type: 'BANK_TRANSFER',
    sourceAccount: '89752130',
    destinationAccount: '54376921',
    amount: 5000.00,
    currency: 'USD',
    description: 'Transfer to savings',
    status: 'COMPLETED',
    timestamp: '2025-04-20T14:30:45Z',
    fees: 0.00,
    reference: 'TRFS-789456',
    metadata: {
      initiatedBy: 'user',
      channel: 'mobile'
    }
  },
  {
    id: '1002',
    type: 'CRYPTO_PURCHASE',
    sourceAccount: '89752130',
    walletId: 'btf-wallet-954872361',
    amount: 0.25,
    cryptoCurrency: 'BTC',
    fiatAmount: 15000.00,
    fiatCurrency: 'USD',
    description: 'Bitcoin purchase',
    status: 'COMPLETED',
    timestamp: '2025-04-22T09:15:33Z',
    fees: 150.00,
    reference: 'CRYP-562389',
    metadata: {
      exchangeRate: 60000.00,
      networkFee: 0.0002,
      provider: 'BlocksFuture Exchange'
    }
  },
  {
    id: '1003',
    type: 'INVESTMENT_DEPOSIT',
    sourceAccount: '89752130',
    destinationAccount: 'INV-7829461',
    amount: 10000.00,
    currency: 'USD',
    description: 'Investment account deposit',
    status: 'COMPLETED',
    timestamp: '2025-04-23T11:45:22Z',
    fees: 0.00,
    reference: 'INVD-124578',
    metadata: {
      investmentType: 'ETF',
      allocation: 'Balanced',
      autoInvest: true
    }
  }
];

// Counter for new transaction IDs
let transactionIdCounter = 1004;

/**
 * Generate a new transaction ID
 * @returns {string} A unique transaction ID
 */
function generateTransactionId() {
  return (transactionIdCounter++).toString();
}

/**
 * Get all transactions
 * @returns {Array} Array of all transactions
 */
function getAllTransactions() {
  return [...transactions];
}

/**
 * Get transaction by ID
 * @param {string} id - Transaction ID
 * @returns {Object|null} Transaction object or null if not found
 */
function getTransactionById(id) {
  return transactions.find(tx => tx.id === id) || null;
}

/**
 * Get all transactions for a specific account
 * @param {string} accountNumber - Account number
 * @returns {Array} Array of transactions for the account
 */
function getAccountTransactions(accountNumber) {
  return transactions.filter(tx => 
    tx.sourceAccount === accountNumber || 
    tx.destinationAccount === accountNumber
  );
}

/**
 * Process a bank transfer
 * @param {Object} transferData - Transfer data
 * @param {string} transferData.sourceAccount - Source account number
 * @param {string} transferData.destinationAccount - Destination account number
 * @param {number} transferData.amount - Transfer amount
 * @param {string} transferData.currency - Currency code (default: USD)
 * @param {string} transferData.description - Transfer description
 * @returns {Object} Processed transaction
 */
function processBankTransfer({ sourceAccount, destinationAccount, amount, currency = 'USD', description = 'Bank transfer' }) {
  // Validate inputs
  if (!sourceAccount || !destinationAccount || !amount || amount <= 0) {
    throw new Error('Invalid transfer data');
  }
  
  // Create transaction object
  const transaction = {
    id: generateTransactionId(),
    type: 'BANK_TRANSFER',
    sourceAccount,
    destinationAccount,
    amount,
    currency,
    description,
    status: 'COMPLETED',
    timestamp: new Date().toISOString(),
    fees: 0.00,
    reference: `TRFS-${Math.floor(100000 + Math.random() * 900000)}`,
    metadata: {
      initiatedBy: 'user',
      channel: 'online'
    }
  };
  
  // Add to transaction database
  transactions.push(transaction);
  
  return transaction;
}

/**
 * Process an investment transaction
 * @param {Object} investmentData - Investment data
 * @param {string} investmentData.sourceAccount - Source account number
 * @param {string} investmentData.destinationAccount - Investment account number
 * @param {number} investmentData.amount - Investment amount
 * @param {string} investmentData.currency - Currency code (default: USD)
 * @param {string} investmentData.description - Investment description
 * @param {string} investmentData.investmentType - Type of investment
 * @returns {Object} Processed transaction
 */
function processInvestmentTransaction({ sourceAccount, destinationAccount, amount, currency = 'USD', description = 'Investment transaction', investmentType = 'ETF' }) {
  // Validate inputs
  if (!sourceAccount || !destinationAccount || !amount || amount <= 0) {
    throw new Error('Invalid investment data');
  }
  
  // Create transaction object
  const transaction = {
    id: generateTransactionId(),
    type: 'INVESTMENT_TRANSACTION',
    sourceAccount,
    destinationAccount,
    amount,
    currency,
    description,
    status: 'COMPLETED',
    timestamp: new Date().toISOString(),
    fees: amount * 0.001, // 0.1% fee
    reference: `INVT-${Math.floor(100000 + Math.random() * 900000)}`,
    metadata: {
      investmentType,
      allocationDate: new Date().toISOString().split('T')[0],
      autoInvest: false
    }
  };
  
  // Add to transaction database
  transactions.push(transaction);
  
  return transaction;
}

/**
 * Process a cryptocurrency transaction
 * @param {Object} cryptoData - Crypto transaction data
 * @param {string} cryptoData.walletId - Crypto wallet ID
 * @param {string} cryptoData.operation - Operation type ('buy' or 'sell')
 * @param {number} cryptoData.amount - Crypto amount
 * @param {string} cryptoData.cryptoCurrency - Cryptocurrency code (BTC, ETH, etc.)
 * @param {number} cryptoData.fiatAmount - Equivalent fiat amount
 * @param {string} cryptoData.fiatCurrency - Fiat currency code (default: USD)
 * @param {string} cryptoData.description - Transaction description
 * @returns {Object} Processed transaction
 */
function processCryptoTransaction({ walletId, operation, amount, cryptoCurrency, fiatAmount, fiatCurrency = 'USD', description = 'Crypto transaction' }) {
  // Validate inputs
  if (!walletId || !operation || !amount || amount <= 0 || !cryptoCurrency || !fiatAmount) {
    throw new Error('Invalid crypto transaction data');
  }
  
  // Ensure operation is valid
  if (operation !== 'buy' && operation !== 'sell') {
    throw new Error('Operation must be "buy" or "sell"');
  }
  
  // Define transaction type based on operation
  const type = operation === 'buy' ? 'CRYPTO_PURCHASE' : 'CRYPTO_SALE';
  
  // Calculate fee (0.5% of fiat amount)
  const fee = fiatAmount * 0.005;
  
  // Calculate exchange rate
  const exchangeRate = fiatAmount / amount;
  
  // Create transaction object
  const transaction = {
    id: generateTransactionId(),
    type,
    walletId,
    amount,
    cryptoCurrency,
    fiatAmount,
    fiatCurrency,
    description,
    status: 'COMPLETED',
    timestamp: new Date().toISOString(),
    fees: fee,
    reference: `CRYP-${Math.floor(100000 + Math.random() * 900000)}`,
    metadata: {
      operation,
      exchangeRate,
      networkFee: cryptoCurrency === 'BTC' ? 0.0002 : 0.005,
      provider: 'BlocksFuture Exchange'
    }
  };
  
  // Add source account for purchases
  if (operation === 'buy') {
    transaction.sourceAccount = '89752130'; // Default account
  }
  
  // Add destination account for sales
  if (operation === 'sell') {
    transaction.destinationAccount = '89752130'; // Default account
  }
  
  // Add to transaction database
  transactions.push(transaction);
  
  return transaction;
}

/**
 * Generate a receipt for a transaction
 * @param {string} transactionId - Transaction ID
 * @returns {Object|null} Transaction receipt or null if not found
 */
function generateTransactionReceipt(transactionId) {
  const transaction = getTransactionById(transactionId);
  
  if (!transaction) {
    return null;
  }
  
  // Format date for receipt
  const txDate = new Date(transaction.timestamp);
  const formattedDate = `${txDate.toLocaleDateString()} ${txDate.toLocaleTimeString()}`;
  
  // Create receipt object
  const receipt = {
    receiptId: `REC-${transaction.id}`,
    transactionId: transaction.id,
    transactionType: transaction.type,
    date: formattedDate,
    description: transaction.description,
    status: transaction.status,
    amount: transaction.amount,
    currency: transaction.currency || transaction.fiatCurrency,
    fees: transaction.fees,
    totalAmount: transaction.amount + transaction.fees,
    reference: transaction.reference,
    issueDate: new Date().toISOString(),
    legalEntity: {
      name: 'Blocks of the Future Financial LLC',
      identifier: '353800BF65KKDUG751Z27',
      address: '1234 Tech Avenue, New York, NY 10001, USA',
      license: 'NY-DFS-BL-2025-34891'
    }
  };
  
  // Add type-specific information
  if (transaction.type === 'BANK_TRANSFER') {
    receipt.sourceAccount = `Account ending in ${transaction.sourceAccount.slice(-4)}`;
    receipt.destinationAccount = `Account ending in ${transaction.destinationAccount.slice(-4)}`;
  } else if (transaction.type === 'CRYPTO_PURCHASE' || transaction.type === 'CRYPTO_SALE') {
    receipt.cryptoAmount = `${transaction.amount} ${transaction.cryptoCurrency}`;
    receipt.fiatAmount = `${transaction.fiatAmount} ${transaction.fiatCurrency}`;
    receipt.exchangeRate = transaction.metadata.exchangeRate;
    receipt.networkFee = transaction.metadata.networkFee;
  } else if (transaction.type === 'INVESTMENT_TRANSACTION' || transaction.type === 'INVESTMENT_DEPOSIT') {
    receipt.investmentType = transaction.metadata.investmentType;
    receipt.allocationDate = transaction.metadata.allocationDate;
  }
  
  return receipt;
}

// Export all functions
export default {
  getAllTransactions,
  getTransactionById,
  getAccountTransactions,
  processBankTransfer,
  processInvestmentTransaction,
  processCryptoTransaction,
  generateTransactionReceipt
};