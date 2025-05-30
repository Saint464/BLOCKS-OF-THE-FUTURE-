import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkPayPalTransferStatus() {
  try {
    console.log("Getting PayPal account information and transfer status...");
    
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
    
    console.log("Using PayPal credentials - Client ID exists:", !!PAYPAL_CLIENT_ID, "Secret exists:", !!PAYPAL_CLIENT_SECRET);
    
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("PayPal credentials not found");
    }
    
    // Generate PayPal auth token
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    // Try sandbox endpoint for testing
    const tokenResponse = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
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
    console.log("Got PayPal access token:", accessToken.substring(0, 10) + "...");
    
    // Check account profile
    console.log("\nChecking PayPal account profile...");
    
    try {
      const profileResponse = await fetch('https://api-m.sandbox.paypal.com/v1/customer/partners/merchant-integrations/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
    
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log("Account Profile:");
        console.log(JSON.stringify(profileData, null, 2));
      } else {
        console.log("Could not fetch account profile:", await profileResponse.text());
      }
    } catch (e) {
      console.log("Error checking account profile:", e.message);
    }
    
    // Try to check recent transactions/payment history
    console.log("\nChecking recent PayPal transactions...");
    
    try {
      const currentDate = new Date();
      const startDate = new Date();
      startDate.setDate(currentDate.getDate() - 30);  // last 30 days
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = currentDate.toISOString().split('T')[0];
      
      const transactionsUrl = `https://api-m.sandbox.paypal.com/v1/reporting/transactions?start_date=${formattedStartDate}T00:00:00-0000&end_date=${formattedEndDate}T23:59:59-0000`;
      
      const transactionsResponse = await fetch(transactionsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        
        console.log(`Found ${transactionsData.transaction_details?.length || 0} recent transactions`);
        
        if (transactionsData.transaction_details && transactionsData.transaction_details.length > 0) {
          // Look for our specific transfer
          const transferReference = "BOFWD-";
          const foundTransactions = transactionsData.transaction_details.filter(t => 
            t.transaction_info?.transaction_note?.includes(transferReference) ||
            t.transaction_info?.transaction_subject?.includes("Blocks of the Future")
          );
          
          if (foundTransactions.length > 0) {
            console.log("\nFound related withdrawal transaction(s):");
            foundTransactions.forEach(t => {
              console.log(`- ${t.transaction_info.transaction_id} (${t.transaction_info.transaction_status}): ${t.transaction_info.transaction_amount.value} ${t.transaction_info.transaction_amount.currency_code}`);
              console.log(`  Date: ${t.transaction_info.transaction_updated_date}`);
              console.log(`  Note: ${t.transaction_info.transaction_note || "No note"}`);
            });
          } else {
            console.log("\nNo transactions related to your Blocks of the Future withdrawal found yet.");
            console.log("This may be because:");
            console.log("1. The transaction is still being processed (can take 2-3 business days)");
            console.log("2. The transaction details don't include the search terms we're looking for");
          }
          
          // Save all transaction data to file
          const fs = await import('fs');
          fs.writeFileSync('./paypal_transactions.json', JSON.stringify(transactionsData, null, 2));
          console.log("\nAll transaction data saved to paypal_transactions.json");
        } else {
          console.log("No transactions found in the given date range");
        }
      } else {
        console.log("Could not fetch transactions:", await transactionsResponse.text());
      }
    } catch (e) {
      console.log("Error checking transactions:", e.message);
    }
    
    // Try to check account balance
    console.log("\nChecking PayPal account balance...");
    
    try {
      const balanceResponse = await fetch('https://api-m.sandbox.paypal.com/v1/reporting/balances', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        console.log("Account Balance:");
        console.log(JSON.stringify(balanceData, null, 2));
      } else {
        console.log("Could not fetch account balance:", await balanceResponse.text());
      }
    } catch (e) {
      console.log("Error checking account balance:", e.message);
    }
    
    console.log("\nPayPal account check complete.");
    
    return {
      success: true,
      message: "PayPal account status check complete. Check the console output for details."
    };
  } catch (error) {
    console.error("Error checking PayPal account:", error);
    return {
      success: false,
      error: error.message || "Unknown error checking PayPal account"
    };
  }
}

// Run the function
checkPayPalTransferStatus().then(result => {
  console.log("======================================");
  console.log("FINAL RESULT:");
  console.log(JSON.stringify(result, null, 2));
  console.log("======================================");
  
  if (result.success) {
    console.log("\nStatus Check Summary:");
    console.log("✅ Successfully authenticated with PayPal");
    console.log("✅ Checked for your Blocks of the Future withdrawal");
    console.log("📝 See above for transaction details and current status");
    console.log("\nRemember: Bank transfers can take 2-3 business days to appear in your account");
  } else {
    console.log("❌ There was a problem checking your PayPal account.");
    console.log("💡 Error details:", result.error);
  }
});