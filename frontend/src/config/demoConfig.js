// Demo Mode Configuration
// This file contains configuration for demo mode to bypass customer authentication

export const DEMO_CONFIG = {
  // Enable/disable demo mode - set to true for demos, false for production
  ENABLED: true,
  
  // Demo customer credentials
  CUSTOMER: {
    id: 999999, // High ID to avoid conflicts with real customers
    username: 'Demo Customer',
    phone_number: '+91-DEMO-USER',
    table_number: 1,
    unique_id: 'DEMO-SESSION-ID',
    visit_count: 5, // Show as returning customer
  },
  
  // Demo mode display settings
  UI: {
    showDemoButton: true,
    demoButtonText: '🎭 Demo Mode',
    demoModeIndicator: '🎭 DEMO MODE ACTIVE',
  }
};

// Helper functions for demo mode
export const isDemoModeEnabled = () => DEMO_CONFIG.ENABLED;

export const getDemoCustomer = () => DEMO_CONFIG.CUSTOMER;

export const getDemoMenuUrl = () => {
  const { id, table_number, unique_id } = DEMO_CONFIG.CUSTOMER;
  return `/customer/menu?table_number=${table_number}&unique_id=${unique_id}&user_id=${id}`;
};

export const enableDemoMode = () => {
  DEMO_CONFIG.ENABLED = true;
};

export const disableDemoMode = () => {
  DEMO_CONFIG.ENABLED = false;
};
