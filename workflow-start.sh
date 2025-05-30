#!/bin/bash

# Terminate existing node processes
pkill -f node || true

# Wait for ports to be released
sleep 2

# Start our simple HTTP server
node simple-http.js