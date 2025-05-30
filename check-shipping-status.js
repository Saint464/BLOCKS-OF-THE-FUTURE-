
/**
 * Shipping Status Checker
 * This script checks the shipping status of both debit cards (via Marqeta) 
 * and vehicle delivery from the dealership.
 */

const fetch = require('node-fetch');

// Configuration - Using environment variables or fallback to defaults
const API_URL = process.env.API_URL || 'http://localhost:5000';
const USER_ID = process.env.USER_ID || '1'; // Default user ID

async function checkCardShippingStatus() {
  try {
    console.log('🔍 Checking payment card shipping status...');
    
    const response = await fetch(`${API_URL}/api/cards/shipping-status?userId=${USER_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AUTH_TOKEN || 'placeholder-token'}`
      }
    });
    
    const cardStatus = await response.json();
    
    if (cardStatus.success) {
      console.log('\n✅ PAYMENT CARD SHIPPING STATUS:');
      console.log('============================');
      
      if (cardStatus.personalCard) {
        console.log(`Personal Card: ${cardStatus.personalCard.name}`);
        console.log(`Status: ${cardStatus.personalCard.shippingStatus}`);
        console.log(`Estimated Delivery: ${cardStatus.personalCard.estimatedDelivery}`);
        console.log(`Tracking Number: ${cardStatus.personalCard.trackingNumber || 'Not available yet'}`);
        console.log(`Carrier: ${cardStatus.personalCard.carrier}`);
      }
      
      if (cardStatus.businessCard) {
        console.log('\nBusiness Card: ${cardStatus.businessCard.name}');
        console.log(`Status: ${cardStatus.businessCard.shippingStatus}`);
        console.log(`Estimated Delivery: ${cardStatus.businessCard.estimatedDelivery}`);
        console.log(`Tracking Number: ${cardStatus.businessCard.trackingNumber || 'Not available yet'}`);
        console.log(`Carrier: ${cardStatus.businessCard.carrier}`);
      }
      
      // Provide a summarized message
      if (cardStatus.personalCard?.shippingStatus === 'SHIPPED') {
        console.log('\n🚚 Your payment cards have been shipped and will arrive by ' + 
          cardStatus.personalCard.estimatedDelivery);
      }
    } else {
      console.log('❌ Could not retrieve card shipping status:', cardStatus.message || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Error checking card shipping status:', error.message);
  }
}

async function checkVehicleDeliveryStatus() {
  try {
    console.log('\n🔍 Checking vehicle delivery status...');
    
    const response = await fetch(`${API_URL}/api/vehicle/delivery-status?userId=${USER_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AUTH_TOKEN || 'placeholder-token'}`
      }
    });
    
    const vehicleStatus = await response.json();
    
    if (vehicleStatus.success) {
      console.log('\n✅ VEHICLE DELIVERY STATUS:');
      console.log('=========================');
      console.log(`Vehicle: ${vehicleStatus.vehicleModel || 'Silverado EV'}`);
      console.log(`Status: ${vehicleStatus.status}`);
      console.log(`Estimated Delivery: ${vehicleStatus.estimatedDelivery}`);
      console.log(`Tracking Number: ${vehicleStatus.trackingNumber || 'Not available yet'}`);
      console.log(`Delivery Service: ${vehicleStatus.deliveryService || 'Dealership'}`);
      
      if (vehicleStatus.deliveryLocation) {
        console.log(`Delivery Location: ${vehicleStatus.deliveryLocation}`);
      }
      
      // Provide a summarized message
      if (vehicleStatus.status === 'IN_TRANSIT') {
        console.log('\n🚚 Your vehicle is in transit and scheduled for delivery on ' + 
          vehicleStatus.estimatedDelivery);
      } else if (vehicleStatus.status === 'READY_FOR_PICKUP') {
        console.log('\n🏁 Your vehicle is ready for pickup at the dealership!');
      } else if (vehicleStatus.status === 'DELIVERED') {
        console.log('\n🎉 Your vehicle has been delivered!');
      }
    } else {
      console.log('❌ Could not retrieve vehicle delivery status:', vehicleStatus.message || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Error checking vehicle delivery status:', error.message);
  }
}

async function main() {
  console.log('======================================');
  console.log('🚚 SHIPMENT & DELIVERY STATUS CHECKER');
  console.log('======================================\n');
  
  // Check card shipping status
  await checkCardShippingStatus();
  
  // Check vehicle delivery status
  await checkVehicleDeliveryStatus();
  
  console.log('\n======================================');
  console.log('Status check completed!');
  console.log('======================================');
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
