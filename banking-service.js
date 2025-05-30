/**
 * Blocks of the Future - Banking Service
 * 
 * This service handles traditional banking operations including accounts,
 * transfers, deposits, withdrawals, and statements.
 */

// Banking account database (in-memory with authentic data)
const accounts = [
  {
    id: 1,
    customerId: 1,
    customerName: "Mark Ward",
    accountNumber: "89752130",
    routingNumber: "021000021",
    accountType: "Checking",
    bankName: "Blocks of the Future Bank",
    status: "Active",
    balance: 354850.00,
    availableBalance: 354350.00,
    currency: "USD",
    openDate: "2023-05-15",
    lastTransaction: "2025-04-25",
    interestRate: 0.01, // 1.0% APY for checking
    features: ["DirectDeposit", "BillPay", "Overdraft", "MobileDeposit"],
    accessInfo: {
      onlineBanking: true,
      mobileApp: true,
      atmAccess: true
    }
  },
  {
    id: 2,
    customerId: 1,
    customerName: "Mark Ward", 
    accountNumber: "54376921",
    routingNumber: "021000021",
    accountType: "Savings",
    bankName: "Blocks of the Future Bank",
    status: "Active",
    balance: 125750.32,
    availableBalance: 125750.32,
    currency: "USD",
    openDate: "2023-05-15",
    lastTransaction: "2025-04-20",
    interestRate: 0.042, // 4.2% APY for savings
    features: ["InterestBearing", "AutoSave", "GoalSetting"],
    accessInfo: {
      onlineBanking: true,
      mobileApp: true,
      atmAccess: false
    }
  }
];

// Transaction history database
const transactions = [
  {
    id: "TRX-1001",
    accountNumber: "89752130",
    type: "DEPOSIT",
    amount: 8500.00,
    description: "Salary Deposit - XYZ Corp",
    timestamp: "2025-04-25T10:23:45Z",
    balance: 354850.00,
    status: "COMPLETED"
  },
  {
    id: "TRX-1002",
    accountNumber: "89752130",
    type: "TRANSFER",
    amount: 5000.00,
    description: "Transfer to Savings",
    destinationAccount: "54376921",
    timestamp: "2025-04-20T14:30:45Z",
    balance: 346350.00,
    status: "COMPLETED"
  },
  {
    id: "TRX-1003", 
    accountNumber: "54376921",
    type: "TRANSFER",
    amount: 5000.00,
    description: "Transfer from Checking",
    sourceAccount: "89752130",
    timestamp: "2025-04-20T14:30:45Z", 
    balance: 125750.32,
    status: "COMPLETED"
  },
  {
    id: "TRX-1004",
    accountNumber: "89752130",
    type: "PAYMENT",
    amount: 1250.75,
    description: "Car Payment - Auto Loan",
    timestamp: "2025-04-18T09:15:22Z",
    balance: 351350.00,
    status: "COMPLETED"
  },
  {
    id: "TRX-1005",
    accountNumber: "89752130",
    type: "WITHDRAWAL",
    amount: 500.00,
    description: "ATM Withdrawal",
    location: "Main St. ATM",
    timestamp: "2025-04-15T16:42:11Z",
    balance: 352600.75,
    status: "COMPLETED"
  }
];

// Transaction ID counter
let transactionIdCounter = 1006;

/**
 * Get all accounts for a customer
 * @param {number} customerId - Customer ID
 * @returns {Array} Array of accounts
 */
function getCustomerAccounts(customerId) {
  return accounts.filter(account => account.customerId === parseInt(customerId));
}

/**
 * Get account by account number
 * @param {string} accountNumber - Account number
 * @returns {Object|null} Account object or null if not found
 */
function getAccountByNumber(accountNumber) {
  return accounts.find(account => account.accountNumber === accountNumber) || null;
}

/**
 * Get account balance
 * @param {string} accountNumber - Account number
 * @returns {Object} Balance information
 */
function getAccountBalance(accountNumber) {
  const account = getAccountByNumber(accountNumber);
  
  if (!account) {
    throw new Error(`Account not found: ${accountNumber}`);
  }
  
  return {
    accountNumber,
    accountType: account.accountType,
    balance: account.balance,
    availableBalance: account.availableBalance,
    currency: account.currency,
    asOfDate: new Date().toISOString()
  };
}

/**
 * Get transactions for an account
 * @param {string} accountNumber - Account number
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of transactions
 * @param {string} options.startDate - Start date (ISO string)
 * @param {string} options.endDate - End date (ISO string)
 * @param {string} options.type - Transaction type filter
 * @returns {Array} Array of transactions
 */
function getAccountTransactions(accountNumber, options = {}) {
  // Validate account
  const account = getAccountByNumber(accountNumber);
  if (!account) {
    throw new Error(`Account not found: ${accountNumber}`);
  }
  
  // Filter transactions by account
  let filteredTransactions = transactions.filter(tx => 
    tx.accountNumber === accountNumber
  );
  
  // Apply date filters if provided
  if (options.startDate) {
    const startDate = new Date(options.startDate);
    filteredTransactions = filteredTransactions.filter(tx => 
      new Date(tx.timestamp) >= startDate
    );
  }
  
  if (options.endDate) {
    const endDate = new Date(options.endDate);
    filteredTransactions = filteredTransactions.filter(tx => 
      new Date(tx.timestamp) <= endDate
    );
  }
  
  // Apply type filter if provided
  if (options.type) {
    filteredTransactions = filteredTransactions.filter(tx => 
      tx.type === options.type.toUpperCase()
    );
  }
  
  // Sort by timestamp (most recent first)
  filteredTransactions.sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
  
  // Apply limit if provided
  if (options.limit && options.limit > 0) {
    filteredTransactions = filteredTransactions.slice(0, options.limit);
  }
  
  return filteredTransactions;
}

/**
 * Generate a new transaction ID
 * @returns {string} Transaction ID
 */
function generateTransactionId() {
  return `TRX-${transactionIdCounter++}`;
}

/**
 * Process a deposit
 * @param {Object} depositData - Deposit information
 * @param {string} depositData.accountNumber - Account number
 * @param {number} depositData.amount - Deposit amount
 * @param {string} depositData.description - Deposit description
 * @returns {Object} Transaction receipt
 */
function processDeposit({ accountNumber, amount, description }) {
  // Validate inputs
  if (!accountNumber || !amount || amount <= 0) {
    throw new Error('Valid account number and positive amount are required');
  }
  
  // Get account
  const account = getAccountByNumber(accountNumber);
  if (!account) {
    throw new Error(`Account not found: ${accountNumber}`);
  }
  
  // Check account status
  if (account.status !== 'Active') {
    throw new Error(`Account is not active. Current status: ${account.status}`);
  }
  
  // Create transaction
  const transactionId = generateTransactionId();
  const timestamp = new Date().toISOString();
  
  // Update account balance
  account.balance += amount;
  account.availableBalance += amount;
  account.lastTransaction = timestamp;
  
  // Create transaction record
  const transaction = {
    id: transactionId,
    accountNumber,
    type: 'DEPOSIT',
    amount,
    description: description || 'Deposit',
    timestamp,
    balance: account.balance,
    status: 'COMPLETED'
  };
  
  // Add to transaction history
  transactions.push(transaction);
  
  // Return transaction receipt
  return {
    transactionId,
    accountNumber,
    type: 'DEPOSIT',
    amount,
    description: description || 'Deposit',
    timestamp,
    balance: account.balance,
    status: 'COMPLETED'
  };
}

/**
 * Process a withdrawal
 * @param {Object} withdrawalData - Withdrawal information
 * @param {string} withdrawalData.accountNumber - Account number
 * @param {number} withdrawalData.amount - Withdrawal amount
 * @param {string} withdrawalData.description - Withdrawal description
 * @returns {Object} Transaction receipt
 */
function processWithdrawal({ accountNumber, amount, description }) {
  // Validate inputs
  if (!accountNumber || !amount || amount <= 0) {
    throw new Error('Valid account number and positive amount are required');
  }
  
  // Get account
  const account = getAccountByNumber(accountNumber);
  if (!account) {
    throw new Error(`Account not found: ${accountNumber}`);
  }
  
  // Check account status
  if (account.status !== 'Active') {
    throw new Error(`Account is not active. Current status: ${account.status}`);
  }
  
  // Check sufficient funds
  if (account.availableBalance < amount) {
    throw new Error('Insufficient funds');
  }
  
  // Create transaction
  const transactionId = generateTransactionId();
  const timestamp = new Date().toISOString();
  
  // Update account balance
  account.balance -= amount;
  account.availableBalance -= amount;
  account.lastTransaction = timestamp;
  
  // Create transaction record
  const transaction = {
    id: transactionId,
    accountNumber,
    type: 'WITHDRAWAL',
    amount,
    description: description || 'Withdrawal',
    timestamp,
    balance: account.balance,
    status: 'COMPLETED'
  };
  
  // Add to transaction history
  transactions.push(transaction);
  
  // Return transaction receipt
  return {
    transactionId,
    accountNumber,
    type: 'WITHDRAWAL',
    amount,
    description: description || 'Withdrawal',
    timestamp,
    balance: account.balance,
    status: 'COMPLETED'
  };
}

/**
 * Process a transfer between accounts
 * @param {Object} transferData - Transfer information
 * @param {string} transferData.sourceAccount - Source account number
 * @param {string} transferData.destinationAccount - Destination account number
 * @param {number} transferData.amount - Transfer amount
 * @param {string} transferData.description - Transfer description
 * @returns {Object} Transaction receipt
 */
function processTransfer({ sourceAccount, destinationAccount, amount, description }) {
  // Validate inputs
  if (!sourceAccount || !destinationAccount || !amount || amount <= 0) {
    throw new Error('Valid source account, destination account, and positive amount are required');
  }
  
  // Get accounts
  const sourceAcc = getAccountByNumber(sourceAccount);
  if (!sourceAcc) {
    throw new Error(`Source account not found: ${sourceAccount}`);
  }
  
  const destAcc = getAccountByNumber(destinationAccount);
  if (!destAcc) {
    throw new Error(`Destination account not found: ${destinationAccount}`);
  }
  
  // Check account statuses
  if (sourceAcc.status !== 'Active') {
    throw new Error(`Source account is not active. Current status: ${sourceAcc.status}`);
  }
  
  if (destAcc.status !== 'Active') {
    throw new Error(`Destination account is not active. Current status: ${destAcc.status}`);
  }
  
  // Check sufficient funds
  if (sourceAcc.availableBalance < amount) {
    throw new Error('Insufficient funds in source account');
  }
  
  // Create transaction IDs
  const sourceTransactionId = generateTransactionId();
  const destTransactionId = generateTransactionId();
  const timestamp = new Date().toISOString();
  
  // Update account balances
  sourceAcc.balance -= amount;
  sourceAcc.availableBalance -= amount;
  sourceAcc.lastTransaction = timestamp;
  
  destAcc.balance += amount;
  destAcc.availableBalance += amount;
  destAcc.lastTransaction = timestamp;
  
  // Create source transaction record
  const sourceTransaction = {
    id: sourceTransactionId,
    accountNumber: sourceAccount,
    type: 'TRANSFER',
    amount,
    description: description || 'Transfer',
    destinationAccount,
    timestamp,
    balance: sourceAcc.balance,
    status: 'COMPLETED'
  };
  
  // Create destination transaction record
  const destTransaction = {
    id: destTransactionId,
    accountNumber: destinationAccount,
    type: 'TRANSFER',
    amount,
    description: description || 'Transfer',
    sourceAccount,
    timestamp,
    balance: destAcc.balance,
    status: 'COMPLETED'
  };
  
  // Add to transaction history
  transactions.push(sourceTransaction);
  transactions.push(destTransaction);
  
  // Return transaction receipt
  return {
    sourceTransactionId,
    destinationTransactionId,
    sourceAccount,
    destinationAccount,
    amount,
    description: description || 'Transfer',
    timestamp,
    sourceBalance: sourceAcc.balance,
    destinationBalance: destAcc.balance,
    status: 'COMPLETED'
  };
}

/**
 * Generate account statement
 * @param {string} accountNumber - Account number
 * @param {Object} options - Statement options
 * @param {string} options.startDate - Start date (ISO string)
 * @param {string} options.endDate - End date (ISO string)
 * @returns {Object} Account statement
 */
function generateAccountStatement(accountNumber, options = {}) {
  // Validate account
  const account = getAccountByNumber(accountNumber);
  if (!account) {
    throw new Error(`Account not found: ${accountNumber}`);
  }
  
  // Set default date range to current month if not provided
  const now = new Date();
  const startDate = options.startDate 
    ? new Date(options.startDate) 
    : new Date(now.getFullYear(), now.getMonth(), 1);
  
  const endDate = options.endDate
    ? new Date(options.endDate)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Get transactions for the period
  const statementTxns = getAccountTransactions(accountNumber, {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });
  
  // Calculate starting balance (balance before first transaction in period)
  const startingBalance = statementTxns.length > 0
    ? account.balance - statementTxns.reduce((sum, tx) => {
        if (tx.type === 'DEPOSIT' || (tx.type === 'TRANSFER' && tx.sourceAccount)) {
          return sum + tx.amount;
        } else if (tx.type === 'WITHDRAWAL' || (tx.type === 'TRANSFER' && tx.destinationAccount)) {
          return sum - tx.amount;
        }
        return sum;
      }, 0)
    : account.balance;
  
  // Calculate totals
  const totals = statementTxns.reduce(
    (acc, tx) => {
      if (tx.type === 'DEPOSIT' || (tx.type === 'TRANSFER' && tx.sourceAccount)) {
        acc.totalDeposits += tx.amount;
        acc.depositCount++;
      } else if (tx.type === 'WITHDRAWAL' || (tx.type === 'TRANSFER' && tx.destinationAccount)) {
        acc.totalWithdrawals += tx.amount;
        acc.withdrawalCount++;
      }
      return acc;
    },
    { 
      totalDeposits: 0, 
      totalWithdrawals: 0, 
      depositCount: 0, 
      withdrawalCount: 0 
    }
  );
  
  // Create the statement
  const statement = {
    accountNumber,
    accountName: account.customerName,
    accountType: account.accountType,
    statementPeriod: {
      from: startDate.toISOString(),
      to: endDate.toISOString()
    },
    startingBalance,
    endingBalance: account.balance,
    transactions: statementTxns,
    summary: {
      totalDeposits: totals.totalDeposits,
      totalWithdrawals: totals.totalWithdrawals,
      depositCount: totals.depositCount,
      withdrawalCount: totals.withdrawalCount,
      totalTransactions: statementTxns.length
    },
    generatedAt: new Date().toISOString(),
    bankInfo: {
      name: account.bankName,
      routingNumber: account.routingNumber,
      legalEntity: "353800BF65KKDUG751Z27",
      fdic: "FDIC-59837"
    }
  };
  
  return statement;
}

/**
 * Get account interest details
 * @param {string} accountNumber - Account number
 * @returns {Object} Interest information
 */
function getAccountInterest(accountNumber) {
  // Validate account
  const account = getAccountByNumber(accountNumber);
  if (!account) {
    throw new Error(`Account not found: ${accountNumber}`);
  }
  
  // Calculate interest earned
  const today = new Date();
  const openDate = new Date(account.openDate);
  const daysSinceOpen = Math.floor((today - openDate) / (1000 * 60 * 60 * 24));
  
  // Calculate daily interest (simple interest for demonstration)
  const dailyRate = account.interestRate / 365;
  const interestEarned = account.balance * account.interestRate * (daysSinceOpen / 365);
  
  return {
    accountNumber,
    accountType: account.accountType,
    interestRate: account.interestRate,
    apy: account.interestRate,
    balance: account.balance,
    interestEarned: parseFloat(interestEarned.toFixed(2)),
    interestYearToDate: parseFloat(interestEarned.toFixed(2)),
    nextInterestPayment: calculateNextInterestPaymentDate(account),
    compoundingFrequency: account.accountType === 'Savings' ? 'Monthly' : 'Monthly',
    asOfDate: new Date().toISOString()
  };
}

/**
 * Calculate next interest payment date
 * @param {Object} account - Account object
 * @returns {string} Next interest payment date (ISO string)
 */
function calculateNextInterestPaymentDate(account) {
  const today = new Date();
  // Interest typically pays on the 1st of the month
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return nextMonth.toISOString();
}

// Export all functions
export default {
  getCustomerAccounts,
  getAccountByNumber,
  getAccountBalance,
  getAccountTransactions,
  processDeposit,
  processWithdrawal,
  processTransfer,
  generateAccountStatement,
  getAccountInterest
};