/**
 * Verify PayPal Authentication
 * 
 * This script tests the PayPal API authentication with provided credentials.
 */

import fetch from 'node-fetch';

async function verifyPayPalAuth() {
  console.log('Testing PayPal API Authentication...');
  
  // Output length of credentials (for debugging without exposing secrets)
  console.log(`PayPal Client ID length: ${process.env.PAYPAL_CLIENT_ID?.length || 0}`);
  console.log(`PayPal Client Secret length: ${process.env.PAYPAL_CLIENT_SECRET?.length || 0}`);
  
  // Base64 encode credentials for Basic Auth
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');
  
  try {
    // Call PayPal OAuth endpoint to get access token
    const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    
    // Log response status
    console.log(`PayPal API Response Status: ${response.status} ${response.statusText}`);
    
    // Parse response
    const data = await response.json();
    console.log('PayPal API Response:', data);
    
    if (data.access_token) {
      console.log('Authentication successful!');
      console.log(`Access Token: ${data.access_token.substring(0, 10)}...`);
      return true;
    } else {
      console.log('Authentication failed:', data.error_description || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('Error connecting to PayPal API:', error);
    return false;
  }
}

// Run the verification
verifyPayPalAuth();