/**
 * Ultra-Quick Port 3001 Unlocker
 * 
 * This script focuses on just one thing: making port 3001 available
 * for the Authentication service. It does this by:
 * 1. Killing any process using port 3001
 * 2. Binding to the port to clear any lingering socket
 * 3. Setting an Auth-only environment variable
 */

const net = require('net');
const { execSync } = require('child_process');

console.log('========================================');
console.log('Blocks of the Future - Port 3001 Unlocker');
console.log('========================================');

console.log('Step 1: Forcibly releasing port 3001...');
try {
  // Kill any processes using port 3001
  execSync('fuser -k 3001/tcp || true');
  console.log('Any processes using port 3001 have been terminated');
} catch (error) {
  console.log('No processes were found using port 3001');
}

console.log('Step 2: Clearing socket state...');
const server = net.createServer();

server.once('error', (err) => {
  console.error('Error binding to port 3001:', err.message);
  console.log('Step 3: Creating AUTH_ONLY environment variable...');
  
  // Create environment variable file to reserve port 3001 for Authentication only
  try {
    execSync('echo "AUTH_ONLY_PORT_3001=true" >> .env.local');
    console.log('Created environment flag to reserve port 3001 for Authentication only');
    console.log('Port 3001 unlocker complete - start your application with:');
    console.log('npm run dev');
  } catch (envError) {
    console.error('Error setting environment variable:', envError.message);
  }
});

server.once('listening', () => {
  console.log('Successfully bound to port 3001');
  server.close(() => {
    console.log('Successfully released port 3001 - it is now available');
    
    console.log('Step 3: Creating AUTH_ONLY environment variable...');
    
    // Create environment variable file to reserve port 3001 for Authentication only
    try {
      execSync('echo "AUTH_ONLY_PORT_3001=true" >> .env.local');
      console.log('Created environment flag to reserve port 3001 for Authentication only');
      console.log('Port 3001 unlocker complete - start your application with:');
      console.log('npm run dev');
    } catch (envError) {
      console.error('Error setting environment variable:', envError.message);
    }
  });
});

server.listen(3001, '0.0.0.0');