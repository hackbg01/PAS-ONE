// PAS-One Google Apps Script Main Entry Point
// Deploy as Web App: Execute as "Me", Who has access "Anyone"

const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
const TOKEN_TTL_MS = 6 * 60 * 60 * 1000;
const SHEETS = {
  USERS: 'Users',
  CATALOG: 'Catalog',
  ORDERS: 'Orders',
  PAYMENTS: 'Payments',
  EMERGENCY: 'Emergency',
  INVENTORY: 'Inventory',
  DISCOUNT_REQUESTS: 'DiscountRequests',
  AUDIT_LOG: 'AuditLog',
  SETTINGS: 'Settings'
};

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ success: true, service: 'PAS-One API', status: 'online' })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const endpoint = e.parameter.endpoint || '';
    const payload = e.postData ? JSON.parse(e.postData.contents || '{}') : {};
    const token = payload.token || e.parameter.token || getHeaderToken(e);

    // Log request
    logAudit('API_REQUEST', endpoint, { authenticated: !!token });

    let response = { success: false, error: 'Unknown endpoint' };

    // Routes
    if (!endpoint) throw new Error('Endpoint wajib diisi');
    if (endpoint.startsWith('auth/')) {
      response = handleAuth(endpoint, payload, token);
    } else if (endpoint.startsWith('catalog/')) {
      response = handleCatalog(endpoint, payload, token);
    } else if (endpoint.startsWith('orders/')) {
      response = handleOrders(endpoint, payload, token);
    } else if (endpoint.startsWith('payments/')) {
      response = handlePayments(endpoint, payload, token);
    } else if (endpoint.startsWith('emergency/')) {
      response = handleEmergency(endpoint, payload, token);
    } else if (endpoint.startsWith('inventory/')) {
      response = handleInventory(endpoint, payload, token);
    } else if (endpoint.startsWith('discount/')) {
      response = handleDiscount(endpoint, payload, token);
    } else if (endpoint.startsWith('location/')) {
      response = handleLocation(endpoint, payload, token);
    } else if (endpoint.startsWith('dashboard/')) {
      response = handleDashboard(endpoint, payload, token);
    } else if (endpoint.startsWith('audit/')) {
      response = handleAudit(endpoint, payload, token);
    }

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ========== Auth Handlers ==========
function handleAuth(endpoint, payload, token) {
  const action = endpoint.split('/')[1];

  if (action === 'register') {
    return registerUser(payload.email, payload.password, payload.name);
  } else if (action === 'login') {
    return loginUser(payload.email, payload.password);
  } else if (action === 'logout') {
    return { success: true, message: 'Logged out' };
  } else if (action === 'forgot-password') {
    return requestPasswordReset(payload.email);
  } else if (action === 'reset-password') {
    return completePasswordReset(payload.email, payload.code, payload.newPassword);
  } else if (action === 'me') {
    const user = verifyToken(token);
    return user ? { success: true, user } : { success: false, error: 'Unauthorized' };
  }

  return { success: false, error: 'Unknown auth action' };
}

function registerUser(email, password, name) {
  email = String(email || '').trim().toLowerCase();
  password = String(password || '');
  name = String(name || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10 || password.length > 128 || !name) return { success: false, error: 'Nama, email valid, dan password minimal 10 karakter wajib diisi' };
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usersSheet = ss.getSheetByName(SHEETS.USERS);
  const data = usersSheet.getDataRange().getValues();

  // Check if user exists
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase() === String(email || '').trim().toLowerCase() && data[i][6] === true) {
      return { success: false, error: 'Email already registered' };
    }
  }

  const hashedPassword = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  const userId = Utilities.getUuid();
  const createdAt = new Date();

  usersSheet.appendRow([
    userId,
    email,
    Utilities.base64Encode(hashedPassword),
    name,
    'customer',  // role
    createdAt,
    true  // active
  ]);

  logAudit('USER_REGISTERED', email, { userId });

  return { success: true, message: 'User registered successfully' };
}

function loginUser(email, password) {
  email = String(email || '').trim().toLowerCase();
  password = String(password || '');
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usersSheet = ss.getSheetByName(SHEETS.USERS);
  const data = usersSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase() === String(email || '').trim().toLowerCase() && data[i][6] === true) {
      const storedHash = Utilities.base64Decode(data[i][2]);
      const inputHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);

      if (storedHash.toString() === inputHash.toString()) {
        const token = generateToken({ userId: data[i][0], email, role: data[i][4] });
        logAudit('USER_LOGIN', email, { userId: data[i][0] });

        return {
          success: true,
          token,
          user: {
            id: data[i][0],
            email,
            name: data[i][3],
            role: data[i][4]
          }
        };
      }
    }
  }

  return { success: false, error: 'Invalid credentials' };
}

// ========== Catalog Handlers ==========
function handleCatalog(endpoint, payload, token) {
  const action = endpoint.split('/')[1];
  const user = verifyToken(token);

  if (action === 'list') {
    return listCatalog(payload);
  } else if (action === 'get') {
    return getCatalogItem(payload.id);
  } else if (action === 'create' && user?.role === 'admin') {
    return createCatalogItem(payload, user);
  } else if (action === 'update' && user?.role === 'admin') {
    return updateCatalogItem(payload.id, payload, user);
  } else if (action === 'delete' && user?.role === 'admin') {
    return deleteCatalogItem(payload.id, user);
  }

  return { success: false, error: 'Unauthorized' };
}

function listCatalog(filters) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.CATALOG);
  const data = sheet.getDataRange().getValues();

  const items = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][6]) { // active
      items.push({
        id: data[i][0],
        name: data[i][1],
        category: data[i][2],
        description: data[i][3],
        price: data[i][4],
        stock: data[i][5],
        active: data[i][6]
      });
    }
  }

  return { success: true, items };
}

function getCatalogItem(id) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.CATALOG);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      return {
        success: true,
        item: {
          id: data[i][0],
          name: data[i][1],
          category: data[i][2],
          description: data[i][3],
          price: data[i][4],
          stock: data[i][5],
          active: data[i][6]
        }
      };
    }
  }

  return { success: false, error: 'Item not found' };
}

function createCatalogItem(data, user) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.CATALOG);

  const itemId = Utilities.getUuid();
  sheet.appendRow([
    itemId,
    data.name,
    data.category,
    data.description,
    data.price,
    data.stock || 0,
    true,
    new Date()
  ]);

  logAudit('CATALOG_CREATED', itemId, { name: data.name, createdBy: user.email });

  return { success: true, itemId };
}

function updateCatalogItem(id, data, user) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.CATALOG);
  const range = sheet.getDataRange();
  const values = range.getValues();

  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
      if (data.name) values[i][1] = data.name;
      if (data.category) values[i][2] = data.category;
      if (data.description) values[i][3] = data.description;
      if (data.price !== undefined) values[i][4] = data.price;
      if (data.stock !== undefined) values[i][5] = data.stock;
      if (data.active !== undefined) values[i][6] = data.active;

      range.setValues(values);
      logAudit('CATALOG_UPDATED', id, { updatedBy: user.email });
      return { success: true };
    }
  }

  return { success: false, error: 'Item not found' };
}

function deleteCatalogItem(id, user) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.CATALOG);
  const range = sheet.getDataRange();
  const values = range.getValues();

  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
      sheet.deleteRow(i + 1);
      logAudit('CATALOG_DELETED', id, { deletedBy: user.email });
      return { success: true };
    }
  }

  return { success: false, error: 'Item not found' };
}

// ========== Orders Handlers ==========
function handleOrders(endpoint, payload, token) {
  const action = endpoint.split('/')[1];
  const user = verifyToken(token);

  if (action === 'create') {
    return createOrder(payload, user || { userId: 'GUEST', email: 'guest' });
  }
  if (!user) return { success: false, error: 'Unauthorized' };

  if (action === 'list') {
    return listOrders(user, payload);
  } else if (action === 'get') {
    return getOrder(payload.id, user);
  } else if (action === 'update-status') {
    return updateOrderStatus(payload.id, payload.status, user);
  }

  return { success: false, error: 'Unknown action' };
}

function createOrder(data, user) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const ordersSheet = ss.getSheetByName(SHEETS.ORDERS);
  const catalogValues = ss.getSheetByName(SHEETS.CATALOG).getDataRange().getValues();
  const requested = Array.isArray(data.items) ? data.items : [];
  if (!requested.length) return { success: false, error: 'Keranjang kosong' };
  const catalog = {};
  for (let i = 1; i < catalogValues.length; i++) {
    if (catalogValues[i][6] === true) catalog[String(catalogValues[i][0])] = {
      id: String(catalogValues[i][0]), name: String(catalogValues[i][1]),
      price: Number(catalogValues[i][4] || 0), stock: Number(catalogValues[i][5] || 0)
    };
  }
  const canonicalItems = [];
  for (const item of requested) {
    const id = String(item.id || item.itemId || '');
    const master = catalog[id];
    const quantity = Math.floor(Number(item.quantity || 0));
    if (!master || quantity < 1 || quantity > 999) return { success: false, error: 'Item keranjang tidak valid atau sudah tidak aktif' };
    canonicalItems.push({ id: master.id, name: master.name, price: master.price, quantity: quantity });
  }
  const orderId = 'ORD-' + Date.now();
  const subtotal = calculateSubtotal(canonicalItems);
  const taxRate = 0.10;
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;
  ordersSheet.appendRow([
    orderId,
    user.userId || 'GUEST',
    JSON.stringify(data.customerData || {}),
    JSON.stringify(canonicalItems),
    subtotal,
    tax,
    total,
    'pending_payment',
    'pending',
    new Date(),
    user.email || 'guest'
  ]);
  logAudit('ORDER_CREATED', orderId, { customerId: user.userId || 'GUEST', total: total });
  return { success: true, orderId: orderId, total: total };
}

function listOrders(user, filters) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.ORDERS);
  const data = sheet.getDataRange().getValues();
  const f = filters || {};
  const orders = [];
  for (let i = 1; i < data.length; i++) {
    const owns = String(data[i][1]) === String(user.userId);
    if (user.role !== 'admin' && user.role !== 'manager' && !owns) continue;
    if (f.paymentStatus && String(data[i][8]) !== String(f.paymentStatus)) continue;
    if (f.orderStatus && String(data[i][7]) !== String(f.orderStatus)) continue;
    if (f.status && String(data[i][7]) !== String(f.status) && String(data[i][8]) !== String(f.status)) continue;
    let customerData = {};
    let items = [];
    try { customerData = JSON.parse(data[i][2] || '{}'); } catch (e) {}
    try { items = JSON.parse(data[i][3] || '[]'); } catch (e) {}
    orders.push({
      orderId: data[i][0], customerId: data[i][1], customerData: customerData,
      items: items, subtotal: Number(data[i][4] || 0), tax: Number(data[i][5] || 0),
      total: Number(data[i][6] || 0), orderStatus: data[i][7],
      paymentStatus: data[i][8], createdAt: data[i][9]
    });
  }
  return { success: true, orders: orders };
}

function getOrder(orderId, user) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.ORDERS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === orderId) {
      if (user.role !== 'admin' && String(data[i][1]) !== String(user.userId)) return { success: false, error: 'Unauthorized' };
      return {
        success: true,
        order: {
          orderId: data[i][0],
          customerId: data[i][1],
          customerData: JSON.parse(data[i][2]),
          items: JSON.parse(data[i][3]),
          subtotal: data[i][4],
          tax: data[i][5],
          total: data[i][6],
          orderStatus: data[i][7],
          paymentStatus: data[i][8]
        }
      };
    }
  }

  return { success: false, error: 'Order not found' };
}

function updateOrderStatus(orderId, status, user) {
  if (!['admin', 'manager'].includes(String(user.role).toLowerCase())) return { success: false, error: 'Unauthorized' };

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.ORDERS);
  const range = sheet.getDataRange();
  const values = range.getValues();

  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === orderId) {
      values[i][7] = status;
      range.setValues(values);
      logAudit('ORDER_STATUS_UPDATED', orderId, { status, updatedBy: user.email });
      return { success: true };
    }
  }

  return { success: false, error: 'Order not found' };
}

// ========== Utilities ==========
function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function generateToken(data) {
  const secret = PropertiesService.getScriptProperties().getProperty('SECRET_KEY');
  if (!secret || secret.length < 32) throw new Error('SECRET_KEY wajib minimal 32 karakter');
  const payload = Utilities.base64EncodeWebSafe(JSON.stringify(Object.assign({}, data, { iat: Date.now(), exp: Date.now() + TOKEN_TTL_MS }))).replace(/=+$/, '');
  const signature = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, secret)).replace(/=+$/, '');
  return payload + '.' + signature;
}

function verifyToken(token) {
  if (!token || String(token).indexOf('.') < 0) return null;
  try {
    const parts = String(token).split('.');
    if (parts.length !== 2) return null;
    const secret = PropertiesService.getScriptProperties().getProperty('SECRET_KEY');
    if (!secret || secret.length < 32) return null;
    const expected = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(parts[0], secret)).replace(/=+$/, '');
    if (expected !== parts[1]) return null;
    const payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
    if (!payload.exp || Date.now() > Number(payload.exp)) return null;
    return payload;
  } catch (e) { return null; }
}

function getHeaderToken(e) { return e && e.parameter ? e.parameter.token || null : null; }

function logAudit(action, resource, details) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.AUDIT_LOG);

  sheet.appendRow([
    Utilities.getUuid(),
    new Date(),
    action,
    resource,
    JSON.stringify(details || {}),
    Session.getActiveUser().getEmail()
  ]);
}

// ========== Placeholder Handlers (Stub) ==========
function handlePayments(endpoint, payload, token) {
  const user = verifyToken(token);
  if (!user || !['admin', 'manager'].includes(String(user.role).toLowerCase())) return { success: false, error: 'Unauthorized' };
  const action = endpoint.split('/')[1];
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const orders = ss.getSheetByName(SHEETS.ORDERS);
  const payments = ss.getSheetByName(SHEETS.PAYMENTS);
  const values = orders.getDataRange().getValues();
  if (action === 'status') {
    const orderId = String(payload.orderId || '');
    for (let i = 1; i < values.length; i++) if (String(values[i][0]) === orderId) {
      return { success: true, orderId: orderId, paymentStatus: values[i][8], orderStatus: values[i][7] };
    }
    return { success: false, error: 'Order tidak ditemukan' };
  }
  if (action !== 'verify') return { success: false, error: 'Unknown payment action' };
  const proof = payload.proof && typeof payload.proof === 'object' ? payload.proof : {};
  const orderId = String(payload.orderId || '');
  for (let i = 1; i < values.length; i++) if (String(values[i][0]) === orderId) {
    if (String(values[i][8]) === 'verified') return { success: false, error: 'Pembayaran sudah diverifikasi sebelumnya' };
    const expectedAmount = Number(values[i][6] || 0);
    const receivedAmount = Number(proof.amount !== undefined ? proof.amount : payload.amount !== undefined ? payload.amount : expectedAmount);
    if (!Number.isFinite(receivedAmount) || receivedAmount !== expectedAmount) return { success: false, error: 'Jumlah pembayaran tidak sama dengan total order' };
    const method = String(proof.method || payload.method || 'manual');
    const proofUrl = String(proof.proofUrl || proof.proof || payload.proofUrl || payload.proof || '');
    const notes = String(proof.notes || payload.notes || '');
    orders.getRange(i + 1, 9).setValue('verified');
    orders.getRange(i + 1, 8).setValue('payment_verified');
    payments.appendRow([Utilities.getUuid(), orderId, receivedAmount, 'verified', method, proofUrl, user.email, new Date(), new Date()]);
    logAudit('PAYMENT_VERIFIED', orderId, { verifiedBy: user.email, method: method, notes: notes });
    return { success: true, orderId: orderId, paymentStatus: 'verified' };
  }
  return { success: false, error: 'Order tidak ditemukan' };
}

function handleEmergency(endpoint, payload, token) {
  const action = endpoint.split('/')[1];
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(SHEETS.EMERGENCY);
  if (action === 'create') {
    const ticketId = 'EMG-' + Date.now();
    sh.appendRow([ticketId, payload.customerId || 'GUEST', payload.customerName || 'Guest', payload.customerPhone || '', Number(payload.lat || 0), Number(payload.lng || 0), String(payload.complaint || ''), 'created', '', 0, 0, new Date(), '']);
    logAudit('EMERGENCY_CREATED', ticketId, { customerName: payload.customerName || 'Guest' });
    return { success: true, ticketId: ticketId, status: 'created' };
  }
  const user = verifyToken(token);
  if (!user || !['admin', 'manager', 'mechanic'].includes(String(user.role).toLowerCase())) return { success: false, error: 'Unauthorized' };
  const rows = sh.getDataRange().getValues();
  if (action === 'list') return { success: true, tickets: rows.slice(1).map(r => ({ ticketId:r[0], customerId:r[1], customerName:r[2], customerPhone:r[3], lat:r[4], lng:r[5], complaint:r[6], status:r[7], assignedTo:r[8], estimatedCost:r[9], actualCost:r[10], createdAt:r[11], completedAt:r[12] })) };
  const ticketId = String(payload.id || payload.ticketId || '');
  for (let i = 1; i < rows.length; i++) if (String(rows[i][0]) === ticketId) {
    if (action === 'get') return { success: true, ticket: { ticketId:rows[i][0], customerId:rows[i][1], customerName:rows[i][2], customerPhone:rows[i][3], lat:rows[i][4], lng:rows[i][5], complaint:rows[i][6], status:rows[i][7], assignedTo:rows[i][8], estimatedCost:rows[i][9], actualCost:rows[i][10], createdAt:rows[i][11], completedAt:rows[i][12] } };
    if (action === 'update') {
      if (payload.status) sh.getRange(i + 1, 8).setValue(String(payload.status));
      if (payload.assignedTo !== undefined) sh.getRange(i + 1, 9).setValue(String(payload.assignedTo));
      if (payload.estimatedCost !== undefined) sh.getRange(i + 1, 10).setValue(Number(payload.estimatedCost || 0));
      if (payload.actualCost !== undefined) sh.getRange(i + 1, 11).setValue(Number(payload.actualCost || 0));
      if (String(payload.status || '') === 'completed') sh.getRange(i + 1, 13).setValue(new Date());
      logAudit('EMERGENCY_UPDATED', ticketId, { updatedBy: user.email, status: payload.status || '' });
      return { success: true, ticketId: ticketId };
    }
  }
  return { success: false, error: 'Tiket emergency tidak ditemukan atau action tidak dikenal' };
}

function handleInventory(endpoint, payload, token) {
  return pasHandleInventoryRouter(endpoint, payload, token);
}

function handleDiscount(endpoint, payload, token) {
  const user = verifyToken(token); if (!user) return {success:false,error:'Unauthorized'};
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID), sh = ss.getSheetByName(SHEETS.DISCOUNT_REQUESTS), action = endpoint.split('/')[1];
  if (action === 'request') { const id=Utilities.getUuid(); const original=Number(payload.originalAmount||0), discount=Number(payload.discountAmount||0); if (discount<=0 || discount>=original) return {success:false,error:'Nilai diskon tidak valid'}; sh.appendRow([id,payload.orderId||'',original,discount,original-discount,String(payload.reason||''),user.email,'','requested',new Date(),'']); logAudit('DISCOUNT_REQUESTED',id,{by:user.email}); return {success:true,requestId:id}; }
  if (action === 'approve') { if (!['admin','manager'].includes(user.role)) return {success:false,error:'Unauthorized'}; const rows=sh.getDataRange().getValues(); for(let i=1;i<rows.length;i++) if(String(rows[i][0])===String(payload.id)){ sh.getRange(i+1,8).setValue(user.email); sh.getRange(i+1,9).setValue(payload.approved?'approved':'rejected'); sh.getRange(i+1,11).setValue(new Date()); logAudit(payload.approved?'DISCOUNT_APPROVED':'DISCOUNT_REJECTED',payload.id,{by:user.email}); return {success:true}; } return {success:false,error:'Request tidak ditemukan'}; }
  return {success:false,error:'Unknown discount action'};
}

function handleLocation(endpoint, payload, token) {
  return { success: true };
}

function handleDashboard(endpoint, payload, token) {
  const user=verifyToken(token); if(!user) return {success:false,error:'Unauthorized'};
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID), orders=ss.getSheetByName(SHEETS.ORDERS).getDataRange().getValues(), emergencies=ss.getSheetByName(SHEETS.EMERGENCY).getDataRange().getValues(), discounts=ss.getSheetByName(SHEETS.DISCOUNT_REQUESTS).getDataRange().getValues();
  const today=new Date(); const sameDay=d=>d instanceof Date && d.getFullYear()===today.getFullYear() && d.getMonth()===today.getMonth() && d.getDate()===today.getDate();
  const bookingToday=orders.slice(1).filter(r=>sameDay(r[9])).length, paymentPending=orders.slice(1).filter(r=>String(r[8])==='pending').length, workActive=orders.slice(1).filter(r=>String(r[7])==='in_progress').length, emergency=emergencies.slice(1).filter(r=>!['completed','cancelled'].includes(String(r[7]))).length, revenue=orders.slice(1).filter(r=>String(r[8])==='verified').reduce((s,r)=>s+Number(r[6]||0),0), discountPending=discounts.slice(1).filter(r=>String(r[8])==='requested').length;
  return {success:true,bookingToday,paymentPending,workActive,emergency,revenue,discountPending};
}

function handleAudit(endpoint, payload, token) {
  return { success: true, logs: [] };
}


// ===== Compatibility: existing PAS admin account maintenance functions =====
function setupFirstPASAdmin() {
  const email = 'primaautoservice.official@gmail.com';
  const adminName = 'Administrator PAS-One';

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usersSheet = ss.getSheetByName(SHEETS.USERS);

  if (!usersSheet) {
    throw new Error('Sheet Users tidak ditemukan.');
  }

  const data = usersSheet.getDataRange().getValues();

  // Jangan membuat akun duplikat.
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toLowerCase() === email) {
      if (data[i][0] && data[i][2] && data[i][4] === 'admin') {
        Logger.log('Akun admin sudah lengkap. Tidak ada perubahan.');
        return;
      }

      throw new Error(
        'Email sudah ada tetapi datanya belum lengkap. ' +
        'Periksa baris akun tersebut sebelum melanjutkan.'
      );
    }
  }

  throw new Error(
    'Email belum ditemukan di Users. Tambahkan akun melalui prosedur ' +
    'pembuatan akun yang disetujui sebelum menjalankan fungsi ini.'
  );
}


function repairFirstPASAdmin() {
  const email = 'primaautoservice.official@gmail.com';
  const adminName = 'Administrator PAS-One';

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.USERS);

  if (!sheet) throw new Error('Sheet Users tidak ditemukan.');

  const data = sheet.getDataRange().getValues();
  let rowNumber = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toLowerCase() === email) {
      rowNumber = i + 1;
      break;
    }
  }

  if (rowNumber === -1) {
    throw new Error('Email admin tidak ditemukan di Users.');
  }

  const row = sheet.getRange(rowNumber, 1, 1, 7).getValues()[0];

  // Hanya memperbaiki akun jika memang belum lengkap.
  if (row[0] && row[2] && row[3] && row[4] === 'admin' && row[5]) {
    Logger.log('Akun sudah lengkap; tidak ada perubahan.');
    return;
  }

  // Jangan menimpa akun yang sudah memiliki password hash.
  if (row[2]) {
    throw new Error(
      'Password hash sudah terisi. Hentikan perbaikan otomatis.'
    );
  }

  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Perbaiki akun admin PAS-One',
    'Masukkan password admin baru (minimal 10 karakter). Password tidak akan ditampilkan di log.',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) {
    Logger.log('Dibatalkan.');
    return;
  }

  const password = response.getResponseText();
  if (password.length < 10 || password.length > 128) {
    throw new Error('Password harus 10–128 karakter.');
  }

  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password
  );

  sheet.getRange(rowNumber, 1).setValue(row[0] || Utilities.getUuid());
  sheet.getRange(rowNumber, 3).setValue(
    Utilities.base64Encode(digest)
  );
  sheet.getRange(rowNumber, 4).setValue(row[3] || adminName);
  sheet.getRange(rowNumber, 5).setValue('admin');
  sheet.getRange(rowNumber, 6).setValue(row[5] || new Date());
  sheet.getRange(rowNumber, 7).setValue(true);

  Logger.log('Akun admin diperbaiki. Silakan uji login.');
}

