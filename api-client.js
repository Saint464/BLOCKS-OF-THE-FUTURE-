/**
 * Simple API Client for Testing Our Simplified Server
 * 
 * This script tests connections to both our simplified API server
 * and the main application server.
 */

import fetch from 'node-fetch';
import { createServer } from 'http';

// Configuration
const SIMPLIFIED_API_PORT = 5100;
const TEST_SERVER_PORT = 5200;
const API_ENDPOINTS = [
  '/health',
  '/api/vehicles',
  '/api/car-dealers',
  '/api/car-purchases',
  '/api/service-orders'
];

// Create a simple test server to display our API test results
const app = createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  
  if (req.url === '/') {
    // Serve the main test page
    serveMainPage(res);
  } else if (req.url.startsWith('/test/')) {
    // Handle API test requests
    const endpoint = req.url.replace('/test', '');
    testEndpoint(endpoint, res);
  } else {
    // Handle unknown routes
    res.statusCode = 404;
    res.end('Not found');
  }
});

// Start the test server
app.listen(TEST_SERVER_PORT, '0.0.0.0', () => {
  console.log(`Test server running on http://0.0.0.0:${TEST_SERVER_PORT}`);
  console.log(`Access the test dashboard to verify API connectivity`);
});

// Serve the main test page
function serveMainPage(res) {
  res.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>API Test Dashboard</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #2c3e50;
          margin-bottom: 20px;
        }
        .card {
          background: #fff;
          border-radius: 5px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        button {
          background: #3498db;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 10px;
          margin-bottom: 10px;
        }
        button:hover {
          background: #2980b9;
        }
        pre {
          background: #f7f7f7;
          border-radius: 4px;
          padding: 10px;
          overflow: auto;
          max-height: 300px;
        }
        .success {
          color: #27ae60;
          font-weight: bold;
        }
        .error {
          color: #e74c3c;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <h1>Blockchain Auto Marketplace - API Test Dashboard</h1>
      
      <div class="card">
        <h2>API Endpoint Tests</h2>
        <p>Click the buttons below to test each API endpoint.</p>
        
        <div>
          ${API_ENDPOINTS.map(endpoint => 
            `<button onclick="testEndpoint('${endpoint}')">${endpoint}</button>`
          ).join('')}
        </div>
        
        <div id="results"></div>
      </div>
      
      <script>
        function testEndpoint(endpoint) {
          const resultsDiv = document.getElementById('results');
          resultsDiv.innerHTML = '<p>Testing endpoint: ' + endpoint + '...</p>';
          
          fetch('/test' + endpoint)
            .then(response => response.text())
            .then(data => {
              resultsDiv.innerHTML = data;
            })
            .catch(error => {
              resultsDiv.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
            });
        }
      </script>
    </body>
    </html>
  `);
  res.end();
}

// Test an API endpoint
async function testEndpoint(endpoint, res) {
  try {
    // Try to connect to our simplified API
    const apiUrl = `http://localhost:${SIMPLIFIED_API_PORT}${endpoint}`;
    console.log(`Testing endpoint: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    // Format the response for display
    const html = `
      <h3>Endpoint: <span class="success">${endpoint}</span></h3>
      <p>Status: <span class="success">${response.status} ${response.statusText}</span></p>
      <p>Response:</p>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    `;
    
    res.end(html);
  } catch (error) {
    console.error(`Error testing endpoint ${endpoint}:`, error.message);
    
    // Display error information
    const errorHtml = `
      <h3>Endpoint: <span class="error">${endpoint}</span></h3>
      <p>Status: <span class="error">Failed</span></p>
      <p>Error: ${error.message}</p>
      <p>Make sure the simplified API server is running on port ${SIMPLIFIED_API_PORT}</p>
    `;
    
    res.end(errorHtml);
  }
}

// Log startup
console.log('API client initialized. Testing simplified API server...');

// Test the health endpoint on startup
fetch(`http://localhost:${SIMPLIFIED_API_PORT}/health`)
  .then(response => response.json())
  .then(data => {
    console.log('✅ Simplified API server is reachable!');
    console.log('Health check response:', data);
  })
  .catch(error => {
    console.error('❌ Could not connect to simplified API server:', error.message);
    console.error(`Make sure the server is running on port ${SIMPLIFIED_API_PORT}`);
  });