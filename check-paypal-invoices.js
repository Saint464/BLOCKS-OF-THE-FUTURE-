import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkPayPalInvoices() {
  try {
    console.log("Getting PayPal access token...");
    
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
    
    console.log("Using PayPal credentials - Client ID exists:", !!PAYPAL_CLIENT_ID, "Secret exists:", !!PAYPAL_CLIENT_SECRET);
    
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("PayPal credentials not found");
    }
    
    // Generate PayPal auth token
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    // Try production endpoint first, then fallback to sandbox if needed
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
    console.log("Got PayPal access token");
    
    // Fetch invoices
    console.log("Fetching PayPal invoices...");
    const invoicesUrl = 'https://api-m.paypal.com/v1/invoicing/invoices?page=1&page_size=10&total_count_required=true';
    
    const invoicesResponse = await fetch(invoicesUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!invoicesResponse.ok) {
      const errorText = await invoicesResponse.text();
      throw new Error(`Failed to fetch invoices: ${errorText}`);
    }
    
    const invoicesData = await invoicesResponse.json();
    console.log("Successfully fetched PayPal invoices");
    
    // Format and display invoice data
    if (invoicesData.total_count === 0) {
      console.log("No invoices found in your PayPal account");
    } else {
      console.log(`Found ${invoicesData.total_count} invoices`);
      
      if (invoicesData.invoices && invoicesData.invoices.length > 0) {
        console.log("\nInvoice Summary:");
        invoicesData.invoices.forEach((invoice, index) => {
          console.log(`\nInvoice #${index + 1}:`);
          console.log(`ID: ${invoice.id}`);
          console.log(`Status: ${invoice.status}`);
          console.log(`Amount: ${invoice.amount.currency} ${invoice.amount.value}`);
          console.log(`Invoice Date: ${invoice.invoice_date}`);
          if (invoice.merchant_info) {
            console.log(`Merchant: ${invoice.merchant_info.business_name || invoice.merchant_info.email}`);
          }
        });
      }
    }
    
    // Save the invoice data to a file
    const fs = await import('fs');
    fs.writeFileSync('./paypal_invoices.json', JSON.stringify(invoicesData, null, 2));
    console.log("\nInvoice data saved to paypal_invoices.json");
    
    return {
      success: true,
      invoiceCount: invoicesData.total_count,
      invoices: invoicesData.invoices || []
    };
  } catch (error) {
    console.error("Error checking PayPal invoices:", error);
    return {
      success: false,
      error: error.message || "Unknown error checking invoices"
    };
  }
}

// Run the function
checkPayPalInvoices().then(result => {
  console.log("======================================");
  console.log("FINAL RESULT:");
  console.log(JSON.stringify(result.success ? { success: true, invoiceCount: result.invoiceCount } : { success: false, error: result.error }, null, 2));
  console.log("======================================");
});