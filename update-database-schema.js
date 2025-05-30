/**
 * Database Schema Updates for Production
 * 
 * This script adds regulatory and compliance fields to the database schema
 * for the production environment.
 */

// Import the database schema tools
import { db } from "./server/db.js";
import { sql } from "drizzle-orm";

async function updateSchema() {
  console.log('Updating database schema with regulatory fields...');
  
  try {
    // Add regulatory_status field to legal_entities table
    await db.execute(sql`
      ALTER TABLE legal_entities 
      ADD COLUMN IF NOT EXISTS regulatory_status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS compliance_verified_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS compliance_verified_by VARCHAR(100),
      ADD COLUMN IF NOT EXISTS compliance_notes TEXT
    `);
    
    console.log('✅ Updated legal_entities table');
    
    // Add transaction_verification table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transaction_verifications (
        id SERIAL PRIMARY KEY,
        transaction_id INTEGER NOT NULL,
        verification_type VARCHAR(50) NOT NULL,
        verification_status VARCHAR(50) NOT NULL,
        verification_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        verified_by VARCHAR(100),
        blockchain_hash VARCHAR(255),
        verification_notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    console.log('✅ Created transaction_verifications table if needed');
    
    // Add regulatory fields to users table
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS aml_status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS aml_checked_at TIMESTAMP
    `);
    
    console.log('✅ Updated users table');
    
    // Add audit logging table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER,
        ip_address VARCHAR(50),
        user_agent TEXT,
        action_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        changes JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    console.log('✅ Created audit_logs table if needed');
    
    return {
      success: true,
      message: 'Database schema updated successfully with regulatory fields'
    };
  } catch (err) {
    console.error('❌ Error updating database schema:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

// Export the update function
export default updateSchema;
