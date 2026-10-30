// PAS-One Google Sheets Initialization Script
// Run this in Google Apps Script Editor to setup database

function initializeDatabase() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!spreadsheetId) throw new Error('Script Property SPREADSHEET_ID belum diatur');
  const ss = SpreadsheetApp.openById(spreadsheetId);

  // Step 1: Create all sheets
  const sheetNames = [
    'Users', 'Catalog', 'Orders', 'Payments', 'Emergency',
    'Inventory', 'InventoryMutations', 'DiscountRequests',
    'AuditLog', 'Settings', 'PasswordResets'
  ];

  Logger.log('Creating sheets...');
  sheetNames.forEach(name => {
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
      Logger.log(`✓ Created ${name}`);
    }
  });

  // Step 2: Add headers
  addHeaders(ss);

  // Step 3: Seed default settings only when Settings is empty.
  seedDefaultSettings(ss);

  Logger.log('✓ Database initialization complete!');
}

function addHeaders(ss) {
  Logger.log('Adding headers...');

  // Users
  const sh_Users = ss.getSheetByName('Users');
  if (sh_Users.getLastRow() === 0 || sh_Users.getRange(1,1).getValue() === '') {
    sh_Users.getRange(1, 1, 1, 7).setValues([['userId', 'email', 'passwordHash', 'name', 'role', 'createdAt', 'active']]);
  }

  // Catalog
  const sh_Catalog = ss.getSheetByName('Catalog');
  if (sh_Catalog.getLastRow() === 0 || sh_Catalog.getRange(1,1).getValue() === '') {
    sh_Catalog.getRange(1, 1, 1, 8).setValues([['itemId', 'name', 'category', 'description', 'price', 'stock', 'active', 'createdAt']]);
  }

  // Orders
  const sh_Orders = ss.getSheetByName('Orders');
  if (sh_Orders.getLastRow() === 0 || sh_Orders.getRange(1,1).getValue() === '') {
    sh_Orders.getRange(1, 1, 1, 11).setValues([['orderId', 'customerId', 'customerData', 'items', 'subtotal', 'tax', 'total', 'orderStatus', 'paymentStatus', 'createdAt', 'createdBy']]);
  }

  // Payments
  const sh_Payments = ss.getSheetByName('Payments');
  if (sh_Payments.getLastRow() === 0 || sh_Payments.getRange(1,1).getValue() === '') {
    sh_Payments.getRange(1, 1, 1, 9).setValues([['paymentId', 'orderId', 'amount', 'status', 'method', 'proofUrl', 'verifiedBy', 'verifiedAt', 'createdAt']]);
  }

  // Emergency
  const sh_Emergency = ss.getSheetByName('Emergency');
  if (sh_Emergency.getLastRow() === 0 || sh_Emergency.getRange(1,1).getValue() === '') {
    sh_Emergency.getRange(1, 1, 1, 13).setValues([['ticketId', 'customerId', 'customerName', 'customerPhone', 'lat', 'lng', 'complaint', 'status', 'assignedTo', 'estimatedCost', 'actualCost', 'createdAt', 'completedAt']]);
  }

  // Inventory
  const sh_Inventory = ss.getSheetByName('Inventory');
  if (sh_Inventory.getLastRow() === 0 || sh_Inventory.getRange(1,1).getValue() === '') {
    sh_Inventory.getRange(1, 1, 1, 9).setValues([['partId', 'name', 'category', 'unit', 'quantity', 'minStock', 'price', 'supplier', 'createdAt']]);
  }

  // InventoryMutations
  const sh_InventoryMutations = ss.getSheetByName('InventoryMutations');
  if (sh_InventoryMutations.getLastRow() === 0 || sh_InventoryMutations.getRange(1,1).getValue() === '') {
    sh_InventoryMutations.getRange(1, 1, 1, 8).setValues([['mutationId', 'partId', 'type', 'quantity', 'reason', 'referenceId', 'createdBy', 'createdAt']]);
  }

  // DiscountRequests
  const sh_DiscountRequests = ss.getSheetByName('DiscountRequests');
  if (sh_DiscountRequests.getLastRow() === 0 || sh_DiscountRequests.getRange(1,1).getValue() === '') {
    sh_DiscountRequests.getRange(1, 1, 1, 11).setValues([['requestId', 'orderId', 'originalAmount', 'discountAmount', 'finalAmount', 'reason', 'requestedBy', 'approvedBy', 'status', 'createdAt', 'decidedAt']]);
  }

  // AuditLog
  const sh_AuditLog = ss.getSheetByName('AuditLog');
  if (sh_AuditLog.getLastRow() === 0 || sh_AuditLog.getRange(1,1).getValue() === '') {
    sh_AuditLog.getRange(1, 1, 1, 6).setValues([['logId', 'timestamp', 'action', 'resource', 'details', 'user']]);
  }

  // Settings
  const sh_Settings = ss.getSheetByName('Settings');
  if (sh_Settings.getLastRow() === 0 || sh_Settings.getRange(1,1).getValue() === '') {
    sh_Settings.getRange(1, 1, 1, 4).setValues([['key', 'value', 'type', 'description']]);
  }


  // Password reset codes (sensitive, do not expose publicly)
  const sh_PasswordResets = ss.getSheetByName('PasswordResets');
  if (sh_PasswordResets.getLastRow() === 0 || sh_PasswordResets.getRange(1,1).getValue() === '') {
    sh_PasswordResets.getRange(1, 1, 1, 7).setValues([['resetId','email','codeHash','expiresAt','attempts','createdAt','usedAt']]);
  }

  Logger.log('✓ Headers added');
}

function seedDefaultSettings(ss) {
  const settingsSheet = ss.getSheetByName('Settings');
  if (settingsSheet.getLastRow() > 1) {
    Logger.log('Settings already contains data; preserving existing values.');
    return;
  }
  const settings = [
    ['NORMAL_HOURS_START', '06:00', 'string', 'Jam kerja mulai'],
    ['NORMAL_HOURS_END', '18:00', 'string', 'Jam kerja selesai'],
    ['FREE_RADIUS_KM', '30', 'number', 'Radius layanan gratis'],
    ['DISTANCE_FEE_PER_KM', '10000', 'number', 'Biaya per km kelebihan'],
    ['GUEST_VISIT_FEE', '250000', 'number', 'Biaya visit untuk guest'],
    ['OFF_HOURS_VISIT_FEE', '250000', 'number', 'Biaya visit di luar jam normal'],
    ['TAX_PERCENTAGE', '10', 'number', 'Pajak dalam persen']
  ];
  settings.forEach(row => settingsSheet.appendRow(row));
  Logger.log('Default settings added. No demo user or sample products were created.');
}

function testConnection() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Users');
    const data = sheet.getDataRange().getValues();

    Logger.log('✓ Connection successful');
    Logger.log(`✓ Users sheet has ${data.length} rows (including header)`);

    if (data.length > 1) {
      Logger.log(`✓ Sample user: ${data[1][1]} (${data[1][4]})`);
    }
  } catch (error) {
    Logger.log('✗ Connection failed: ' + error.message);
  }
}
