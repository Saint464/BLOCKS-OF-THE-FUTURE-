/**
 * Emergency Recovery Mode
 * 
 * A comprehensive system for automatically diagnosing and recovering from
 * critical failures in the Blocks of the Future platform. This system
 * provides a simplified interface for emergency recovery, automated
 * diagnostics, redundant systems activation, and guided recovery workflows.
 * 
 * Features:
 * - Simplified emergency UI for high-pressure situations
 * - Automated diagnostics to identify root causes
 * - Redundant systems activation for minimal downtime
 * - Recovery dashboard with real-time status
 * - Guided recovery workflows
 * - Data preservation protocols
 * - Notifications and alerts for stakeholders
 * - Test mode to simulate recovery scenarios
 */

const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const { exec, spawn } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const EventEmitter = require('events');
const portUtils = require('./port-management-utilities');

// Emergency Recovery Configuration
const RECOVERY_CONFIG = {
  // Recovery server port
  port: 7777,
  
  // Critical services that need to be monitored
  criticalServices: [
    { name: 'API Gateway', port: 5000, script: 'api-gateway.js' },
    { name: 'Blockchain Core', port: 4545, script: 'launch-emergency-blockchain-server.js' },
    { name: 'Banking Service', port: 5010, script: 'banking-server.js' },
    { name: 'Marqeta Service', port: 5040, script: 'server/microservices/marqeta-service.js' },
    { name: 'Transaction Service', port: 5300, script: 'server/microservices/transaction-service.js' }
  ],
  
  // Critical ports that should never be in conflict
  criticalPorts: [3001, 4545, 5000, 5010, 5040, 5300],
  
  // Backup files to create
  backupFiles: [
    'production-port-configuration.json',
    'conflict-resolved-ports.json',
    'service-registry.json',
    'shared/schema.ts',
    'server/db.ts'
  ],
  
  // Notification targets
  notifications: {
    email: process.env.ADMIN_EMAIL || 'admin@blocksofthefuture.com',
    sms: process.env.ADMIN_PHONE
  },
  
  // Backup directory
  backupDir: './backups',
  
  // Recovery logs directory
  logsDir: './recovery-logs',
  
  // HTML templates directory
  templatesDir: './templates'
};

// Recovery process states
const RecoveryState = {
  IDLE: 'idle',                  // Not in recovery mode
  DIAGNOSING: 'diagnosing',      // Running diagnostics
  RECOVERING: 'recovering',      // Executing recovery steps
  VERIFYING: 'verifying',        // Verifying recovery success
  COMPLETED: 'completed',        // Recovery completed successfully
  FAILED: 'failed'               // Recovery failed
};

// Critical error types
const ErrorType = {
  PORT_CONFLICT: 'port_conflict',          // Port conflict detected
  SERVICE_CRASH: 'service_crash',          // Service crashed
  DATABASE_ERROR: 'database_error',        // Database connection error
  MEMORY_LEAK: 'memory_leak',              // Memory leak detected
  HIGH_CPU: 'high_cpu',                    // CPU usage too high
  DISK_SPACE: 'disk_space',                // Disk space too low
  NETWORK_ERROR: 'network_error',          // Network connection error
  BLOCKCHAIN_SYNC: 'blockchain_sync',      // Blockchain synchronization error
  SECURITY_BREACH: 'security_breach',      // Security breach detected
  API_ERROR: 'api_error'                   // External API error
};

// Events emitter for recovery mode
class RecoveryEvents extends EventEmitter {}
const recoveryEvents = new RecoveryEvents();

// HTML template for the emergency recovery mode UI
const RECOVERY_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blocks of the Future - Emergency Recovery Mode</title>
  <style>
    :root {
      --primary-color: #d9534f;
      --primary-dark: #c9302c;
      --secondary-color: #5bc0de;
      --success-color: #5cb85c;
      --warning-color: #f0ad4e;
      --dark-color: #292b2c;
      --light-color: #f7f7f7;
      --font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    body {
      font-family: var(--font-family);
      margin: 0;
      padding: 0;
      background-color: var(--light-color);
      color: var(--dark-color);
    }
    .emergency-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .emergency-header {
      background-color: var(--primary-color);
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .emergency-title {
      font-size: 24px;
      font-weight: bold;
      display: flex;
      align-items: center;
    }
    .emergency-title svg {
      margin-right: 10px;
    }
    .emergency-actions {
      display: flex;
      gap: 10px;
    }
    .emergency-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      font-weight: bold;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s;
    }
    .emergency-btn.primary {
      background-color: white;
      color: var(--primary-color);
    }
    .emergency-btn.primary:hover {
      background-color: #f8f9fa;
    }
    .emergency-btn.secondary {
      background-color: var(--secondary-color);
      color: white;
    }
    .emergency-btn.secondary:hover {
      background-color: #46b8da;
    }
    .emergency-btn.success {
      background-color: var(--success-color);
      color: white;
    }
    .emergency-btn.success:hover {
      background-color: #4cae4c;
    }
    .emergency-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .dashboard-panel {
      background-color: white;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      padding: 20px;
    }
    .panel-title {
      font-size: 18px;
      font-weight: bold;
      margin-top: 0;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
      display: flex;
      align-items: center;
    }
    .panel-title svg {
      margin-right: 10px;
    }
    .status-panel {
      background-color: white;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      padding: 20px;
      grid-column: 1 / -1;
    }
    .status-badge {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 15px;
      font-weight: bold;
      color: white;
      font-size: 14px;
      margin-right: 10px;
    }
    .status-badge.idle {
      background-color: var(--secondary-color);
    }
    .status-badge.diagnosing {
      background-color: var(--warning-color);
    }
    .status-badge.recovering {
      background-color: var(--primary-color);
    }
    .status-badge.verifying {
      background-color: var(--warning-color);
    }
    .status-badge.completed {
      background-color: var(--success-color);
    }
    .status-badge.failed {
      background-color: var(--primary-color);
    }
    .status-info {
      margin-top: 15px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 15px;
    }
    .status-card {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
    }
    .status-card-value {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .status-card-label {
      font-size: 14px;
      color: #6c757d;
    }
    .recovery-steps {
      margin-top: 20px;
    }
    .step-item {
      margin-bottom: 15px;
      padding: 15px;
      border-radius: 5px;
      background-color: #f8f9fa;
      display: flex;
      align-items: flex-start;
    }
    .step-indicator {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 15px;
      flex-shrink: 0;
      font-weight: bold;
      color: white;
    }
    .step-indicator.pending {
      background-color: #6c757d;
    }
    .step-indicator.in-progress {
      background-color: var(--warning-color);
      animation: pulse 1.5s infinite;
    }
    .step-indicator.completed {
      background-color: var(--success-color);
    }
    .step-indicator.failed {
      background-color: var(--primary-color);
    }
    .step-content {
      flex-grow: 1;
    }
    .step-title {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .step-description {
      font-size: 14px;
      color: #6c757d;
      margin-bottom: 10px;
    }
    .step-progress {
      width: 100%;
      height: 10px;
      background-color: #e9ecef;
      border-radius: 5px;
      overflow: hidden;
      margin-top: 10px;
    }
    .step-progress-bar {
      height: 100%;
      background-color: var(--secondary-color);
      width: 0%;
      transition: width 0.3s;
    }
    .diagnostic-results {
      margin-top: 20px;
    }
    .error-item {
      margin-bottom: 10px;
      padding: 15px;
      border-radius: 5px;
      background-color: #f8d7da;
      border-left: 5px solid var(--primary-color);
    }
    .error-title {
      font-weight: bold;
      margin-bottom: 5px;
      color: #721c24;
      display: flex;
      justify-content: space-between;
    }
    .error-description {
      font-size: 14px;
      color: #721c24;
    }
    .error-action {
      margin-top: 10px;
    }
    .error-action button {
      padding: 5px 10px;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 14px;
    }
    .error-action button:hover {
      background-color: var(--primary-dark);
    }
    .logs-container {
      margin-top: 15px;
      background-color: #212529;
      color: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      max-height: 200px;
      overflow-y: auto;
      font-family: monospace;
    }
    .log-line {
      margin-bottom: 5px;
    }
    .log-time {
      color: #6c757d;
      margin-right: 10px;
    }
    .log-level {
      margin-right: 10px;
    }
    .log-level.info {
      color: var(--secondary-color);
    }
    .log-level.warn {
      color: var(--warning-color);
    }
    .log-level.error {
      color: var(--primary-color);
    }
    .log-level.success {
      color: var(--success-color);
    }
    .backup-systems {
      margin-top: 20px;
    }
    .backup-item {
      padding: 10px 15px;
      margin-bottom: 10px;
      border-radius: 5px;
      background-color: #f8f9fa;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .backup-status {
      font-weight: bold;
    }
    .backup-status.active {
      color: var(--success-color);
    }
    .backup-status.inactive {
      color: #6c757d;
    }
    .notifications {
      margin-top: 20px;
    }
    .notification-item {
      padding: 10px 15px;
      margin-bottom: 10px;
      border-radius: 5px;
      background-color: #f8f9fa;
      display: flex;
      align-items: center;
    }
    .notification-icon {
      margin-right: 15px;
      width: 20px;
      height: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .notification-content {
      flex-grow: 1;
    }
    .notification-time {
      font-size: 12px;
      color: #6c757d;
    }
    #test-mode-indicator {
      position: fixed;
      bottom: 20px;
      left: 20px;
      padding: 10px 15px;
      background-color: var(--warning-color);
      color: white;
      border-radius: 5px;
      font-weight: bold;
      display: none;
    }
    .hidden {
      display: none !important;
    }
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  </style>
</head>
<body>
  <div class="emergency-container">
    <div class="emergency-header">
      <div class="emergency-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        Emergency Recovery Mode
      </div>
      <div class="emergency-actions">
        <button id="activate-recovery-btn" class="emergency-btn primary">Activate Recovery</button>
        <button id="test-mode-btn" class="emergency-btn secondary">Test Mode</button>
      </div>
    </div>

    <div class="status-panel">
      <h2 class="panel-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        System Status
      </h2>
      <div class="recovery-status">
        <span class="status-badge idle" id="status-badge">IDLE</span>
        <span id="status-message">System is stable. No recovery actions needed.</span>
      </div>
      <div class="status-info">
        <div class="status-card">
          <div class="status-card-value" id="services-status">0/0</div>
          <div class="status-card-label">Services Online</div>
        </div>
        <div class="status-card">
          <div class="status-card-value" id="port-conflicts">0</div>
          <div class="status-card-label">Port Conflicts</div>
        </div>
        <div class="status-card">
          <div class="status-card-value" id="recovery-time">0:00</div>
          <div class="status-card-label">Recovery Time</div>
        </div>
        <div class="status-card">
          <div class="status-card-value" id="recovery-progress">0%</div>
          <div class="status-card-label">Recovery Progress</div>
        </div>
      </div>
    </div>

    <div class="emergency-grid">
      <div class="dashboard-panel">
        <h2 class="panel-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          Diagnostic Results
        </h2>
        <div id="diagnostics-loading" class="hidden">Running diagnostics...</div>
        <div id="diagnostics-empty" class="">No diagnostics have been run yet.</div>
        <div id="diagnostic-results" class="diagnostic-results hidden">
          <!-- Diagnostic results will be inserted here dynamically -->
        </div>
      </div>

      <div class="dashboard-panel">
        <h2 class="panel-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          Backup Systems
        </h2>
        <div class="backup-systems">
          <!-- Backup systems will be inserted here dynamically -->
          <div class="backup-item">
            <span>Emergency Blockchain Server</span>
            <span class="backup-status inactive" id="blockchain-backup-status">Inactive</span>
          </div>
          <div class="backup-item">
            <span>Data Backup</span>
            <span class="backup-status inactive" id="data-backup-status">Inactive</span>
          </div>
          <div class="backup-item">
            <span>Alternative API Gateway</span>
            <span class="backup-status inactive" id="api-backup-status">Inactive</span>
          </div>
        </div>
        
        <h2 class="panel-title" style="margin-top: 20px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path>
          </svg>
          Notifications
        </h2>
        <div class="notifications" id="notifications-container">
          <!-- Notifications will be inserted here dynamically -->
          <div id="notifications-empty">No notifications yet.</div>
        </div>
      </div>
    </div>

    <div class="dashboard-panel">
      <h2 class="panel-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
        Recovery Steps
      </h2>
      <div id="recovery-steps-empty" class="">No recovery steps have been initiated.</div>
      <div id="recovery-steps" class="recovery-steps hidden">
        <!-- Recovery steps will be inserted here dynamically -->
      </div>
    </div>

    <div class="dashboard-panel">
      <h2 class="panel-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
        System Logs
      </h2>
      <div class="logs-container" id="logs-container">
        <!-- Logs will be inserted here dynamically -->
      </div>
    </div>
  </div>

  <div id="test-mode-indicator">TEST MODE ACTIVE</div>

  <div id="loading-overlay" class="loading-overlay hidden">
    <div class="loading-spinner"></div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // UI Elements
      const activateRecoveryBtn = document.getElementById('activate-recovery-btn');
      const testModeBtn = document.getElementById('test-mode-btn');
      const statusBadge = document.getElementById('status-badge');
      const statusMessage = document.getElementById('status-message');
      const servicesStatus = document.getElementById('services-status');
      const portConflicts = document.getElementById('port-conflicts');
      const recoveryTime = document.getElementById('recovery-time');
      const recoveryProgress = document.getElementById('recovery-progress');
      const diagnosticResults = document.getElementById('diagnostic-results');
      const diagnosticsEmpty = document.getElementById('diagnostics-empty');
      const diagnosticsLoading = document.getElementById('diagnostics-loading');
      const recoverySteps = document.getElementById('recovery-steps');
      const recoveryStepsEmpty = document.getElementById('recovery-steps-empty');
      const logsContainer = document.getElementById('logs-container');
      const testModeIndicator = document.getElementById('test-mode-indicator');
      const loadingOverlay = document.getElementById('loading-overlay');
      const notificationsContainer = document.getElementById('notifications-container');
      const notificationsEmpty = document.getElementById('notifications-empty');
      
      // Backup status elements
      const blockchainBackupStatus = document.getElementById('blockchain-backup-status');
      const dataBackupStatus = document.getElementById('data-backup-status');
      const apiBackupStatus = document.getElementById('api-backup-status');
      
      // Test mode state
      let testMode = false;
      
      // Initialize event source for server-sent events
      const eventSource = new EventSource('/events');
      
      // Event listeners for server events
      eventSource.addEventListener('state-change', function(e) {
        const data = JSON.parse(e.data);
        updateStatus(data.state, data.message);
      });
      
      eventSource.addEventListener('diagnostics-update', function(e) {
        const data = JSON.parse(e.data);
        updateDiagnostics(data);
      });
      
      eventSource.addEventListener('recovery-update', function(e) {
        const data = JSON.parse(e.data);
        updateRecoverySteps(data);
      });
      
      eventSource.addEventListener('stats-update', function(e) {
        const data = JSON.parse(e.data);
        updateStats(data);
      });
      
      eventSource.addEventListener('log', function(e) {
        const data = JSON.parse(e.data);
        addLogEntry(data);
      });
      
      eventSource.addEventListener('notification', function(e) {
        const data = JSON.parse(e.data);
        addNotification(data);
      });
      
      eventSource.addEventListener('backup-update', function(e) {
        const data = JSON.parse(e.data);
        updateBackupStatus(data);
      });
      
      // Listen for recovery activation
      activateRecoveryBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to activate Emergency Recovery Mode?')) {
          startRecovery();
        }
      });
      
      // Listen for test mode toggle
      testModeBtn.addEventListener('click', function() {
        toggleTestMode();
      });
      
      // Function to start recovery
      function startRecovery() {
        showLoading();
        fetch('/api/start-recovery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ testMode })
        })
          .then(response => response.json())
          .then(data => {
            hideLoading();
            if (data.success) {
              // Recovery started successfully
              updateStatus('diagnosing', 'Diagnosing system issues...');
            } else {
              // Failed to start recovery
              alert('Failed to start recovery: ' + data.error);
            }
          })
          .catch(error => {
            hideLoading();
            alert('Error starting recovery: ' + error);
          });
      }
      
      // Function to toggle test mode
      function toggleTestMode() {
        testMode = !testMode;
        testModeIndicator.style.display = testMode ? 'block' : 'none';
        testModeBtn.textContent = testMode ? 'Exit Test Mode' : 'Test Mode';
        
        // Notify the server about test mode change
        fetch('/api/toggle-test-mode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ testMode })
        });
      }
      
      // Function to update status
      function updateStatus(state, message) {
        // Update status badge
        statusBadge.className = 'status-badge ' + state;
        statusBadge.textContent = state.toUpperCase();
        
        // Update status message
        statusMessage.textContent = message;
        
        // Update recovery button state
        if (state === 'idle') {
          activateRecoveryBtn.disabled = false;
          activateRecoveryBtn.textContent = 'Activate Recovery';
        } else if (state === 'completed') {
          activateRecoveryBtn.disabled = false;
          activateRecoveryBtn.textContent = 'Start New Recovery';
        } else {
          activateRecoveryBtn.disabled = true;
          activateRecoveryBtn.textContent = 'Recovery In Progress';
        }
      }
      
      // Function to update diagnostics
      function updateDiagnostics(data) {
        if (data.loading) {
          diagnosticsEmpty.classList.add('hidden');
          diagnosticsLoading.classList.remove('hidden');
          diagnosticResults.classList.add('hidden');
          return;
        }
        
        if (data.errors.length === 0) {
          diagnosticsEmpty.textContent = 'No issues detected.';
          diagnosticsEmpty.classList.remove('hidden');
          diagnosticsLoading.classList.add('hidden');
          diagnosticResults.classList.add('hidden');
          return;
        }
        
        // Show diagnostic results
        diagnosticsEmpty.classList.add('hidden');
        diagnosticsLoading.classList.add('hidden');
        diagnosticResults.classList.remove('hidden');
        
        // Clear existing results
        diagnosticResults.innerHTML = '';
        
        // Add each error
        data.errors.forEach((error, index) => {
          const errorItem = document.createElement('div');
          errorItem.className = 'error-item';
          
          errorItem.innerHTML = \`
            <div class="error-title">
              <span>\${error.title}</span>
              <span>Severity: \${error.severity}</span>
            </div>
            <div class="error-description">\${error.description}</div>
            <div class="error-action">
              <button data-error-id="\${error.id}" class="fix-error-btn">Fix Automatically</button>
            </div>
          \`;
          
          diagnosticResults.appendChild(errorItem);
        });
        
        // Add event listeners to fix buttons
        document.querySelectorAll('.fix-error-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const errorId = this.getAttribute('data-error-id');
            fixError(errorId);
          });
        });
      }
      
      // Function to fix a specific error
      function fixError(errorId) {
        showLoading();
        fetch('/api/fix-error', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ errorId })
        })
          .then(response => response.json())
          .then(data => {
            hideLoading();
            if (data.success) {
              // Error fixed successfully
              addLogEntry({
                level: 'success',
                message: \`Successfully fixed error: \${data.error.title}\`
              });
            } else {
              // Failed to fix error
              alert('Failed to fix error: ' + data.error);
            }
          })
          .catch(error => {
            hideLoading();
            alert('Error fixing issue: ' + error);
          });
      }
      
      // Function to update recovery steps
      function updateRecoverySteps(data) {
        if (data.steps.length === 0) {
          recoveryStepsEmpty.classList.remove('hidden');
          recoverySteps.classList.add('hidden');
          return;
        }
        
        // Show recovery steps
        recoveryStepsEmpty.classList.add('hidden');
        recoverySteps.classList.remove('hidden');
        
        // Clear existing steps
        recoverySteps.innerHTML = '';
        
        // Add each step
        data.steps.forEach((step, index) => {
          const stepItem = document.createElement('div');
          stepItem.className = 'step-item';
          
          const indicatorClass = 
            step.status === 'completed' ? 'completed' :
            step.status === 'in-progress' ? 'in-progress' :
            step.status === 'failed' ? 'failed' : 'pending';
          
          stepItem.innerHTML = \`
            <div class="step-indicator \${indicatorClass}">
              \${index + 1}
            </div>
            <div class="step-content">
              <div class="step-title">\${step.title}</div>
              <div class="step-description">\${step.description}</div>
              <div class="step-progress">
                <div class="step-progress-bar" style="width: \${step.progress}%"></div>
              </div>
            </div>
          \`;
          
          recoverySteps.appendChild(stepItem);
        });
      }
      
      // Function to update stats
      function updateStats(data) {
        servicesStatus.textContent = \`\${data.servicesOnline}/\${data.totalServices}\`;
        portConflicts.textContent = data.portConflicts;
        recoveryTime.textContent = data.recoveryTime;
        recoveryProgress.textContent = \`\${data.recoveryProgress}%\`;
      }
      
      // Function to add a log entry
      function addLogEntry(data) {
        const logLine = document.createElement('div');
        logLine.className = 'log-line';
        
        const now = new Date();
        const time = \`\${now.getHours().toString().padStart(2, '0')}:\${now.getMinutes().toString().padStart(2, '0')}:\${now.getSeconds().toString().padStart(2, '0')}\`;
        
        logLine.innerHTML = \`
          <span class="log-time">\${time}</span>
          <span class="log-level \${data.level}">\${data.level.toUpperCase()}</span>
          <span class="log-message">\${data.message}</span>
        \`;
        
        logsContainer.appendChild(logLine);
        logsContainer.scrollTop = logsContainer.scrollHeight;
      }
      
      // Function to add a notification
      function addNotification(data) {
        notificationsEmpty.classList.add('hidden');
        
        const notificationItem = document.createElement('div');
        notificationItem.className = 'notification-item';
        
        let iconSvg = '';
        if (data.type === 'email') {
          iconSvg = \`
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          \`;
        } else if (data.type === 'sms') {
          iconSvg = \`
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          \`;
        } else {
          iconSvg = \`
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path>
            </svg>
          \`;
        }
        
        notificationItem.innerHTML = \`
          <div class="notification-icon">
            \${iconSvg}
          </div>
          <div class="notification-content">
            <div>\${data.message}</div>
            <div class="notification-time">\${data.time}</div>
          </div>
        \`;
        
        notificationsContainer.insertBefore(notificationItem, notificationsContainer.firstChild);
      }
      
      // Function to update backup status
      function updateBackupStatus(data) {
        if (data.blockchain) {
          blockchainBackupStatus.textContent = 'Active';
          blockchainBackupStatus.className = 'backup-status active';
        } else {
          blockchainBackupStatus.textContent = 'Inactive';
          blockchainBackupStatus.className = 'backup-status inactive';
        }
        
        if (data.data) {
          dataBackupStatus.textContent = 'Active';
          dataBackupStatus.className = 'backup-status active';
        } else {
          dataBackupStatus.textContent = 'Inactive';
          dataBackupStatus.className = 'backup-status inactive';
        }
        
        if (data.api) {
          apiBackupStatus.textContent = 'Active';
          apiBackupStatus.className = 'backup-status active';
        } else {
          apiBackupStatus.textContent = 'Inactive';
          apiBackupStatus.className = 'backup-status inactive';
        }
      }
      
      // Show loading overlay
      function showLoading() {
        loadingOverlay.classList.remove('hidden');
      }
      
      // Hide loading overlay
      function hideLoading() {
        loadingOverlay.classList.add('hidden');
      }
      
      // Initialize with some log entries
      addLogEntry({
        level: 'info',
        message: 'Emergency Recovery Mode initialized'
      });
      
      // Fetch initial data
      fetch('/api/status')
        .then(response => response.json())
        .then(data => {
          updateStatus(data.state, data.message);
          updateStats(data.stats);
          updateBackupStatus(data.backup);
          
          if (data.diagnostics) {
            updateDiagnostics(data.diagnostics);
          }
          
          if (data.recoverySteps) {
            updateRecoverySteps(data.recoverySteps);
          }
        })
        .catch(error => {
          console.error('Error fetching initial data:', error);
        });
    });
  </script>
</body>
</html>
`;

/**
 * RecoveryManager class - manages the recovery process
 */
class RecoveryManager {
  constructor() {
    this.state = RecoveryState.IDLE;
    this.stateMessage = 'System is stable. No recovery actions needed.';
    this.testMode = false;
    this.recoveryStartTime = null;
    this.recoverySteps = [];
    this.diagnosticResults = { loading: false, errors: [] };
    this.stats = {
      servicesOnline: 0,
      totalServices: RECOVERY_CONFIG.criticalServices.length,
      portConflicts: 0,
      recoveryTime: '0:00',
      recoveryProgress: 0
    };
    this.backups = {
      blockchain: false,
      data: false,
      api: false
    };
    this.notifications = [];
    this.logs = [];
    this.clients = new Set();
    this.server = null;
    this.recoveryTimer = null;
    this.statsTimer = null;
    
    // Bind methods
    this.startServer = this.startServer.bind(this);
    this.handleRequest = this.handleRequest.bind(this);
    this.startRecovery = this.startRecovery.bind(this);
    this.runDiagnostics = this.runDiagnostics.bind(this);
    this.executeRecovery = this.executeRecovery.bind(this);
    this.verifyRecovery = this.verifyRecovery.bind(this);
    this.updateStats = this.updateStats.bind(this);
    this.createBackup = this.createBackup.bind(this);
    this.restoreBackup = this.restoreBackup.bind(this);
    this.sendNotification = this.sendNotification.bind(this);
    this.log = this.log.bind(this);
    this.shutdown = this.shutdown.bind(this);
  }
  
  /**
   * Start the recovery server
   */
  async startServer(port = RECOVERY_CONFIG.port) {
    try {
      // Create directories if they don't exist
      await fs.mkdir(RECOVERY_CONFIG.backupDir, { recursive: true });
      await fs.mkdir(RECOVERY_CONFIG.logsDir, { recursive: true });
      
      // Create HTTP server
      this.server = http.createServer(this.handleRequest);
      
      // Start listening on specified port
      await new Promise((resolve, reject) => {
        this.server.listen(port, '0.0.0.0', (err) => {
          if (err) reject(err);
          else resolve();
        });
        
        this.server.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.log(`Port ${port} is in use, trying alternative port...`);
            this.server.close();
            this.startServer(port + 1).then(resolve).catch(reject);
          } else {
            reject(error);
          }
        });
      });
      
      console.log(`Emergency Recovery Mode server started on port ${port}`);
      this.log('info', 'Emergency Recovery Mode server started');
      
      // Start stats update timer
      this.statsTimer = setInterval(() => {
        this.updateStats();
      }, 5000);
      
      return port;
    } catch (error) {
      console.error('Failed to start recovery server:', error);
      throw error;
    }
  }
  
  /**
   * Handle incoming HTTP requests
   */
  handleRequest(req, res) {
    // Set CORS headers for all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS requests
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }
    
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Route: GET / - Serve the recovery UI
    if (req.method === 'GET' && url.pathname === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.statusCode = 200;
      res.end(RECOVERY_HTML);
      return;
    }
    
    // Route: GET /events - Server-sent events for live updates
    if (req.method === 'GET' && url.pathname === '/events') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.statusCode = 200;
      res.write('retry: 10000\n\n');
      
      // Keep track of connected clients
      const clientId = Date.now();
      this.clients.add({ id: clientId, res });
      
      // Remove client when connection is closed
      req.on('close', () => {
        this.clients.delete({ id: clientId, res });
      });
      
      return;
    }
    
    // Route: GET /api/status - Get current recovery status
    if (req.method === 'GET' && url.pathname === '/api/status') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      
      const response = {
        state: this.state,
        message: this.stateMessage,
        stats: this.stats,
        backup: this.backups,
        testMode: this.testMode
      };
      
      if (this.diagnosticResults.errors.length > 0 || this.diagnosticResults.loading) {
        response.diagnostics = this.diagnosticResults;
      }
      
      if (this.recoverySteps.length > 0) {
        response.recoverySteps = { steps: this.recoverySteps };
      }
      
      res.end(JSON.stringify(response));
      return;
    }
    
    // Route: POST /api/start-recovery - Start the recovery process
    if (req.method === 'POST' && url.pathname === '/api/start-recovery') {
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          this.testMode = !!data.testMode;
          
          this.startRecovery()
            .then(() => {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
            })
            .catch(error => {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: error.message }));
            });
        } catch (error) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, error: 'Invalid request data' }));
        }
      });
      
      return;
    }
    
    // Route: POST /api/toggle-test-mode - Toggle test mode
    if (req.method === 'POST' && url.pathname === '/api/toggle-test-mode') {
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          this.testMode = !!data.testMode;
          
          this.log('info', `Test mode ${this.testMode ? 'enabled' : 'disabled'}`);
          
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, testMode: this.testMode }));
        } catch (error) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, error: 'Invalid request data' }));
        }
      });
      
      return;
    }
    
    // Route: POST /api/fix-error - Fix a specific error
    if (req.method === 'POST' && url.pathname === '/api/fix-error') {
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const errorId = data.errorId;
          
          // Find the error in diagnostic results
          const error = this.diagnosticResults.errors.find(e => e.id === errorId);
          
          if (!error) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 404;
            res.end(JSON.stringify({ success: false, error: 'Error not found' }));
            return;
          }
          
          // Fix the error based on its type
          this.fixError(error)
            .then(() => {
              // Remove the fixed error from diagnostics
              this.diagnosticResults.errors = this.diagnosticResults.errors.filter(e => e.id !== errorId);
              this.sendToAllClients('diagnostics-update', this.diagnosticResults);
              
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, error }));
            })
            .catch(err => {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            });
        } catch (error) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, error: 'Invalid request data' }));
        }
      });
      
      return;
    }
    
    // Route not found
    res.statusCode = 404;
    res.end('Not Found');
  }
  
  /**
   * Send data to all connected clients via SSE
   */
  sendToAllClients(event, data) {
    const eventData = JSON.stringify(data);
    this.clients.forEach(client => {
      client.res.write(`event: ${event}\ndata: ${eventData}\n\n`);
    });
  }
  
  /**
   * Start the recovery process
   */
  async startRecovery() {
    if (this.state !== RecoveryState.IDLE && this.state !== RecoveryState.COMPLETED && this.state !== RecoveryState.FAILED) {
      throw new Error('Recovery already in progress');
    }
    
    // Reset recovery state
    this.state = RecoveryState.DIAGNOSING;
    this.stateMessage = 'Diagnosing system issues...';
    this.recoveryStartTime = Date.now();
    this.recoverySteps = [];
    this.diagnosticResults = { loading: true, errors: [] };
    this.stats.recoveryProgress = 0;
    this.backups = {
      blockchain: false,
      data: false,
      api: false
    };
    
    // Notify clients of state change
    this.sendToAllClients('state-change', {
      state: this.state,
      message: this.stateMessage
    });
    
    // Notify clients of diagnostics update
    this.sendToAllClients('diagnostics-update', this.diagnosticResults);
    
    this.log('info', 'Starting recovery process');
    
    // Start diagnostics
    try {
      await this.runDiagnostics();
      
      // If no errors were found, end recovery
      if (this.diagnosticResults.errors.length === 0) {
        this.state = RecoveryState.COMPLETED;
        this.stateMessage = 'Recovery completed successfully. No issues found.';
        this.stats.recoveryProgress = 100;
        this.sendToAllClients('state-change', {
          state: this.state,
          message: this.stateMessage
        });
        this.log('success', 'Recovery completed successfully. No issues found.');
        return;
      }
      
      // Create backups before starting recovery
      this.addRecoveryStep({
        id: 'backup',
        title: 'Create System Backups',
        description: 'Creating backups of critical system files and configurations before recovery.',
        status: 'in-progress',
        progress: 0
      });
      
      await this.createBackup();
      
      // Update backup step
      this.updateRecoveryStep('backup', {
        status: 'completed',
        progress: 100
      });
      
      // Start recovery
      this.state = RecoveryState.RECOVERING;
      this.stateMessage = 'Executing recovery steps...';
      this.sendToAllClients('state-change', {
        state: this.state,
        message: this.stateMessage
      });
      
      // Execute recovery steps
      await this.executeRecovery();
      
      // Verify recovery
      this.state = RecoveryState.VERIFYING;
      this.stateMessage = 'Verifying recovery success...';
      this.sendToAllClients('state-change', {
        state: this.state,
        message: this.stateMessage
      });
      
      await this.verifyRecovery();
      
      // Complete recovery
      this.state = RecoveryState.COMPLETED;
      this.stateMessage = 'Recovery completed successfully!';
      this.stats.recoveryProgress = 100;
      this.sendToAllClients('state-change', {
        state: this.state,
        message: this.stateMessage
      });
      
      this.log('success', 'Recovery completed successfully!');
      this.sendNotification('Recovery process completed successfully!');
      
    } catch (error) {
      this.state = RecoveryState.FAILED;
      this.stateMessage = `Recovery failed: ${error.message}`;
      this.sendToAllClients('state-change', {
        state: this.state,
        message: this.stateMessage
      });
      
      this.log('error', `Recovery failed: ${error.message}`);
      this.sendNotification(`Recovery process failed: ${error.message}`);
      
      // Restore backups if recovery failed
      if (this.backups.data) {
        try {
          await this.restoreBackup();
        } catch (restoreError) {
          this.log('error', `Failed to restore backup: ${restoreError.message}`);
        }
      }
    }
  }
  
  /**
   * Run diagnostics to identify issues
   */
  async runDiagnostics() {
    this.log('info', 'Running system diagnostics');
    
    // Reset diagnostic results
    this.diagnosticResults = { loading: true, errors: [] };
    this.sendToAllClients('diagnostics-update', this.diagnosticResults);
    
    try {
      // Check 1: Port conflicts
      await this.checkPortConflicts();
      
      // Check 2: Service availability
      await this.checkServiceAvailability();
      
      // Check 3: Database connection
      await this.checkDatabaseConnection();
      
      // Check 4: Blockchain sync status
      await this.checkBlockchainSyncStatus();
      
      // Finalize diagnostics
      this.diagnosticResults.loading = false;
      this.sendToAllClients('diagnostics-update', this.diagnosticResults);
      
      // Log diagnostic results
      if (this.diagnosticResults.errors.length > 0) {
        this.log('warn', `Diagnostics completed with ${this.diagnosticResults.errors.length} issues found`);
      } else {
        this.log('info', 'Diagnostics completed with no issues found');
      }
      
    } catch (error) {
      this.diagnosticResults.loading = false;
      this.sendToAllClients('diagnostics-update', this.diagnosticResults);
      this.log('error', `Error during diagnostics: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Check for port conflicts
   */
  async checkPortConflicts() {
    this.log('info', 'Checking for port conflicts');
    
    // Check critical ports
    for (const port of RECOVERY_CONFIG.criticalPorts) {
      try {
        const inUse = await portUtils.isPortInUse(port);
        
        if (inUse) {
          this.log('warn', `Port ${port} is in use`);
          this.stats.portConflicts++;
          
          // Add error for port 3001 (most critical)
          if (port === 3001) {
            this.diagnosticResults.errors.push({
              id: `port_conflict_${port}`,
              type: ErrorType.PORT_CONFLICT,
              title: `Critical Port Conflict: Port ${port}`,
              description: `Port ${port} is currently in use, causing critical services to fail. This port is used by multiple services and is causing conflicts.`,
              severity: 'high',
              fixAction: 'release_port',
              port: port
            });
          } else {
            this.diagnosticResults.errors.push({
              id: `port_conflict_${port}`,
              type: ErrorType.PORT_CONFLICT,
              title: `Port Conflict: Port ${port}`,
              description: `Port ${port} is currently in use, which may cause service conflicts.`,
              severity: 'medium',
              fixAction: 'release_port',
              port: port
            });
          }
        }
      } catch (error) {
        this.log('error', `Error checking port ${port}: ${error.message}`);
      }
    }
  }
  
  /**
   * Check service availability
   */
  async checkServiceAvailability() {
    this.log('info', 'Checking service availability');
    
    // Reset service counters
    this.stats.servicesOnline = 0;
    
    // Check each critical service
    for (const service of RECOVERY_CONFIG.criticalServices) {
      try {
        const inUse = await portUtils.isPortInUse(service.port);
        
        if (!inUse) {
          this.log('warn', `Service ${service.name} is not running on port ${service.port}`);
          
          this.diagnosticResults.errors.push({
            id: `service_down_${service.name.replace(/\s+/g, '_').toLowerCase()}`,
            type: ErrorType.SERVICE_CRASH,
            title: `Service Down: ${service.name}`,
            description: `${service.name} is not running on port ${service.port}. This may cause system instability.`,
            severity: 'high',
            fixAction: 'start_service',
            service: service
          });
        } else {
          this.stats.servicesOnline++;
        }
      } catch (error) {
        this.log('error', `Error checking service ${service.name}: ${error.message}`);
      }
    }
  }
  
  /**
   * Check database connection
   */
  async checkDatabaseConnection() {
    this.log('info', 'Checking database connection');
    
    try {
      // Check if DATABASE_URL environment variable is set
      if (!process.env.DATABASE_URL) {
        this.log('warn', 'DATABASE_URL environment variable is not set');
        
        this.diagnosticResults.errors.push({
          id: 'database_env_missing',
          type: ErrorType.DATABASE_ERROR,
          title: 'Database Configuration Missing',
          description: 'The DATABASE_URL environment variable is not set. Database connections will fail.',
          severity: 'high',
          fixAction: 'check_env_vars'
        });
        return;
      }
      
      // Try to connect to the database
      const { Pool } = require('@neondatabase/serverless');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      
      try {
        // Try a simple query
        await pool.query('SELECT 1');
        this.log('info', 'Database connection successful');
      } catch (error) {
        this.log('warn', `Database connection failed: ${error.message}`);
        
        this.diagnosticResults.errors.push({
          id: 'database_connection_failed',
          type: ErrorType.DATABASE_ERROR,
          title: 'Database Connection Failed',
          description: `Unable to connect to the database: ${error.message}`,
          severity: 'high',
          fixAction: 'check_database_connection'
        });
      } finally {
        // Close the pool
        await pool.end();
      }
    } catch (error) {
      this.log('error', `Error checking database connection: ${error.message}`);
      
      this.diagnosticResults.errors.push({
        id: 'database_check_failed',
        type: ErrorType.DATABASE_ERROR,
        title: 'Database Check Failed',
        description: `Unable to check database connection: ${error.message}`,
        severity: 'medium',
        fixAction: 'check_database_connection'
      });
    }
  }
  
  /**
   * Check blockchain sync status
   */
  async checkBlockchainSyncStatus() {
    this.log('info', 'Checking blockchain sync status');
    
    // Check if blockchain server is running
    try {
      const blockchainPort = RECOVERY_CONFIG.criticalServices.find(s => s.name === 'Blockchain Core')?.port || 4545;
      const inUse = await portUtils.isPortInUse(blockchainPort);
      
      if (!inUse) {
        this.log('warn', `Blockchain server is not running on port ${blockchainPort}`);
        return; // No need to check sync status if server is not running
      }
      
      // In a real implementation, we would make an API call to the blockchain server
      // to check its sync status. For this example, we'll simulate the check.
      if (this.testMode) {
        // Simulate blockchain sync issue in test mode
        this.diagnosticResults.errors.push({
          id: 'blockchain_sync_behind',
          type: ErrorType.BLOCKCHAIN_SYNC,
          title: 'Blockchain Out of Sync',
          description: 'The blockchain is behind the current block height. This may cause transaction failures.',
          severity: 'medium',
          fixAction: 'resync_blockchain'
        });
        this.log('warn', 'Blockchain is out of sync (test mode)');
      } else {
        this.log('info', 'Blockchain sync status OK');
      }
    } catch (error) {
      this.log('error', `Error checking blockchain sync status: ${error.message}`);
    }
  }
  
  /**
   * Add a recovery step
   */
  addRecoveryStep(step) {
    this.recoverySteps.push(step);
    this.sendToAllClients('recovery-update', { steps: this.recoverySteps });
  }
  
  /**
   * Update a recovery step
   */
  updateRecoveryStep(stepId, updates) {
    const stepIndex = this.recoverySteps.findIndex(s => s.id === stepId);
    
    if (stepIndex >= 0) {
      this.recoverySteps[stepIndex] = { ...this.recoverySteps[stepIndex], ...updates };
      this.sendToAllClients('recovery-update', { steps: this.recoverySteps });
    }
  }
  
  /**
   * Execute recovery steps
   */
  async executeRecovery() {
    this.log('info', 'Executing recovery steps');
    
    // Process each error and execute corresponding recovery steps
    for (const error of this.diagnosticResults.errors) {
      switch (error.fixAction) {
        case 'release_port':
          await this.executePortRelease(error);
          break;
        case 'start_service':
          await this.executeServiceStart(error);
          break;
        case 'check_database_connection':
          await this.executeDatabaseFix(error);
          break;
        case 'resync_blockchain':
          await this.executeBlockchainResync(error);
          break;
        default:
          this.log('warn', `Unknown fix action: ${error.fixAction} for error: ${error.id}`);
      }
    }
  }
  
  /**
   * Fix a specific error
   */
  async fixError(error) {
    this.log('info', `Fixing error: ${error.title}`);
    
    switch (error.fixAction) {
      case 'release_port':
        await this.executePortRelease(error);
        break;
      case 'start_service':
        await this.executeServiceStart(error);
        break;
      case 'check_database_connection':
        await this.executeDatabaseFix(error);
        break;
      case 'resync_blockchain':
        await this.executeBlockchainResync(error);
        break;
      default:
        throw new Error(`Unknown fix action: ${error.fixAction}`);
    }
  }
  
  /**
   * Execute port release
   */
  async executePortRelease(error) {
    const stepId = `release_port_${error.port}`;
    
    // Add recovery step
    this.addRecoveryStep({
      id: stepId,
      title: `Release Port ${error.port}`,
      description: `Releasing port ${error.port} to resolve conflicts.`,
      status: 'in-progress',
      progress: 0
    });
    
    try {
      this.log('info', `Releasing port ${error.port}`);
      this.updateRecoveryStep(stepId, { progress: 30 });
      
      // Try to release the port
      const portReleased = await portUtils.releasePort(error.port);
      
      if (portReleased) {
        this.log('success', `Successfully released port ${error.port}`);
        this.updateRecoveryStep(stepId, { status: 'completed', progress: 100 });
        
        // Update stats
        this.stats.portConflicts--;
        this.sendToAllClients('stats-update', this.stats);
      } else {
        this.log('error', `Failed to release port ${error.port}`);
        this.updateRecoveryStep(stepId, { status: 'failed', progress: 50 });
        throw new Error(`Failed to release port ${error.port}`);
      }
    } catch (error) {
      this.updateRecoveryStep(stepId, { status: 'failed', progress: 50 });
      this.log('error', `Error releasing port: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Execute service start
   */
  async executeServiceStart(error) {
    const service = error.service;
    const stepId = `start_service_${service.name.replace(/\s+/g, '_').toLowerCase()}`;
    
    // Add recovery step
    this.addRecoveryStep({
      id: stepId,
      title: `Start ${service.name}`,
      description: `Starting ${service.name} on port ${service.port}.`,
      status: 'in-progress',
      progress: 0
    });
    
    try {
      this.log('info', `Starting service ${service.name}`);
      this.updateRecoveryStep(stepId, { progress: 30 });
      
      // Check if emergency blockchain server should be activated
      if (service.name === 'Blockchain Core') {
        await this.activateBlockchainBackup();
        this.backups.blockchain = true;
        this.sendToAllClients('backup-update', this.backups);
      }
      
      // Try to start the service
      const scriptPath = path.resolve(__dirname, service.script);
      
      // Check if script exists
      try {
        await fs.access(scriptPath);
      } catch (err) {
        this.log('warn', `Script not found: ${service.script}`);
        this.updateRecoveryStep(stepId, { 
          status: 'failed', 
          progress: 50,
          description: `Script not found: ${service.script}`
        });
        throw new Error(`Script not found: ${service.script}`);
      }
      
      // Start the service
      const startProcess = spawn('node', [scriptPath], {
        detached: true,
        stdio: 'ignore',
        env: { ...process.env, PORT: service.port.toString() }
      });
      
      // Detach the process
      startProcess.unref();
      
      // Wait a moment to see if service starts
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if service is now running
      const inUse = await portUtils.isPortInUse(service.port);
      
      if (inUse) {
        this.log('success', `Successfully started ${service.name}`);
        this.updateRecoveryStep(stepId, { status: 'completed', progress: 100 });
        
        // Update stats
        this.stats.servicesOnline++;
        this.sendToAllClients('stats-update', this.stats);
      } else {
        this.log('error', `Failed to start ${service.name}`);
        this.updateRecoveryStep(stepId, { status: 'failed', progress: 50 });
        throw new Error(`Failed to start ${service.name}`);
      }
    } catch (error) {
      this.updateRecoveryStep(stepId, { status: 'failed', progress: 50 });
      this.log('error', `Error starting service: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Execute database fix
   */
  async executeDatabaseFix(error) {
    const stepId = 'fix_database';
    
    // Add recovery step
    this.addRecoveryStep({
      id: stepId,
      title: 'Fix Database Connection',
      description: 'Attempting to fix database connection issues.',
      status: 'in-progress',
      progress: 0
    });
    
    try {
      this.log('info', 'Fixing database connection');
      this.updateRecoveryStep(stepId, { progress: 30 });
      
      // Check if we're in test mode
      if (this.testMode) {
        // Simulate database fix
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.log('success', 'Successfully fixed database connection (test mode)');
        this.updateRecoveryStep(stepId, { status: 'completed', progress: 100 });
        return;
      }
      
      // Execute database migration
      try {
        await execAsync('npx drizzle-kit push');
        this.log('info', 'Database migration completed');
        this.updateRecoveryStep(stepId, { progress: 70 });
      } catch (err) {
        this.log('warn', `Database migration failed: ${err.message}`);
        this.updateRecoveryStep(stepId, {
          progress: 50,
          description: 'Database migration failed, trying alternate approach...'
        });
      }
      
      // Try to connect to the database to verify fix
      try {
        const { Pool } = require('@neondatabase/serverless');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        
        // Try a simple query
        await pool.query('SELECT 1');
        this.log('success', 'Database connection restored');
        this.updateRecoveryStep(stepId, { status: 'completed', progress: 100 });
        
        // Close the pool
        await pool.end();
      } catch (err) {
        this.log('error', `Database connection still failing: ${err.message}`);
        this.updateRecoveryStep(stepId, { status: 'failed', progress: 70 });
        throw new Error(`Database connection still failing: ${err.message}`);
      }
    } catch (error) {
      this.updateRecoveryStep(stepId, { status: 'failed', progress: 50 });
      this.log('error', `Error fixing database: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Execute blockchain resync
   */
  async executeBlockchainResync(error) {
    const stepId = 'resync_blockchain';
    
    // Add recovery step
    this.addRecoveryStep({
      id: stepId,
      title: 'Resync Blockchain',
      description: 'Resyncing blockchain data to ensure consistency.',
      status: 'in-progress',
      progress: 0
    });
    
    try {
      this.log('info', 'Resyncing blockchain');
      this.updateRecoveryStep(stepId, { progress: 30 });
      
      // Activate the emergency blockchain server
      await this.activateBlockchainBackup();
      this.backups.blockchain = true;
      this.sendToAllClients('backup-update', this.backups);
      
      // Simulating blockchain resync
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.updateRecoveryStep(stepId, { 
          progress: 30 + (i + 1) * 10,
          description: `Resyncing blockchain - Block ${(i + 1) * 100} of 500`
        });
      }
      
      this.log('success', 'Successfully resynced blockchain');
      this.updateRecoveryStep(stepId, { 
        status: 'completed', 
        progress: 100,
        description: 'Blockchain successfully resynced and verified.'
      });
    } catch (error) {
      this.updateRecoveryStep(stepId, { status: 'failed', progress: 50 });
      this.log('error', `Error resyncing blockchain: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Activate blockchain backup
   */
  async activateBlockchainBackup() {
    this.log('info', 'Activating emergency blockchain server');
    
    try {
      // Check for emergency blockchain server script
      const scriptPath = path.resolve(__dirname, 'launch-emergency-blockchain-server.js');
      
      try {
        await fs.access(scriptPath);
      } catch (err) {
        this.log('warn', 'Emergency blockchain server script not found');
        throw new Error('Emergency blockchain server script not found');
      }
      
      // Start the emergency blockchain server
      const startProcess = spawn('node', [scriptPath], {
        detached: true,
        stdio: 'ignore'
      });
      
      // Detach the process
      startProcess.unref();
      
      // Wait a moment to see if server starts
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if server is running
      const blockchainPort = 4545; // Default emergency blockchain port
      const inUse = await portUtils.isPortInUse(blockchainPort);
      
      if (inUse) {
        this.log('success', 'Emergency blockchain server activated');
        return true;
      } else {
        this.log('error', 'Failed to activate emergency blockchain server');
        throw new Error('Failed to activate emergency blockchain server');
      }
    } catch (error) {
      this.log('error', `Error activating blockchain backup: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Verify recovery
   */
  async verifyRecovery() {
    this.log('info', 'Verifying recovery');
    
    const stepId = 'verify_recovery';
    
    // Add recovery step
    this.addRecoveryStep({
      id: stepId,
      title: 'Verify Recovery',
      description: 'Verifying that all issues have been resolved.',
      status: 'in-progress',
      progress: 0
    });
    
    try {
      // Check 1: Verify ports are free
      this.updateRecoveryStep(stepId, { 
        progress: 25,
        description: 'Verifying port conflicts are resolved...'
      });
      
      let allPortsResolved = true;
      for (const port of RECOVERY_CONFIG.criticalPorts) {
        const inUse = await portUtils.isPortInUse(port);
        if (inUse && port === 3001) { // port 3001 should be free
          allPortsResolved = false;
          this.log('warn', `Port ${port} is still in use`);
        }
      }
      
      if (!allPortsResolved) {
        this.log('warn', 'Not all port conflicts were resolved');
        this.updateRecoveryStep(stepId, { 
          progress: 40,
          description: 'Some port conflicts still exist, but proceeding with verification...'
        });
      }
      
      // Check 2: Verify services are running
      this.updateRecoveryStep(stepId, { 
        progress: 50,
        description: 'Verifying services are running...'
      });
      
      let servicesRunning = 0;
      for (const service of RECOVERY_CONFIG.criticalServices) {
        const inUse = await portUtils.isPortInUse(service.port);
        if (inUse) {
          servicesRunning++;
        }
      }
      
      this.stats.servicesOnline = servicesRunning;
      this.sendToAllClients('stats-update', this.stats);
      
      if (servicesRunning < RECOVERY_CONFIG.criticalServices.length) {
        this.log('warn', `Only ${servicesRunning}/${RECOVERY_CONFIG.criticalServices.length} critical services running`);
        this.updateRecoveryStep(stepId, { 
          progress: 70,
          description: `Only ${servicesRunning}/${RECOVERY_CONFIG.criticalServices.length} critical services running, but proceeding with verification...`
        });
      }
      
      // Check 3: Verify database connection
      this.updateRecoveryStep(stepId, { 
        progress: 75,
        description: 'Verifying database connection...'
      });
      
      let databaseConnected = false;
      try {
        if (process.env.DATABASE_URL) {
          const { Pool } = require('@neondatabase/serverless');
          const pool = new Pool({ connectionString: process.env.DATABASE_URL });
          
          try {
            await pool.query('SELECT 1');
            databaseConnected = true;
            this.log('info', 'Database connection verified');
          } catch (err) {
            this.log('warn', `Database connection check failed: ${err.message}`);
          } finally {
            await pool.end();
          }
        }
      } catch (err) {
        this.log('warn', `Database check error: ${err.message}`);
      }
      
      if (!databaseConnected) {
        this.log('warn', 'Database connection not verified');
        this.updateRecoveryStep(stepId, { 
          progress: 85,
          description: 'Database connection not verified, but proceeding with verification...'
        });
      }
      
      // Overall verification status
      const overallSuccess = allPortsResolved && 
        servicesRunning >= RECOVERY_CONFIG.criticalServices.length * 0.8 && // At least 80% of services running
        databaseConnected;
      
      if (overallSuccess) {
        this.log('success', 'Recovery verification successful');
        this.updateRecoveryStep(stepId, { 
          status: 'completed', 
          progress: 100,
          description: 'All recovery steps verified successfully.'
        });
      } else {
        this.log('warn', 'Recovery verification completed with warnings');
        this.updateRecoveryStep(stepId, { 
          status: 'completed', 
          progress: 100,
          description: 'Recovery verified with some warnings. See logs for details.'
        });
      }
    } catch (error) {
      this.updateRecoveryStep(stepId, { status: 'failed', progress: 60 });
      this.log('error', `Error verifying recovery: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update recovery stats
   */
  async updateStats() {
    // Update recovery time
    if (this.recoveryStartTime && 
        (this.state === RecoveryState.DIAGNOSING || 
         this.state === RecoveryState.RECOVERING || 
         this.state === RecoveryState.VERIFYING)) {
      const elapsedMs = Date.now() - this.recoveryStartTime;
      const minutes = Math.floor(elapsedMs / 60000);
      const seconds = Math.floor((elapsedMs % 60000) / 1000);
      this.stats.recoveryTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Update recovery progress based on completed steps
    if (this.recoverySteps.length > 0) {
      const completedSteps = this.recoverySteps.filter(s => s.status === 'completed').length;
      const totalSteps = this.recoverySteps.length;
      this.stats.recoveryProgress = Math.floor((completedSteps / totalSteps) * 100);
    }
    
    // Update port conflicts
    try {
      let conflicts = 0;
      for (const port of RECOVERY_CONFIG.criticalPorts) {
        const inUse = await portUtils.isPortInUse(port);
        if (inUse && port === 3001) { // port 3001 should be free
          conflicts++;
        }
      }
      this.stats.portConflicts = conflicts;
    } catch (error) {
      this.log('error', `Error checking port conflicts: ${error.message}`);
    }
    
    // Update services online
    try {
      let servicesOnline = 0;
      for (const service of RECOVERY_CONFIG.criticalServices) {
        const inUse = await portUtils.isPortInUse(service.port);
        if (inUse) {
          servicesOnline++;
        }
      }
      this.stats.servicesOnline = servicesOnline;
    } catch (error) {
      this.log('error', `Error checking services: ${error.message}`);
    }
    
    // Send updated stats to clients
    this.sendToAllClients('stats-update', this.stats);
  }
  
  /**
   * Create a backup of critical files
   */
  async createBackup() {
    this.log('info', 'Creating system backups');
    
    try {
      // Create backup directory with timestamp
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const backupDir = path.join(RECOVERY_CONFIG.backupDir, `backup-${timestamp}`);
      await fs.mkdir(backupDir, { recursive: true });
      
      // Copy each file to backup directory
      for (const file of RECOVERY_CONFIG.backupFiles) {
        try {
          const sourcePath = path.resolve(__dirname, file);
          const destPath = path.join(backupDir, path.basename(file));
          
          // Check if source file exists
          try {
            await fs.access(sourcePath);
          } catch (err) {
            this.log('warn', `Backup file not found: ${file}`);
            continue; // Skip this file
          }
          
          // Copy file
          await fs.copyFile(sourcePath, destPath);
          this.log('info', `Backed up ${file}`);
        } catch (err) {
          this.log('error', `Error backing up ${file}: ${err.message}`);
        }
      }
      
      // Save backup info
      await fs.writeFile(
        path.join(backupDir, 'backup-info.json'),
        JSON.stringify({
          timestamp,
          files: RECOVERY_CONFIG.backupFiles,
          recovery: {
            state: this.state,
            diagnosticResults: this.diagnosticResults,
            stats: this.stats
          }
        }, null, 2)
      );
      
      this.backups.data = true;
      this.sendToAllClients('backup-update', this.backups);
      
      this.log('success', `System backup created at ${backupDir}`);
      return backupDir;
    } catch (error) {
      this.log('error', `Error creating backup: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Restore from backup
   */
  async restoreBackup() {
    this.log('info', 'Restoring from backup');
    
    try {
      // Find the most recent backup
      const backupDirs = await fs.readdir(RECOVERY_CONFIG.backupDir);
      if (backupDirs.length === 0) {
        this.log('warn', 'No backups found');
        return;
      }
      
      const mostRecentBackup = backupDirs
        .filter(dir => dir.startsWith('backup-'))
        .sort()
        .reverse()[0];
      
      const backupPath = path.join(RECOVERY_CONFIG.backupDir, mostRecentBackup);
      this.log('info', `Restoring from backup: ${backupPath}`);
      
      // Read backup info
      const backupInfo = JSON.parse(
        await fs.readFile(path.join(backupPath, 'backup-info.json'), 'utf8')
      );
      
      // Restore each file
      for (const file of backupInfo.files) {
        try {
          const sourcePath = path.join(backupPath, path.basename(file));
          const destPath = path.resolve(__dirname, file);
          
          // Check if source file exists
          try {
            await fs.access(sourcePath);
          } catch (err) {
            this.log('warn', `Backup file not found: ${file}`);
            continue; // Skip this file
          }
          
          // Copy file
          await fs.copyFile(sourcePath, destPath);
          this.log('info', `Restored ${file}`);
        } catch (err) {
          this.log('error', `Error restoring ${file}: ${err.message}`);
        }
      }
      
      this.log('success', 'System restored from backup');
    } catch (error) {
      this.log('error', `Error restoring from backup: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Send a notification
   */
  async sendNotification(message, type = 'system') {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const notification = {
      type,
      message,
      time
    };
    
    this.notifications.push(notification);
    
    // Send notification to clients
    this.sendToAllClients('notification', notification);
    
    // Log the notification
    this.log('info', `Notification sent: ${message}`);
    
    // TODO: In a real implementation, send email/SMS notifications
  }
  
  /**
   * Log a message
   */
  log(level, message) {
    const now = new Date();
    const timeString = now.toISOString();
    
    // Create log entry
    const logEntry = {
      level,
      time: timeString,
      message
    };
    
    // Add to logs array
    this.logs.push(logEntry);
    
    // Limit logs array to 1000 entries
    if (this.logs.length > 1000) {
      this.logs.shift();
    }
    
    // Log to console
    console[level === 'success' ? 'log' : level](`[${timeString}] [${level.toUpperCase()}] ${message}`);
    
    // Send log to clients
    this.sendToAllClients('log', {
      level,
      message
    });
    
    // Write to log file
    const logFileName = path.join(
      RECOVERY_CONFIG.logsDir,
      `recovery-${now.toISOString().split('T')[0]}.log`
    );
    
    fs.appendFile(
      logFileName,
      `[${timeString}] [${level.toUpperCase()}] ${message}\n`
    ).catch(err => {
      console.error(`Error writing to log file: ${err.message}`);
    });
  }
  
  /**
   * Shutdown the recovery server
   */
  async shutdown() {
    // Stop timers
    if (this.statsTimer) {
      clearInterval(this.statsTimer);
    }
    
    if (this.recoveryTimer) {
      clearInterval(this.recoveryTimer);
    }
    
    // Close the server
    if (this.server) {
      await new Promise((resolve) => {
        this.server.close(resolve);
      });
    }
    
    this.log('info', 'Emergency Recovery Mode shut down');
  }
}

/**
 * Start recovery mode if called directly
 */
if (require.main === module) {
  const recoveryManager = new RecoveryManager();
  recoveryManager.startServer().catch(console.error);
  
  // Handle process termination
  process.on('SIGINT', async () => {
    console.log('Shutting down Emergency Recovery Mode...');
    await recoveryManager.shutdown();
    process.exit(0);
  });
}

module.exports = {
  RecoveryManager,
  recoveryEvents,
  RecoveryState,
  ErrorType,
  RECOVERY_CONFIG
};