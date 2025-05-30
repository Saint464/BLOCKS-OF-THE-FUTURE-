// Verify payment status in database
import pg from 'pg';
const { Client } = pg;

async function verifyPaymentStatus() {
  try {
    console.log("Checking payment status in database...");
    
    // Connect to database
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    
    await client.connect();
    console.log("Connected to database");
    
    // Get the transaction status
    const getTransactionQuery = `
      SELECT id, amount, description, status, metadata, created_at, completed_at
      FROM transactions
      WHERE id = 186;
    `;
    
    const transactionResult = await client.query(getTransactionQuery);
    
    if (transactionResult.rows.length === 0) {
      throw new Error("Transaction not found");
    }
    
    const transaction = transactionResult.rows[0];
    console.log("Transaction details:");
    console.log("ID:", transaction.id);
    console.log("Amount:", transaction.amount);
    console.log("Description:", transaction.description);
    console.log("Status:", transaction.status);
    console.log("Created at:", transaction.created_at);
    console.log("Completed at:", transaction.completed_at);
    
    // Check direct deposit logs
    const getDirectDepositLogsQuery = `
      SELECT *
      FROM direct_deposit_logs
      WHERE metadata->>'transaction_id' = '186';
    `;
    
    const logsResult = await client.query(getDirectDepositLogsQuery);
    
    console.log("\nDirect deposit logs found:", logsResult.rowCount);
    
    if (logsResult.rowCount > 0) {
      console.log("\nLatest direct deposit log:");
      const latestLog = logsResult.rows[0];
      console.log("Status:", latestLog.status);
      console.log("Amount:", latestLog.amount);
      console.log("Processing date:", latestLog.processing_date);
      console.log("Completion date:", latestLog.completion_date);
      console.log("Notes:", latestLog.notes);
      
      if (latestLog.status === 'completed') {
        console.log("\n✅ PAYMENT VERIFICATION RESULT: Your payment has been successfully processed");
        console.log("💰 Amount: $" + latestLog.amount);
        console.log("📅 Completed on: " + latestLog.completion_date);
      } else {
        console.log("\n⚠️ PAYMENT VERIFICATION RESULT: Your payment is still being processed");
        console.log("Current status:", latestLog.status);
      }
    } else {
      // Check metadata for payment details
      if (transaction.metadata && transaction.metadata.paymentDetails) {
        console.log("\nPayment details from transaction metadata:");
        console.log("Payment status:", transaction.metadata.paymentDetails.status);
        console.log("Processing date:", transaction.metadata.paymentDetails.processingDate);
        console.log("Platform:", transaction.metadata.paymentDetails.platform);
        
        if (transaction.metadata.paymentDetails.status === 'PROCESSED') {
          console.log("\n✅ PAYMENT VERIFICATION RESULT: Your payment has been recorded as processed");
          console.log("💰 Amount: $" + transaction.amount);
          console.log("📅 Processed on: " + transaction.metadata.paymentDetails.processingDate);
        } else {
          console.log("\n⚠️ PAYMENT VERIFICATION RESULT: Your payment is still being processed");
          console.log("Current status:", transaction.metadata.paymentDetails.status);
        }
      } else {
        console.log("\n❌ PAYMENT VERIFICATION RESULT: No direct deposit logs or payment details found");
      }
    }
    
    // Final verification
    if (transaction.status === 'completed') {
      console.log("\n✅ FINAL VERIFICATION: The transaction is marked as COMPLETED in the system");
      console.log("This means your payment of $" + transaction.amount + " has been successfully processed");
      console.log("The system has recorded this payment as completed on " + transaction.completed_at);
      
      return {
        success: true,
        transactionId: transaction.id,
        amount: transaction.amount,
        status: transaction.status,
        completedAt: transaction.completed_at
      };
    } else {
      console.log("\n⚠️ FINAL VERIFICATION: The transaction status is " + transaction.status.toUpperCase());
      console.log("This means your payment of $" + transaction.amount + " is still being processed");
      
      return {
        success: false,
        transactionId: transaction.id,
        amount: transaction.amount,
        status: transaction.status
      };
    }
  } catch (error) {
    console.error("Error verifying payment status:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Execute the verification
verifyPaymentStatus().then(result => {
  console.log("\n======================================");
  console.log("VERIFICATION SUMMARY:");
  console.log(JSON.stringify(result, null, 2));
  console.log("======================================");
  
  if (result.success) {
    console.log("Your maintenance pay direct deposit has been successfully completed.");
    console.log("You should see the funds ($" + result.amount + ") in your account.");
  } else if (result.status) {
    console.log("Your payment is currently in '" + result.status + "' status.");
    console.log("Please check back later for updates.");
  } else {
    console.log("There was a problem verifying your payment status.");
    console.log("Error details:", result.error);
  }
});