/**
 * Vehicle Marketplace Server on Port 4000
 * 
 * This server handles vehicle marketplace functionality
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 4000;

// Set up CORS and security headers
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add security headers to allow inline styles and scripts for simplicity
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://images.unsplash.com; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Add static file handling for the client directory
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Set up vehicle data manually since we're having trouble importing the TS files
const vehicles = [
  {
    id: 1,
    make: "Toyota",
    model: "Camry",
    year: 2023,
    price: 28500,
    mileage: 1240,
    fuelType: "Gasoline",
    vehicleType: "Sedan",
    available: true,
    image: "https://images.unsplash.com/photo-1621007690695-b5088313ff2c?w=500&auto=format&fit=crop",
    dealerId: 1,
    blockchainVerified: true
  },
  {
    id: 2,
    make: "Honda",
    model: "Civic",
    year: 2022,
    price: 25900,
    mileage: 8350,
    fuelType: "Gasoline",
    vehicleType: "Sedan",
    available: true,
    image: "https://images.unsplash.com/photo-1590502090454-5f18cec8d157?w=500&auto=format&fit=crop",
    dealerId: 2,
    blockchainVerified: true
  },
  {
    id: 3,
    make: "Tesla",
    model: "Model 3",
    year: 2023,
    price: 49900,
    mileage: 120,
    fuelType: "Electric",
    vehicleType: "Sedan",
    available: true,
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=500&auto=format&fit=crop",
    dealerId: 3,
    blockchainVerified: true
  },
  {
    id: 4,
    make: "Ford",
    model: "F-150",
    year: 2022,
    price: 45000,
    mileage: 5600,
    fuelType: "Gasoline",
    vehicleType: "Truck",
    available: true,
    image: "https://images.unsplash.com/photo-1605893477799-b99e3b8b67db?w=500&auto=format&fit=crop",
    dealerId: 1,
    blockchainVerified: true
  },
  {
    id: 5,
    make: "Chevrolet",
    model: "Bolt",
    year: 2023,
    price: 36500,
    mileage: 450,
    fuelType: "Electric",
    vehicleType: "Hatchback",
    available: true,
    image: "https://images.unsplash.com/photo-1597007030134-7d8aad34a2c9?w=500&auto=format&fit=crop",
    dealerId: 2,
    blockchainVerified: true
  },
  {
    id: 6,
    make: "Toyota",
    model: "RAV4",
    year: 2023,
    price: 34900,
    mileage: 1850,
    fuelType: "Hybrid",
    vehicleType: "SUV",
    available: true,
    image: "https://images.unsplash.com/photo-1568637578549-52500e5276d3?w=500&auto=format&fit=crop",
    dealerId: 3,
    blockchainVerified: true
  }
];

// Set up dealership data manually
const dealerships = [
  {
    id: 1,
    name: "Premier Auto Group",
    address: "123 Main Street, Anytown, OH",
    phone: "555-123-4567",
    email: "sales@premierauto.com",
    website: "https://www.premierauto.com",
    latitude: 41.035272,
    longitude: -81.484648,
    rating: 4.7,
    reviews: 123,
    blockchainVerified: true
  },
  {
    id: 2,
    name: "Luxury Motors",
    address: "456 Oak Avenue, Othertown, OH",
    phone: "555-987-6543",
    email: "info@luxurymotors.com",
    website: "https://www.luxurymotors.com",
    latitude: 41.089783,
    longitude: -81.526956,
    rating: 4.5,
    reviews: 89,
    blockchainVerified: true
  },
  {
    id: 3,
    name: "EcoDrive Autos",
    address: "789 Green Street, Ecoville, OH",
    phone: "555-789-0123",
    email: "contact@ecodrive.com",
    website: "https://www.ecodrive.com",
    latitude: 41.142548,
    longitude: -81.435272,
    rating: 4.8,
    reviews: 156,
    blockchainVerified: true
  }
];

// API endpoints for vehicles
app.get('/api/vehicles', (req, res) => {
  try {
    const availableOnly = req.query.available !== 'false';
    const filteredVehicles = availableOnly 
      ? vehicles.filter(v => v.available)
      : vehicles;
    
    res.json({
      success: true,
      data: filteredVehicles,
      count: filteredVehicles.length
    });
  } catch (error) {
    console.error('Error handling vehicles request:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API endpoint for car dealerships
app.get('/api/car-dealerships', (req, res) => {
  try {
    // Add distance from the user's location if provided
    const defaultLat = 41.035272;
    const defaultLng = -81.484648;
    
    // Use query parameters if provided, otherwise use defaults
    const userLat = req.query.lat ? parseFloat(req.query.lat) : defaultLat;
    const userLng = req.query.lng ? parseFloat(req.query.lng) : defaultLng;
    
    // Calculate distance for each dealer
    const dealersWithDistance = dealerships.map(dealer => {
      let distance = null;
      
      if (dealer.latitude && dealer.longitude) {
        // Calculate distance using Haversine formula (in miles)
        const R = 3958.8; // Earth radius in miles
        const dLat = (dealer.latitude - userLat) * Math.PI / 180;
        const dLng = (dealer.longitude - userLng) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(userLat * Math.PI / 180) * Math.cos(dealer.latitude * Math.PI / 180) * 
          Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = parseFloat((R * c).toFixed(1)); // Distance in miles, rounded to 1 decimal
      }
      
      return {
        ...dealer,
        distance,
        formattedDistance: distance !== null ? `${distance} miles` : null
      };
    });
    
    // Sort by distance if available
    dealersWithDistance.sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
    
    res.json(dealersWithDistance);
  } catch (error) {
    console.error('Error handling dealerships request:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get a specific vehicle by ID
app.get('/api/vehicles/:id', (req, res) => {
  try {
    const vehicleId = parseInt(req.params.id);
    const vehicle = vehicles.find(v => v.id === vehicleId);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }
    
    // Add dealer information
    const dealer = dealerships.find(d => d.id === vehicle.dealerId);
    
    res.json({
      success: true,
      data: {
        ...vehicle,
        dealer
      }
    });
  } catch (error) {
    console.error('Error handling vehicle request:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Serve the index.html for the root path and any other unmatched routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Vehicle Marketplace server running on port ${PORT}`);
});