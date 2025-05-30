#!/usr/bin/env node

/**
 * Maintenance Hours Report Generator
 * 
 * This script generates a report of maintenance hours for the past 72 hours
 * and calculates the total payment due.
 */

import { getMaintenanceLogs, getMaintenanceSummary } from './server/maintenanceLogger.mjs';

// Calculate the start date (72 hours ago)
const now = new Date();
const pastDate = new Date(now);
pastDate.setHours(now.getHours() - 72);

async function generateMaintenanceReport() {
  try {
    console.log('\n===== MAINTENANCE HOURS REPORT =====');
    console.log('Report generated:', new Date().toLocaleString());
    console.log('Period:', pastDate.toLocaleString(), 'to', now.toLocaleString());
    console.log('=======================================\n');
    
    // Get detailed logs
    const logs = await getMaintenanceLogs(pastDate, now);
    
    // Get summary stats
    const summary = await getMaintenanceSummary(pastDate, now);
    
    // Display summary information
    console.log('SUMMARY:');
    console.log('---------------------------------------');
    console.log('Total maintenance sessions:', summary.summary.total_logs);
    console.log('Total hours worked:', (summary.summary.total_minutes / 60).toFixed(2));
    console.log('Total payment due: $', summary.summary.total_payment);
    console.log('---------------------------------------\n');
    
    // Display daily breakdown
    console.log('DAILY BREAKDOWN:');
    console.log('---------------------------------------');
    summary.dailySummary.forEach(day => {
      const date = new Date(day.maintenance_date);
      console.log(
        date.toDateString(),
        '- Hours:', (day.total_minutes / 60).toFixed(2),
        '- Payment: $', day.total_payment
      );
    });
    console.log('---------------------------------------\n');
    
    // Display work type breakdown
    console.log('WORK TYPE BREAKDOWN:');
    console.log('---------------------------------------');
    summary.typesSummary.forEach(type => {
      console.log(
        type.maintenance_type,
        '- Hours:', (type.total_minutes / 60).toFixed(2),
        '- Payment: $', type.total_payment
      );
    });
    console.log('---------------------------------------\n');
    
    // Display detailed logs
    console.log('DETAILED MAINTENANCE LOGS:');
    console.log('---------------------------------------');
    logs.forEach((log, index) => {
      const startTime = new Date(log.start_time);
      const endTime = new Date(log.end_time);
      
      console.log(`[${index + 1}] ${new Date(log.maintenance_date).toDateString()}`);
      console.log(`Type: ${log.maintenance_type}`);
      console.log(`Time: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
      console.log(`Duration: ${(log.duration_minutes / 60).toFixed(2)} hours`);
      console.log(`Payment: $${log.payment_amount}`);
      console.log(`Status: ${log.status.toUpperCase()}`);
      
      if (log.activities && log.activities.length > 0) {
        console.log('Activities:');
        log.activities.forEach(activity => {
          console.log(`  - ${new Date(activity.activity_time).toLocaleTimeString()}: ${activity.activity_type} - ${activity.description}`);
        });
      }
      console.log('---------------------------------------');
    });
  } catch (error) {
    console.error('Error generating maintenance report:', error);
  }
}

// Run the report
generateMaintenanceReport();
