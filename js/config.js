// PAS-One Configuration
window.APP_CONFIG = {
  // Apps Script Deployment URL
  API_BASE_URL: 'https://script.google.com/macros/s/AKfycbwJJt1Nj39xXDRNZ0hc26n7Flvh7uDk7E3zv11keYNQD4OKsbcU4i-nRfk3dP_EtCf7/exec',

  // Google Sheets
  // Spreadsheet ID hanya disimpan di Apps Script Script Properties, bukan di browser.
  SPREADSHEET_ID: '',

  // Location
  BASE_LOCATION_LAT: -2.915,
  BASE_LOCATION_LNG: 104.758,

  // Emergency Settings
  EMERGENCY_PHONE: '+628138181128',
  EMERGENCY_WHATSAPP: '+628138181128',

  // Service Hours (24-hour format)
  NORMAL_HOURS_START: 6,   // 06:00
  NORMAL_HOURS_END: 18,    // 18:00
  TIMEZONE: 'Asia/Jakarta',

  // Service Fees (in Rp)
  FREE_RADIUS_KM: 20,
  DISTANCE_OVERAGE_FEE: 10000,      // per km over 30km
  GUEST_VISIT_FEE: 250000,
  OFF_HOURS_VISIT_FEE: 250000,

  // Polling
  LOCATION_POLLING_INTERVAL: 30000,  // 30 seconds
  STATUS_POLLING_INTERVAL: 60000,    // 1 minute

  // Storage
  TOKEN_EXPIRY_HOURS: 1,

  // Roles
  ROLES: {
    ADMIN: 'admin',
    MECHANIC: 'mechanic',
    MANAGER: 'manager',
    CUSTOMER: 'customer',
    GUEST: 'guest'
  },

  // Order Status
  ORDER_STATUS: {
    DRAFT: 'draft',
    PENDING_PAYMENT: 'pending_payment',
    PAYMENT_VERIFIED: 'payment_verified',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  // Emergency Status
  EMERGENCY_STATUS: {
    CREATED: 'created',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  // Payment Status
  PAYMENT_STATUS: {
    PENDING: 'pending',
    VERIFIED: 'verified',
    FAILED: 'failed'
  },

  // Discount Status
  DISCOUNT_STATUS: {
    REQUESTED: 'requested',
    APPROVED: 'approved',
    REJECTED: 'rejected'
  }
};

// Validate config on load
window.addEventListener('DOMContentLoaded', function() {
  if (!window.APP_CONFIG.API_BASE_URL) console.warn('API_BASE_URL belum dikonfigurasi.');
});
