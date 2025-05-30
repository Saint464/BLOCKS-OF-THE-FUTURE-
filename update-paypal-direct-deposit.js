/**
 * Update PayPal Direct Deposit Account Information
 * 
 * This script updates the PayPal direct deposit configuration to use your PayPal account
 * with routing and account numbers.
 */

import { neonConfig, neon } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'fs';

// Configure neon to use ws for WebSocket
neonConfig.webSocketConstructor = ws;

async function updatePayPalDirectDeposit() {
  try {
    console.log('Updating PayPal direct deposit information...');
    
    // PayPal account details
    const routingNumber = '031101279';
    const accountNumber = '333452200822';
    const paypalEmail = 'Mw907884@gmail.com'; // Keep using the same email
    
    // Connect to the database
    const sql = neon(process.env.DATABASE_URL);
    
    // First, let's update any existing PayPal direct deposit configurations
    console.log('Checking for existing PayPal direct deposits...');
    const existingDepositsResult = await sql`
      SELECT * FROM direct_deposits 
      WHERE account_number LIKE ${'PAYPAL-%'}
      AND user_id = 1
      ORDER BY created_at DESC
    `;
    
    const now = new Date();
    
    if (existingDepositsResult.length > 0) {
      console.log(`Found ${existingDepositsResult.length} existing PayPal direct deposit(s)`);
      
      // Deactivate all existing PayPal direct deposits
      await sql`
        UPDATE direct_deposits
        SET active = false,
            updated_at = ${now}
        WHERE account_number LIKE ${'PAYPAL-%'}
        AND user_id = 1
      `;
      console.log('Deactivated existing PayPal direct deposits');
    }
    
    // Create a unique ID for the direct deposit
    const directDepositId = `PAYPAL-${Date.now()}`;
    
    // Create the new PayPal direct deposit record with account and routing numbers
    console.log('Creating new PayPal direct deposit record with account and routing numbers...');
    const newDepositResult = await sql`
      INSERT INTO direct_deposits
      (id, user_id, name, account_number, routing_number, bank_name, percentage, 
       active, created_at, updated_at, metadata)
      VALUES
      (${directDepositId}, 1, 'PayPal Direct Deposit', ${accountNumber}, ${routingNumber}, 
       ${'PayPal'}, 100, true, ${now}, ${now}, 
       ${JSON.stringify({
         paypal_email: paypalEmail,
         account_type: 'checking',
         setupDate: now.toISOString(),
         paypal_routing_number: routingNumber,
         paypal_account_number: accountNumber
       })})
      RETURNING *
    `;
    
    if (newDepositResult.length === 0) {
      throw new Error('Failed to create PayPal direct deposit record');
    }
    
    const newDeposit = newDepositResult[0];
    console.log(`Created new PayPal direct deposit record: ${newDeposit.id}`);
    
    // Update the direct deposit scheduler to use the new direct deposit
    try {
      // Check if direct_deposit_scheduler table exists
      const schedulerResult = await sql`
        SELECT * FROM direct_deposit_scheduler
        WHERE user_id = 1
        AND active = true
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      if (schedulerResult.length > 0) {
        // Update existing scheduler
        await sql`
          UPDATE direct_deposit_scheduler
          SET direct_deposit_id = ${newDeposit.id},
              updated_at = ${now}
          WHERE id = ${schedulerResult[0].id}
        `;
        console.log(`Updated direct deposit scheduler record: ${schedulerResult[0].id}`);
      } else {
        // Create a new scheduler record
        const newSchedulerResult = await sql`
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
          RETURNING *
        `;
        
        if (newSchedulerResult.length > 0) {
          console.log(`Created new direct deposit scheduler record: ${newSchedulerResult[0].id}`);
        }
      }
    } catch (error) {
      console.error('Error updating scheduler:', error);
      
      // Try creating the scheduler table if it doesn't exist
      console.log('Creating direct_deposit_scheduler table...');
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
      
      // Try creating the scheduler again
      const newSchedulerResult = await sql`
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
        RETURNING *
      `;
      
      if (newSchedulerResult.length > 0) {
        console.log(`Created new direct deposit scheduler record: ${newSchedulerResult[0].id}`);
      }
    }
    
    // Save the update to a file for verification
    fs.writeFileSync('paypal-direct-deposit-update-result.json', JSON.stringify({
      success: true,
      timestamp: now.toISOString(),
      paypalDirectDeposit: {
        id: newDeposit.id,
        email: paypalEmail,
        accountNumber: accountNumber.substring(0, 4) + '****' + accountNumber.substring(accountNumber.length - 4),
        routingNumber: routingNumber,
        bankName: 'PayPal'
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
    console.log('PAYPAL DIRECT DEPOSIT UPDATED SUCCESSFULLY');
    console.log('=================================================');
    console.log(`PayPal Email: ${paypalEmail}`);
    console.log(`Routing Number: ${routingNumber}`);
    console.log(`Account Number: ${accountNumber.substring(0, 4)}****${accountNumber.substring(accountNumber.length - 4)}`);
    console.log(`Weekly Amount: $4,116.00 (every Monday at 9 AM)`);
    console.log(`Direct Deposit ID: ${newDeposit.id}`);
    console.log(`Update details saved to paypal-direct-deposit-update-result.json`);
    console.log('=================================================');
    
  } catch (error) {
    console.error('Error updating PayPal direct deposit:', error);
    process.exit(1);
  }
}

// Run the update
updatePayPalDirectDeposit();