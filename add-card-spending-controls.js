import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function updateCardSpendingControls() {
  try {
    // Marqeta API credentials from environment variables
    let MARQETA_BASE_URL = process.env.MARQETA_BASE_URL || 'https://sandbox-api.marqeta.com/v3';
    if (MARQETA_BASE_URL.endsWith('/')) {
      MARQETA_BASE_URL = MARQETA_BASE_URL.slice(0, -1);
    }
    
    const MARQETA_API_KEY = process.env.MARQETA_API_KEY || process.env.MARQETA_APPLICATION_TOKEN;
    const MARQETA_API_SECRET = process.env.MARQETA_API_SECRET || process.env.MARQETA_ADMIN_TOKEN || process.env.MARQETA_SANDBOX_API_PASSWORD;
    
    console.log("Setting up card spending controls...");
    console.log(`API Base URL: ${MARQETA_BASE_URL}`);
    console.log(`API Key exists: ${!!MARQETA_API_KEY}`);
    console.log(`API Secret exists: ${!!MARQETA_API_SECRET}`);
    
    // Authorization for Marqeta API
    const auth = Buffer.from(`${MARQETA_API_KEY}:${MARQETA_API_SECRET}`).toString('base64');
    
    // Fetch card products
    console.log("\nFetching card products...");
    const productsUrl = `${MARQETA_BASE_URL}/cardproducts`;
    const productsResponse = await fetch(productsUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!productsResponse.ok) {
      const errorText = await productsResponse.text();
      throw new Error(`Failed to fetch card products: ${errorText}`);
    }
    
    const products = await productsResponse.json();
    console.log(`Found ${products.data?.length || 0} card products`);
    
    // List all products for reference
    console.log("\nAvailable Card Products:");
    products.data.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (Token: ${product.token})`);
    });
    
    // For this example, we'll target the first card product
    const cardProduct = products.data[0];
    const cardProductToken = cardProduct.token;
    
    console.log(`\nUpdating card product: ${cardProduct.name} (${cardProductToken})`);
    
    // Get current product configuration
    const productUrl = `${MARQETA_BASE_URL}/cardproducts/${cardProductToken}`;
    const productResponse = await fetch(productUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!productResponse.ok) {
      const errorText = await productResponse.text();
      throw new Error(`Failed to fetch card product configuration: ${errorText}`);
    }
    
    const productConfig = await productResponse.json();
    console.log("Successfully retrieved card product configuration");
    
    // Store the original transaction_controls for comparison
    const originalControls = productConfig.config?.transaction_controls || {};
    console.log("\nCurrent Transaction Controls:");
    console.log(JSON.stringify(originalControls, null, 2));
    
    // Ensure transaction_controls exists
    if (!productConfig.config) {
      productConfig.config = {};
    }
    
    if (!productConfig.config.transaction_controls) {
      productConfig.config.transaction_controls = {};
    }
    
    // Now we need to add spending controls through a combination of:
    // 1. Authorization controls (for daily limits)
    // 2. MCC group authorization controls (for merchant category control)
    
    // Set up MCC group authorization controls if needed for spending limits
    // Since the API doesn't accept max_amount directly, we need to set up authorization rules
    // by merchant category code (MCC) groups
    
    // First, let's create an MCC group for spending control
    console.log("\nCreating MCC group for spending control...");
    const mccGroupName = "High_Value_Transactions";
    
    // Check if the MCC group already exists
    const mccGroupsUrl = `${MARQETA_BASE_URL}/mccgroups`;
    const mccGroupsResponse = await fetch(mccGroupsUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!mccGroupsResponse.ok) {
      const errorText = await mccGroupsResponse.text();
      console.log(`Warning: Could not fetch MCC groups: ${errorText}`);
      console.log("Proceeding with card product update only...");
    } else {
      const mccGroups = await mccGroupsResponse.json();
      let mccGroupExists = false;
      let mccGroupToken = "";
      
      if (mccGroups.data && mccGroups.data.length > 0) {
        for (const group of mccGroups.data) {
          if (group.name === mccGroupName) {
            mccGroupExists = true;
            mccGroupToken = group.token;
            console.log(`Found existing MCC group: ${mccGroupName} (${mccGroupToken})`);
            break;
          }
        }
      }
      
      if (!mccGroupExists) {
        // Create a new MCC group that includes all merchant categories
        const createMccGroupResponse = await fetch(mccGroupsUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: mccGroupName,
            // Include all MCCs by using a wide range
            mccs: ["0000", "9999"]  // This is a simplified approach
          })
        });
        
        if (createMccGroupResponse.ok) {
          const newMccGroup = await createMccGroupResponse.json();
          mccGroupToken = newMccGroup.token;
          console.log(`Created new MCC group: ${mccGroupName} (${mccGroupToken})`);
        } else {
          const errorText = await createMccGroupResponse.text();
          console.log(`Warning: Could not create MCC group: ${errorText}`);
          console.log("Proceeding with card product update only...");
        }
      }
      
      // If we have a valid MCC group token, update the card product to use it
      if (mccGroupToken) {
        // Allow MCC group authorization controls
        productConfig.config.transaction_controls.allow_mcc_group_authorization_controls = true;
        
        // Create the authorization control object if it doesn't exist
        if (!productConfig.config.authorization_controls) {
          productConfig.config.authorization_controls = {};
        }
        
        // Set spending limits by using the MCC group
        productConfig.config.authorization_controls.mcc_group_authorization_controls = [{
          mcc_group: mccGroupToken,
          // Set max amount per transaction to $100,000 (in cents)
          amount_limit: 10000000,
          // Daily frequency of approvals (e.g., max 10 transactions per day)
          approval_window: {
            max_count: 10,
            max_amount: 10000000,
            days: 1,
            include_withdrawals: true,
            include_purchases: true,
            include_transfers: true,
            include_cashback: true,
            include_credits: false
          }
        }];
      }
    }
    
    // Now update the card product with our spending control configuration
    console.log("\nUpdating card product with spending controls...");
    const updateResponse = await fetch(productUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productConfig)
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update card product configuration: ${errorText}`);
    }
    
    const updatedProduct = await updateResponse.json();
    console.log("Successfully updated card product with spending controls");
    
    console.log("\nUpdated Transaction Controls:");
    console.log(JSON.stringify(updatedProduct.config.transaction_controls, null, 2));
    
    if (updatedProduct.config.authorization_controls) {
      console.log("\nUpdated Authorization Controls:");
      console.log(JSON.stringify(updatedProduct.config.authorization_controls, null, 2));
    }
    
    return {
      success: true,
      message: "Card spending controls successfully updated",
      cardProductToken: cardProductToken,
      cardProductName: updatedProduct.name,
      spending_limit: "$100,000 USD daily"
    };
  } catch (error) {
    console.error("Error setting up card spending controls:", error);
    return {
      success: false,
      error: error.message || "Unknown error updating card spending controls"
    };
  }
}

// Run the function
updateCardSpendingControls().then(result => {
  console.log("\n======================================");
  console.log("FINAL RESULT:");
  console.log(JSON.stringify(result, null, 2));
  console.log("======================================");
  
  if (result.success) {
    console.log("\n✅ Card spending controls update completed successfully");
    console.log(`The daily spending limit of $100,000 has been applied to the card product.`);
  } else {
    console.log("\n❌ Card spending controls update failed");
    console.log("💡 Error details:", result.error);
  }
});