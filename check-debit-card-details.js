
/**
 * Check Debit Card Details
 * 
 * This script retrieves and displays detailed information about your debit card
 * including card status, features, and delivery information.
 */

import { marqetaService } from './server/services/marqetaService.js';
import { getCardFullDetails } from './server/services/cardService.js';
import fs from 'fs';

async function checkDebitCardDetails() {
  console.log('========================================================');
  console.log('DEBIT CARD INFORMATION');
  console.log('========================================================');
  console.log(`Report Time: ${new Date().toLocaleString()}`);
  console.log('========================================================\n');

  try {
    // For demo purposes, we'll use card ID 1 which appears to be the primary card
    const cardDetails = await getCardFullDetails(1, 1); // Assuming user ID 1 is the current user
    
    if (!cardDetails) {
      console.log('❌ No debit card information found.');
      return;
    }
    
    console.log('CARD INFORMATION:');
    console.log('------------------------------');
    console.log(`Card Type: ${cardDetails.metadata?.cardType || 'Debit'}`);
    console.log(`Card Number: ${cardDetails.cardNumber || 'Not available'}`);
    console.log(`Name on Card: ${cardDetails.metadata?.nameOnCard || 'Card Holder'}`);
    console.log(`Expiry Date: ${cardDetails.metadata?.expiryDate || 'Not available'}`);
    console.log(`Status: ${cardDetails.status || 'Unknown'}`);
    console.log(`Issuer: ${cardDetails.metadata?.issuer || 'Mastercard'}`);
    
    if (cardDetails.metadata?.marqetaVerification) {
      console.log('\nMARQETA VERIFICATION:');
      console.log('------------------------------');
      console.log(`Status: ${cardDetails.metadata.marqetaVerification.status}`);
      console.log(`Date: ${cardDetails.metadata.marqetaVerification.date}`);
      console.log(`Card Production Status: ${cardDetails.metadata.marqetaVerification.cardProductionStatus}`);
      console.log(`Integration Status: ${cardDetails.metadata.marqetaVerification.integrationStatus}`);
      console.log(`Last Connection Test: ${cardDetails.metadata.marqetaVerification.lastConnectionTest}`);
    }
    
    if (cardDetails.metadata?.dailyLimit) {
      console.log('\nSPENDING LIMITS:');
      console.log('------------------------------');
      console.log(`Daily Limit: $${cardDetails.metadata.dailyLimit}`);
    }
    
    // Try to get shipping information from card issuance records
    try {
      const issuanceData = fs.existsSync('./debit-card-issuance-status.json') 
        ? JSON.parse(fs.readFileSync('./debit-card-issuance-status.json', 'utf8'))
        : null;
      
      if (issuanceData && issuanceData.shipping) {
        console.log('\nSHIPPING INFORMATION:');
        console.log('------------------------------');
        console.log(`Method: ${issuanceData.shipping.method}`);
        console.log(`Carrier: ${issuanceData.shipping.carrier}`);
        console.log(`Address: ${issuanceData.shipping.address}`);
        console.log(`Recipient: ${issuanceData.shipping.recipient}`);
        
        if (issuanceData.status && issuanceData.status.estimatedDelivery) {
          const estimatedDate = new Date(issuanceData.status.estimatedDelivery);
          console.log(`Estimated Delivery: ${estimatedDate.toLocaleDateString()}`);
        }
      }
    } catch (error) {
      console.log('\nShipping information could not be retrieved.');
    }
    
    // Try to get expedited request information if it exists
    try {
      const expeditedData = fs.existsSync('./expedited-card-request.json')
        ? JSON.parse(fs.readFileSync('./expedited-card-request.json', 'utf8'))
        : null;
      
      if (expeditedData) {
        console.log('\nEXPEDITED REQUEST STATUS:');
        console.log('------------------------------');
        console.log(`Request Type: ${expeditedData.requestType}`);
        console.log(`Priority: ${expeditedData.priority}`);
        console.log(`Status: ${expeditedData.status}`);
        console.log(`Notes: ${expeditedData.notes}`);
        
        const requestDate = new Date(expeditedData.timestamp);
        console.log(`Request Date: ${requestDate.toLocaleString()}`);
      }
    } catch (error) {
      // No expedited request found
    }
    
    console.log('\n========================================================');
    console.log('END OF DEBIT CARD INFORMATION REPORT');
    console.log('========================================================');
    
    return cardDetails;
  } catch (error) {
    console.error('Error checking debit card details:', error);
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Run the check
checkDebitCardDetails().catch(console.error);
