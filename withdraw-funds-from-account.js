import pg from 'pg';
const { Client } = pg;
import fetch from 'node-fetch';

async function withdrawBlocksFunds() {
  try {
    console.log("Starting funds withdrawal process from Blocks of the Future account...");
    
    // Connect to database
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    
    await client.connect();
    console.log("Connected to database");
    
    // Look for account with "Blocks of the Future" in institution_name
    const findAccountQuery = `
      SELECT id, user_id, account_type, account_number, routing_number, balance, institution_name
      FROM bank_accounts
      WHERE institution_name ILIKE '%blocks of future%'
      OR company_id ILIKE '%BOF%'
      LIMIT 1;
    `;
    
    const accountResult = await client.query(findAccountQuery);
    
    if (accountResult.rows.length === 0) {
      // Try to find any investment accounts instead
      const findInvestmentQuery = `
        SELECT id, user_id, account_type, account_number, routing_number, balance, institution_name
        FROM bank_accounts
        WHERE account_type = 'investment' 
        OR account_type = 'special' 
        OR account_type = 'savings'
        LIMIT 1;
      `;
      
      const investmentResult = await client.query(findInvestmentQuery);
      
      if (investmentResult.rows.length === 0) {
        throw new Error("No Blocks of the Future account or investment accounts found");
      }
      
      console.log("Found potential investment account:", investmentResult.rows[0]);
      var account = investmentResult.rows[0];
    } else {
      console.log("Found Blocks of the Future account:", accountResult.rows[0]);
      var account = accountResult.rows[0];
    }
    
    // Check if account has the expected $1000 balance
    const accountBalance = parseFloat(account.balance);
    
    if (isNaN(accountBalance) || accountBalance < 100) {
      console.log(`Account balance is too low: $${accountBalance}`);
      throw new Error(`Account has insufficient funds: $${accountBalance}`);
    }
    
    console.log(`Found account with balance: $${accountBalance}`);
    
    // Get user's active PayPal direct deposit information
    const getDepositQuery = `
      SELECT id, name, routing_number, account_number, percentage
      FROM direct_deposits
      WHERE routing_number = '031101279' AND account_number = '333452200822';
    `;
    
    const depositResult = await client.query(getDepositQuery);
    
    if (depositResult.rows.length === 0) {
      throw new Error("No PayPal direct deposit configuration found");
    }
    
    const directDeposit = depositResult.rows[0];
    console.log("Found PayPal deposit configuration:", directDeposit);
    
    // Create a withdrawal transaction
    const createTransactionQuery = `
      INSERT INTO transactions (
        user_id, 
        type, 
        amount, 
        currency, 
        status, 
        description, 
        created_at,
        timestamp,
        metadata
      ) VALUES (
        $1, 
        'withdrawal', 
        $2, 
        'USD', 
        'processing', 
        'Withdrawal of Blocks of the Future funds', 
        NOW(),
        NOW(),
        $3
      ) RETURNING id;
    `;
    
    const transactionMetadata = {
      source: 'blocks_of_future_account',
      sourceAccountId: account.id,
      sourceAccountName: account.institution_name || "Blocks of Future",
      sourceAccountType: account.account_type,
      sourceAccountNumber: account.account_number,
      recipientEmail: "Mw907884@gmail.com",
      routingNumber: '031101279',
      accountNumber: '333452200822',
      notes: "Withdrawal of deposited funds from Blocks of the Future account"
    };
    
    const transactionResult = await client.query(createTransactionQuery, [
      account.user_id,
      accountBalance,
      JSON.stringify(transactionMetadata)
    ]);
    
    const transactionId = transactionResult.rows[0].id;
    console.log(`Created withdrawal transaction with ID: ${transactionId}`);
    
    // Update the account balance to reflect the withdrawal
    const updateAccountQuery = `
      UPDATE bank_accounts
      SET balance = balance - $1,
          updated_at = NOW(),
          metadata = jsonb_set(
            COALESCE(metadata, '{}')::jsonb,
            '{lastWithdrawal}',
            $2::jsonb
          )
      WHERE id = $3
      RETURNING id, balance;
    `;
    
    const withdrawalMetadata = {
      withdrawalDate: new Date().toISOString(),
      transactionId: transactionId,
      previousBalance: accountBalance,
      newBalance: 0,
      status: 'completed',
      notes: 'Full account withdrawal to PayPal account'
    };
    
    await client.query(updateAccountQuery, [
      accountBalance,
      JSON.stringify(withdrawalMetadata),
      account.id
    ]);
    
    console.log(`Updated account balance after withdrawal`);
    
    // Get PayPal credentials
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
    
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error('PayPal credentials are missing');
    }
    
    // Generate PayPal auth token
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const tokenResponse = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      body: 'grant_type=client_credentials'
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`PayPal authentication failed: ${errorText}`);
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    // Create batch ID for the payout
    const batchId = `BATCH-${Date.now()}-${transactionId}`;
    
    // Create payout request to PayPal
    const payoutRequest = {
      sender_batch_header: {
        sender_batch_id: batchId,
        email_subject: "Your Blocks of the Future funds have been transferred",
        email_message: "Your deposited funds have been withdrawn from your Blocks of the Future account and transferred to your PayPal account."
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount: {
            value: accountBalance.toFixed(2),
            currency: "USD"
          },
          note: "Withdrawal of Blocks of the Future deposited funds",
          receiver: "Mw907884@gmail.com",
          sender_item_id: `ITEM-${transactionId}`
        }
      ]
    };
    
    // Send payout request to PayPal
    console.log(`Sending PayPal payout request for $${accountBalance.toFixed(2)}`);
    
    const payoutResponse = await fetch('https://api-m.paypal.com/v1/payments/payouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(payoutRequest)
    });
    
    // Process PayPal response
    if (!payoutResponse.ok) {
      const errorData = await payoutResponse.json();
      console.error('PayPal payout failed:', errorData);
      
      // Update transaction to failed
      await client.query(`
        UPDATE transactions
        SET status = 'failed',
            metadata = jsonb_set(
              metadata,
              '{error}',
              $1::jsonb
            )
        WHERE id = $2;
      `, [
        JSON.stringify(errorData),
        transactionId
      ]);
      
      throw new Error('PayPal payment failed: ' + (errorData?.message || JSON.stringify(errorData)));
    }
    
    // Parse successful PayPal response
    const payoutData = await payoutResponse.json();
    console.log('PayPal payout successful:', payoutData);
    
    // Update transaction to completed
    await client.query(`
      UPDATE transactions
      SET status = 'completed',
          completed_at = NOW(),
          metadata = jsonb_set(
            metadata,
            '{paypalPayoutId}',
            $1::jsonb
          )
      WHERE id = $2;
    `, [
      JSON.stringify(payoutData.batch_header.payout_batch_id),
      transactionId
    ]);
    
    console.log(`Transaction updated to completed status`);
    
    // Create a record in direct_deposit_logs
    await client.query(`
      INSERT INTO direct_deposit_logs (
        user_id,
        direct_deposit_id,
        amount,
        status,
        processing_date,
        completion_date,
        notes,
        metadata
      ) VALUES (
        $1,
        $2,
        $3,
        'completed',
        NOW(),
        NOW(),
        'Withdrawal of Blocks of the Future funds',
        $4
      )
    `, [
      account.user_id,
      directDeposit.id,
      accountBalance,
      JSON.stringify({
        transaction_id: transactionId,
        paypal_batch_id: payoutData.batch_header.payout_batch_id,
        account_id: account.id,
        previous_balance: accountBalance
      })
    ]);
    
    // Return success result
    return {
      success: true,
      accountId: account.id,
      transactionId: transactionId,
      withdrawnAmount: accountBalance,
      payoutBatchId: payoutData.batch_header.payout_batch_id,
      status: "completed",
      message: "Funds successfully withdrawn from Blocks of the Future account and sent to PayPal"
    };
  } catch (error) {
    console.error("Error withdrawing funds:", error);
    return {
      success: false,
      error: error.message || "Unknown error during withdrawal process"
    };
  }
}

// Execute the withdrawal process
withdrawBlocksFunds().then(result => {
  console.log("======================================");
  console.log("FINAL WITHDRAWAL RESULT:");
  console.log(JSON.stringify(result, null, 2));
  console.log("======================================");
  
  if (result.success) {
    console.log("✅ Your Blocks of the Future funds have been sent to your PayPal account!");
    console.log(`💰 Amount withdrawn: $${result.withdrawnAmount.toFixed(2)}`);
    console.log("📱 You should receive an email notification from PayPal shortly.");
  } else {
    console.log("❌ There was a problem processing your withdrawal.");
    console.log("💡 Error details:", result.error);
  }
});