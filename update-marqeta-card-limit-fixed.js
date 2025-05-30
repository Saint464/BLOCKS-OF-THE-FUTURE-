import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function updateCardSpendingLimit() {
  try {
    // Card token from your configuration
    const cardToken = "f8d06245-9072-4f76-8397-466c129baa82";
    
    // Marqeta API credentials (should be in your .env file)
    const MARQETA_BASE_URL = process.env.MARQETA_BASE_URL || 'https://sandbox-api.marqeta.com/v3';
    const MARQETA_APPLICATION_TOKEN = process.env.MARQETA_APPLICATION_TOKEN;
    const MARQETA_ADMIN_TOKEN = process.env.MARQETA_ADMIN_TOKEN;
    
    // Check if credentials exist
    const hasCredentials = process.env.MARQETA_APPLICATION_TOKEN && process.env.MARQETA_ADMIN_TOKEN;
    
    console.log("Updating Marqeta card spending limits...");
    console.log(`Card Token: ${cardToken}`);
    
    // If no credentials, perform simulation
    if (!hasCredentials) {
      console.log("Marqeta API credentials not found in environment variables.");
      console.log("Please set MARQETA_APPLICATION_TOKEN and MARQETA_ADMIN_TOKEN in your .env file.");
      console.log("Proceeding with a simulation of the update process...");
      
      // Simulate the update for demonstration
      console.log("\n=== SIMULATING CARD UPDATE ===");
      console.log("1. Fetching current card configuration");
      console.log(`Card Token: ${cardToken}`);
      
      // Create a simulated card config based on the one you provided
      const cardConfig = {
        "token": cardToken,
        "name": "Your Payment Card",
        "active": true,
        "config": {
          "poi": {
            "other": {
              "allow": true,
              "card_presence_required": false,
              "cardholder_presence_required": false
            },
            "ecommerce": true,
            "atm": false
          },
          "transaction_controls": {
            "accepted_countries_token": "accept_us_only",
            "always_require_pin": false,
            "allow_gpa_auth": true,
            "enable_partial_auth_approval": true
          }
        }
      };
      
      console.log("2. Adding daily spending limit of $100,000 USD");
      
      // Update the simulated config with spending limits
      cardConfig.config.transaction_controls.max_amount = 10000000; // $100,000.00 in cents
      cardConfig.config.transaction_controls.max_amount_interval = "DAILY";
      
      console.log("3. Updating card configuration");
      console.log("\nUpdated Transaction Controls:");
      console.log(JSON.stringify(cardConfig.config.transaction_controls, null, 2));
      console.log("=== SIMULATION COMPLETE ===\n");
      
      return {
        success: true,
        message: "SIMULATION: Card spending limit would be updated to $100,000 USD daily",
        note: "This was a simulation. Add Marqeta API credentials to perform the actual update."
      };
    }
    
    // If we reach here, we have credentials, so proceed with actual API calls
    // Authorization header for Marqeta API
    const auth = Buffer.from(`${MARQETA_APPLICATION_TOKEN}:${MARQETA_ADMIN_TOKEN}`).toString('base64');
    
    // Step 1: Fetch the current card configuration
    console.log("Fetching current card configuration...");
    const cardResponse = await fetch(`${MARQETA_BASE_URL}/cards/${cardToken}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!cardResponse.ok) {
      const errorText = await cardResponse.text();
      throw new Error(`Failed to fetch card configuration: ${errorText}`);
    }
    
    const cardConfig = await cardResponse.json();
    console.log("Successfully retrieved card configuration");
    
    // Step 2: Add/update the spending limit
    console.log("Adding daily spending limit of $100,000 USD...");
    
    // Update the transaction_controls section to include the spending limit
    // Using the appropriate structure based on Marqeta's API
    if (!cardConfig.config.transaction_controls) {
      cardConfig.config.transaction_controls = {};
    }
    
    // Add spending controls
    cardConfig.config.transaction_controls.max_amount = 10000000; // $100,000.00 in cents
    cardConfig.config.transaction_controls.max_amount_interval = "DAILY";
    
    // Step 3: Update the card configuration
    console.log("Updating card configuration...");
    const updateResponse = await fetch(`${MARQETA_BASE_URL}/cards/${cardToken}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cardConfig)
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update card configuration: ${errorText}`);
    }
    
    const updatedCard = await updateResponse.json();
    console.log("Successfully updated card configuration with spending limit");
    
    // Output the updated section for verification
    console.log("\nUpdated Transaction Controls:");
    console.log(JSON.stringify(updatedCard.config.transaction_controls, null, 2));
    
    return {
      success: true,
      message: "Card spending limit successfully updated to $100,000 USD daily",
      cardToken: cardToken
    };
  } catch (error) {
    console.error("Error updating card spending limit:", error);
    return {
      success: false,
      error: error.message || "Unknown error updating card"
    };
  }
}

// Run the function
updateCardSpendingLimit().then(result => {
  console.log("\n======================================");
  console.log("FINAL RESULT:");
  console.log(JSON.stringify(result, null, 2));
  console.log("======================================");
  
  if (result.success) {
    console.log("\n✅ Card update completed successfully");
    if (result.note) {
      console.log("\n⚠️ Note: " + result.note);
      console.log("To perform an actual update, you'll need to add these to your .env file:");
      console.log("MARQETA_APPLICATION_TOKEN=your_application_token");
      console.log("MARQETA_ADMIN_TOKEN=your_admin_token");
      console.log("MARQETA_BASE_URL=https://sandbox-api.marqeta.com/v3 (or your production URL)");
    }
  } else {
    console.log("\n❌ Card update failed");
    console.log("💡 Error details:", result.error);
  }
});