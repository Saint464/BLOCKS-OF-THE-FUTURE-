/**
 * Check Server Status
 * 
 * This script checks if the Blocks of the Future server is already running.
 */

import http from 'http';

const PORT = 3000;
const HOST = 'localhost';

// Function to make a simple GET request
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data
        });
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    req.end();
  });
}

// Main function
async function checkServerStatus() {
  console.log(`Checking if server is running on http://${HOST}:${PORT}...`);
  
  try {
    // Try to access the health endpoint
    const healthResult = await makeRequest('/health');
    
    if (healthResult.statusCode === 200) {
      console.log('✅ Server is running and healthy!');
      console.log(`Responded with status code ${healthResult.statusCode}`);
      try {
        const healthData = JSON.parse(healthResult.data);
        console.log(`Server status: ${healthData.status}`);
        console.log(`Server version: ${healthData.version}`);
        console.log(`Environment: ${healthData.environment}`);
      } catch (e) {
        console.log('Health data response:', healthResult.data);
      }
    } else {
      console.log(`❌ Server is running but returned status code ${healthResult.statusCode}`);
    }
  } catch (error) {
    console.log(`❌ Server is not running on port ${PORT}: ${error.message}`);
    console.log('Please start the server using: node server-port-3000.cjs');
  }
}

// Run the check
checkServerStatus();