/**
 * Allocated Ports for Microservices
 * 
 * This file defines the port allocations for the Blocks of the Future platform.
 * Each service has a dedicated port to prevent conflicts.
 * 
 * These ports are aligned with the Replit networking panel allocations:
 * - Main application/Gateway: 5010 (external 80) <= CRITICAL: This must be mapped to port 80
 * - Banking: 5010 (external 3002)
 * - Investment: 5013 (external 3003)
 * - Crypto: 5019 (external 8080)
 * - Vehicle: 5021 (external 3006) <= Changed from 6000 (unsafe port) to 3006
 * - Delivery: 5007 (external 3000)
 * - Transaction: 3001 (external 5000)
 * - Authentication: 6008
 * - Compliance: 6009
 * - DoorDash: 7500
 */

export const ALLOCATED_PORTS = {
  GATEWAY: 5010,
  BANKING: 5010,
  INVESTMENT: 5013,
  CRYPTO: 5019,
  VEHICLE: 5021,
  DELIVERY: 5007,
  TRANSACTION: 5016, // Changed from 3001 to avoid conflicts
  EVENTBUS: 5010,
  AUTHENTICATION: 5017, // Changed from 6008 to avoid conflicts
  COMPLIANCE: 5018, // Changed from 6009 to avoid conflicts
  DOORDASH: 7500,
  MAIN: 5010
};

export const SERVICE_PORT_MAP = {
  "gateway": 5010,
  "banking": 5010,
  "investment": 5013,
  "crypto": 5019,
  "vehicle": 5021,
  "delivery": 5007,
  "transaction": 5016, // Changed from 3001 to avoid conflicts
  "eventbus": 5010,
  "authentication": 5017, // Changed from 6008 to avoid conflicts
  "compliance": 5018, // Changed from 6009 to avoid conflicts
  "doordash": 7500,
  "main": 5010
};
