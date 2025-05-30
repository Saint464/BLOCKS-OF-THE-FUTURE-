/**
 * ZERO-BS SERVER
 * 
 * This server does NOTHING except keep port 3000 open and accessible
 * in Replit's networking panel. No dependencies, no tricks.
 */

import http from 'http';

// Create the absolute simplest server possible
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Blocks of the Future server is running');
});

// Listen only on port 3000 with 0.0.0.0 to ensure external visibility
server.listen(3000, '0.0.0.0');

console.log('Server running on port 3000');