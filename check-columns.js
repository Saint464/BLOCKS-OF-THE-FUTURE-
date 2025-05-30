// ES Module to check database columns
import { neon } from '@neondatabase/serverless';

async function checkColumns() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions'
    `;
    
    console.log("Transaction table columns:");
    console.log(result);
    
    // Also check vehicle_deliveries
    const deliveryResult = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicle_deliveries'
    `;
    
    console.log("\nVehicle deliveries table columns:");
    console.log(deliveryResult);
  } catch (error) {
    console.error("Error checking columns:", error);
  }
}

checkColumns();