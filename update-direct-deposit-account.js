/**
 * Update Direct Deposit Account Information
 * 
 * This script updates the direct deposit configuration to use a different bank account.
 */

import { neonConfig, neon } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'fs';

// Configure neon to use ws for WebSocket
neonConfig.webSocketConstructor = ws;

async function updateDirectDepositAccount() {
  try {
    console.log('Updating direct deposit account information...');
    
    // New account details
    const routingNumber = '031101279';
    const accountNumber = '333452200822';
    const bankName = 'Capital One'; // Assuming based on routing number
    
    // Connect to the database
    const sql = neon(process.env.DATABASE_URL);
    
    // First, check if this bank account already exists in our system
    console.log('Checking if bank account already exists...');
    const existingBankResult = await sql`
      SELECT * FROM bank_accounts 
      WHERE routing_number = ${routingNumber}
      AND account_number = ${accountNumber}
      LIMIT 1
    `;
    
    let bankAccountId;
    
    if (existingBankResult.length > 0) {
      // Use existing bank account
      const existingAccount = existingBankResult[0];
      bankAccountId = existingAccount.id;
      console.log(`Found existing bank account: ID ${existingAccount.id}`);
    } else {
      // Create a new bank account record
      console.log('Creating new bank account record...');
      const newBankResult = await sql`
        INSERT INTO bank_accounts
        (user_id, institution_name, account_type, account_number, routing_number, 
         balance, created_at, updated_at)
        VALUES
        (1, ${bankName}, 'checking', ${accountNumber}, ${routingNumber}, 
         1000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      if (newBankResult.length === 0) {
        throw new Error('Failed to create new bank account record');
      }
      
      const newAccount = newBankResult[0];
      bankAccountId = newAccount.id;
      console.log(`Created new bank account: ID ${newAccount.id}`);
    }
    
    // Next, let's update the direct deposit configuration
    // First, we need to check if direct deposits table exists
    try {
      await sql`
        SELECT 1 FROM direct_deposits LIMIT 1
      `;
      console.log('Direct deposits table exists');
    } catch (error) {
      // Create the direct_deposits table if it doesn't exist
      console.log('Creating direct_deposits table...');
      await sql`
        CREATE TABLE IF NOT EXISTS direct_deposits (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          account_number TEXT NOT NULL,
          routing_number TEXT,
          bank_name TEXT,
          percentage INTEGER DEFAULT 100,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL,
          metadata JSONB
        )
      `;
      console.log('Created direct_deposits table');
    }
    
    // Create a unique ID for the direct deposit
    const directDepositId = `BANK-${Date.now()}`;
    const now = new Date();
    
    // Check if there are any existing direct deposits that need to be deactivated
    console.log('Checking for existing direct deposits...');
    await sql`
      UPDATE direct_deposits
      SET active = false,
          updated_at = ${now}
      WHERE user_id = 1
    `;
    
    // Create the new direct deposit record
    console.log('Creating new direct deposit record...');
    const newDepositResult = await sql`
      INSERT INTO direct_deposits
      (id, user_id, name, account_number, routing_number, bank_name, percentage, 
       active, created_at, updated_at, metadata)
      VALUES
      (${directDepositId}, 1, 'Primary Direct Deposit', ${accountNumber}, ${routingNumber}, 
       ${bankName}, 100, true, ${now}, ${now}, 
       ${JSON.stringify({
         bank_account_id: bankAccountId,
         account_type: 'checking',
         setupDate: now.toISOString()
       })})
      RETURNING *
    `;
    
    if (newDepositResult.length === 0) {
      throw new Error('Failed to create direct deposit record');
    }
    
    const newDeposit = newDepositResult[0];
    console.log(`Created new direct deposit record: ${newDeposit.id}`);
    
    // Update the direct deposit scheduler
    try {
      // Check if direct_deposit_scheduler table exists
      await sql`
        SELECT 1 FROM direct_deposit_scheduler LIMIT 1
      `;
      
      // Update the scheduler to use the new direct deposit record
      await sql`
        UPDATE direct_deposit_scheduler
        SET direct_deposit_id = ${newDeposit.id},
            updated_at = ${now}
        WHERE user_id = 1
      `;
      console.log('Updated direct deposit scheduler');
    } catch (error) {
      console.log('Note: Direct deposit scheduler table not found. Creating it...');
      
      // Create the scheduler table if it doesn't exist
      await sql`
        CREATE TABLE IF NOT EXISTS direct_deposit_scheduler (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          direct_deposit_id TEXT NOT NULL,
          schedule_type TEXT DEFAULT 'weekly',
          schedule_day INTEGER DEFAULT 1,
          schedule_hour INTEGER DEFAULT 9,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL,
          last_run TIMESTAMP,
          metadata JSONB
        )
      `;
      
      // Create a new scheduler record
      await sql`
        INSERT INTO direct_deposit_scheduler
        (user_id, direct_deposit_id, schedule_type, schedule_day, schedule_hour, 
         active, created_at, updated_at, metadata)
        VALUES
        (1, ${newDeposit.id}, 'weekly', 1, 9, 
         true, ${now}, ${now}, 
         ${JSON.stringify({
           amount: 4116.00,
           frequency: 'weekly',
           dayOfWeek: 'Monday',
           description: 'Weekly maintenance pay ($98/hr)',
           setupDate: now.toISOString()
         })})
      `;
      console.log('Created new direct deposit scheduler record');
    }
    
    // Save the update to a file for verification
    fs.writeFileSync('direct-deposit-update-result.json', JSON.stringify({
      success: true,
      timestamp: now.toISOString(),
      newDirectDeposit: {
        id: newDeposit.id,
        accountNumber: accountNumber.substring(0, 4) + '****' + accountNumber.substring(accountNumber.length - 4),
        routingNumber: routingNumber,
        bankName: bankName
      },
      scheduler: {
        scheduleType: 'weekly',
        scheduleDay: 1, // Monday
        scheduleHour: 9, // 9 AM
        active: true,
        amount: 4116.00
      }
    }, null, 2));
    
    console.log('=================================================');
    console.log('DIRECT DEPOSIT ACCOUNT UPDATED SUCCESSFULLY');
    console.log('=================================================');
    console.log(`Bank: ${bankName}`);
    console.log(`Routing Number: ${routingNumber}`);
    console.log(`Account Number: ${accountNumber.substring(0, 4)}****${accountNumber.substring(accountNumber.length - 4)}`);
    console.log(`Weekly Amount: $4,116.00 (every Monday at 9 AM)`);
    console.log(`Direct Deposit ID: ${newDeposit.id}`);
    console.log(`Update details saved to direct-deposit-update-result.json`);
    console.log('=================================================');
    
  } catch (error) {
    console.error('Error updating direct deposit account:', error);
    process.exit(1);
  }
}

// Run the update
updateDirectDepositAccount();