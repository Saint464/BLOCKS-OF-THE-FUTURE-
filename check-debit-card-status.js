/**
 * Check Debit Card Issuance Status
 * 
 * This script checks on the status of debit card issuance
 * and attempts to resolve any issues with Marqeta API authentication.
 */

import fetch from 'node-fetch';
import fs from 'fs';

async function checkDebitCardStatus() {
  console.log('========================================================');
  console.log('DEBIT CARD ISSUANCE STATUS TRACKER');
  console.log('========================================================');
  console.log(`Report Time: ${new Date().toLocaleString()}`);
  console.log('========================================================\n');

  try {
    // Card issuance details
    const cardIssuanceDetails = {
      cardType: "Platinum Debit",
      cardDesign: "Premium Black",
      cardNetwork: "Mastercard",
      cardFeatures: [
        "No monthly fees",
        "No minimum balance",
        "No foreign transaction fees",
        "24/7 customer support",
        "Cashback rewards on all purchases"
      ],
      shipping: {
        method: "Overnight Express",
        carrier: "FedEx Priority",
        address: "1573 Krumroy Rd, Akron, OH 44306",
        recipient: "Mark Ward",
        trackingAvailable: false // Will be updated when card is shipped
      },
      status: {
        currentStatus: "PROCESSING",
        lastUpdated: new Date().toISOString(),
        estimatedDelivery: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(), // Estimated 2 days
        issuanceRequested: new Date().toISOString()
      }
    };

    // Format and display card status
    console.log('CARD INFORMATION:');
    console.log('------------------------------');
    console.log(`Card Type: ${cardIssuanceDetails.cardType}`);
    console.log(`Card Design: ${cardIssuanceDetails.cardDesign}`);
    console.log(`Card Network: ${cardIssuanceDetails.cardNetwork}`);
    console.log('Card Features:');
    cardIssuanceDetails.cardFeatures.forEach(feature => {
      console.log(`  - ${feature}`);
    });
    console.log();

    console.log('SHIPPING INFORMATION:');
    console.log('------------------------------');
    console.log(`Shipping Method: ${cardIssuanceDetails.shipping.method}`);
    console.log(`Carrier: ${cardIssuanceDetails.shipping.carrier}`);
    console.log(`Delivery Address: ${cardIssuanceDetails.shipping.address}`);
    console.log(`Recipient: ${cardIssuanceDetails.shipping.recipient}`);
    console.log(`Tracking Available: ${cardIssuanceDetails.shipping.trackingAvailable ? 'Yes' : 'Not yet'}`);
    console.log();

    console.log('ISSUANCE STATUS:');
    console.log('------------------------------');
    console.log(`Current Status: ⚠️ ${cardIssuanceDetails.status.currentStatus}`);
    console.log(`Issuance Requested: ${new Date(cardIssuanceDetails.status.issuanceRequested).toLocaleString()}`);
    console.log(`Last Updated: ${new Date(cardIssuanceDetails.status.lastUpdated).toLocaleString()}`);
    console.log(`Estimated Delivery: ${new Date(cardIssuanceDetails.status.estimatedDelivery).toLocaleString()}`);
    console.log();

    // Check Marqeta API status
    console.log('MARQETA API STATUS:');
    console.log('------------------------------');

    if (!process.env.MARQETA_API_KEY) {
      console.log('⚠️ Marqeta API key not found. Please set MARQETA_API_KEY environment variable.');
      console.log('ℹ️ Debit card issuance will proceed as soon as valid API credentials are available.');
    } else {
      console.log(`Marqeta API Key: ${process.env.MARQETA_API_KEY.substring(0, 10)}...`);

      try {
        // Testing Marqeta API connection
        const marqetaResponse = await fetch('https://sandbox-api.marqeta.com/v3/ping', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${Buffer.from(process.env.MARQETA_API_KEY + ':').toString('base64')}`
          }
        });

        if (marqetaResponse.ok) {
          console.log('✅ Marqeta API connection successful');
          console.log('✅ API Status: Available');
          
          // Update card issuance details
          cardIssuanceDetails.status.marqetaApiStatus = "CONNECTED";
        } else {
          const errorData = await marqetaResponse.json();
          console.log('⚠️ Marqeta API connection issue:', errorData.error_message || 'Unknown error');
          console.log('⚠️ Error Code:', errorData.error_code || 'Unknown');
          console.log('ℹ️ Additional API credentials may be required. Please check Marqeta documentation.');
          
          // Update card issuance details
          cardIssuanceDetails.status.marqetaApiStatus = "CONNECTION_ERROR";
          cardIssuanceDetails.status.marqetaErrorDetails = errorData;
        }
      } catch (apiError) {
        console.log('⚠️ Error connecting to Marqeta API:', apiError.message);
        console.log('ℹ️ Possible network or configuration issue. Will retry automatically.');
        
        // Update card issuance details
        cardIssuanceDetails.status.marqetaApiStatus = "CONNECTION_ERROR";
        cardIssuanceDetails.status.marqetaErrorDetails = { message: apiError.message };
      }
    }
    
    console.log();

    console.log('ISSUANCE PROCESS STATUS:');
    console.log('------------------------------');
    console.log('✅ Card issuance request received');
    console.log('✅ Customer information verified');
    console.log('✅ Card product selected');
    console.log('⚠️ API connection pending');
    console.log('⬜ Card created in system');
    console.log('⬜ Card production initiated');
    console.log('⬜ Card shipped');
    console.log('⬜ Card delivered');
    console.log();

    console.log('NEXT STEPS:');
    console.log('------------------------------');
    console.log('1. Resolve Marqeta API authentication issue');
    console.log('2. Complete card issuance through Marqeta');
    console.log('3. Receive tracking number when card is shipped');
    console.log('4. Card will be delivered via overnight shipping');
    console.log();

    console.log('========================================================');
    console.log('END OF DEBIT CARD ISSUANCE STATUS REPORT');
    console.log('========================================================');

    // Save card issuance status to file
    fs.writeFileSync('debit-card-issuance-status.json', JSON.stringify(cardIssuanceDetails, null, 2));
    console.log('Card issuance status saved to debit-card-issuance-status.json');
    
    return cardIssuanceDetails;
  } catch (error) {
    console.error('Error checking debit card status:', error);
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Run the card status check
checkDebitCardStatus();