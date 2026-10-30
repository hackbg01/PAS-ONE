/**
 * PAS-One Inventory Module
 * INSTALLATION:
 * 1) Add this file's helper functions to Apps Script as InventoryModule.gs.
 * 2) In Code.gs, replace the existing handleInventory(...) stub with the wrapper below.
 * 3) Keep existing Inventory columns A:I unchanged; new fields are appended J:P.
 *
 * CSV duplicate policy: update existing row by SKU OR Part Number; imported Qty,
 * purchase/sale price and metadata replace the existing values.
 */

function pasHandleInventoryRouter(endpoint, payload, token) {
  const action = String(endpoint || '').split('/')[1] || '';
  const user = verifyToken(token);

  if (action === 'list') {
    if (!pasInventoryCanRead(user)) {
      return { success: false, error: 'Unauthorized: PART STAFF or admin required' };
    }
    return pasInventoryList();
  }

  if (!pasInventoryCanWrite(user)) {
    return { success: false, error: 'Unauthorized: PART STAFF or admin required' };
  }

  if (action === 'import') {
    if (typeof payload.csvData !== 'string' || !payload.csvData.trim()) {
      return { success: false, error: 'File CSV kosong atau tidak terbaca' };
    }
    return pasInventoryImportCsv(payload.csvData, user);
  }

  if (action === 'create') return pasInventoryCreate(payload, user);
  if (action === 'update') return pasInventoryUpdate(payload, user);
  if (action === 'audit') return pasInventorySaveAudit(payload, user);

  return { success: false, error: 'Unknown inventory action: ' + action };
}

function pasInventoryCanRead(user) {
  if (!user || !user.role) return false;
  return ['admin', 'part_staff', 'partstaff', 'manager'].indexOf(String(user.role).toLowerCase()) >= 0;
}

function pasInventoryCanWrite(user) {
  if (!user || !user.role) return false;
  return ['admin', 'part_staff', 'partstaff'].indexOf(String(user.role).toLowerCase()) >= 0;
}

function pasInventorySheet() {
  if (!SPREADSHEET_ID) throw new Error('Script Property SPREADSHEET_ID belum diisi');
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName('Inventory');
  if (!sh) sh = ss.insertSheet('Inventory');

  // Preserve existing A:I columns used by the current backend.
  const baseHeaders = ['partId','name','category','unit','quantity','minStock','price','supplier','createdAt'];
  const extendedHeaders = ['sku','partNumber','brand','warehouse','location','purchasePrice','vendor'];
  const current = sh.getRange(1, 1, 1, baseHeaders.length).getValues()[0];
  if (current.every(v => v === '' || v === null)) {
    sh.getRange(1, 1, 1, baseHeaders.length).setValues([baseHeaders]);
  }
  const extRange = sh.getRange(1, 10, 1, extendedHeaders.length);
  const extCurrent = extRange.getValues()[0];
  // Fill each extension header only when that cell is empty.
  extCurrent.forEach((v, i) => {
    if (v === '' || v === null) sh.getRange(1, 10 + i).setValue(extendedHeaders[i]);
  });
  sh.setFrozenRows(1);
  return sh;
}

function pasInventoryRowToItem(row, index) {
  return {
    id: row[0] || '',
    name: row[1] || '',
    category: row[2] || '',
    unit: row[3] || '',
    quantity: Number(row[4] || 0),
    minStock: Number(row[5] || 0),
    price: Number(row[6] || 0), // sale price: legacy field retained
    supplier: row[7] || '', // legacy supplier field retained for compatibility
    createdAt: row[8] || '',
    sku: row[9] || '',
    partNumber: row[10] || '',
    brand: row[11] || '',
    warehouse: row[12] || '',
    location: row[13] || '',
    purchasePrice: Number(row[14] || 0),
    vendor: row[15] || ''
  };
}

function pasInventoryList() {
  try {
    const sh = pasInventorySheet();
    const values = sh.getDataRange().getValues();
    const items = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i].some(v => v !== '' && v !== null)) items.push(pasInventoryRowToItem(values[i], i));
    }
    return { success: true, items: items };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function pasInventoryCreate(data, user) {
  const sh = pasInventorySheet();
  const normalized = pasInventoryNormalizeRecord(data || {});
  if (!normalized.name) return { success: false, error: 'Nama Part wajib diisi' };
  if (!normalized.sku && !normalized.partNumber) {
    return { success: false, error: 'SKU atau Part Number wajib diisi' };
  }

  const existing = pasInventoryFindDuplicate(sh, normalized.sku, normalized.partNumber);
  if (existing) return { success: false, error: 'SKU/Part Number sudah ada. Gunakan update atau impor CSV.' };

  const row = pasInventoryToRow(normalized, Utilities.getUuid(), new Date());
  sh.appendRow(row);
  logAudit('INVENTORY_CREATED', normalized.sku || normalized.partNumber, {
    name: normalized.name, actor: user.email || user.userId
  });
  return { success: true, id: row[0] };
}

function pasInventoryUpdate(data, user) {
  const sh = pasInventorySheet();
  const id = String((data && (data.id || data.partId)) || '');
  if (!id) return { success: false, error: 'ID part wajib diisi untuk update' };

  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === id) {
      const prior = pasInventoryRowToItem(values[i], i);
      const merged = pasInventoryNormalizeRecord(Object.assign({}, prior, data || {}));
      const duplicate = pasInventoryFindDuplicate(sh, merged.sku, merged.partNumber, i + 1);
      if (duplicate) return { success: false, error: 'SKU/Part Number dipakai item lain' };
      sh.getRange(i + 1, 1, 1, 16).setValues([pasInventoryToRow(merged, id, values[i][8] || new Date())]);
      logAudit('INVENTORY_UPDATED', id, { actor: user.email || user.userId });
      return { success: true, id: id };
    }
  }
  return { success: false, error: 'Part tidak ditemukan' };
}

function pasInventoryImportCsv(csvData, user) {
  const parsed = Utilities.parseCsv(csvData);
  if (!parsed || parsed.length < 2) return { success: false, error: 'CSV tidak berisi baris data' };

  const headers = parsed[0].map(h => pasInventoryNormalizeHeader(h));
  const col = {};
  headers.forEach((h, i) => { if (h) col[h] = i; });

  const aliases = {
    sku: ['sku','kode sku'],
    partNumber: ['part number','partnumber','part no','part no.','part_number','nomor part'],
    name: ['nama part','nama','name','part name'],
    brand: ['brand','merek'],
    category: ['kategori','category'],
    unit: ['satuan','uom','unit'],
    warehouse: ['gudang','warehouse'],
    location: ['lokasi','location'],
    quantity: ['qty','quantity','stok','stock'],
    purchasePrice: ['harga beli','purchase price','hpp','cost'],
    price: ['harga jual','sale price','selling price','price'],
    vendor: ['nama vendor','vendor','supplier','nama supplier'],
    minStock: ['min stock','minstock','minimum stock']
  };

  const indexFor = {};
  Object.keys(aliases).forEach(key => {
    indexFor[key] = -1;
    for (const alias of aliases[key]) {
      const found = headers.indexOf(pasInventoryNormalizeHeader(alias));
      if (found >= 0) { indexFor[key] = found; break; }
    }
  });

  if (indexFor.sku < 0 && indexFor.partNumber < 0) {
    return { success: false, error: 'CSV wajib memiliki kolom SKU atau Part Number' };
  }
  if (indexFor.name < 0) return { success: false, error: 'CSV wajib memiliki kolom Nama Part/Nama' };

  const sh = pasInventorySheet();
  const current = sh.getDataRange().getValues();
  const duplicateMap = {};
  for (let i = 1; i < current.length; i++) {
    const sku = String(current[i][9] || '').trim().toUpperCase();
    const pn = String(current[i][10] || '').trim().toUpperCase();
    if (sku) duplicateMap['SKU:' + sku] = i + 1;
    if (pn) duplicateMap['PN:' + pn] = i + 1;
  }

  let created = 0, updated = 0, skipped = 0;
  const errors = [];
  for (let r = 1; r < parsed.length; r++) {
    const csvRow = parsed[r];
    if (!csvRow || csvRow.every(v => String(v || '').trim() === '')) continue;
    try {
      const rec = {};
      Object.keys(indexFor).forEach(key => {
        const idx = indexFor[key];
        if (idx >= 0) rec[key] = csvRow[idx];
      });
      const item = pasInventoryNormalizeRecord(rec);
      if (!item.name) throw new Error('Nama Part kosong');
      if (!item.sku && !item.partNumber) throw new Error('SKU dan Part Number sama-sama kosong');

      const keys = [];
      if (item.sku) keys.push('SKU:' + item.sku.toUpperCase());
      if (item.partNumber) keys.push('PN:' + item.partNumber.toUpperCase());
      const matchingRows = keys.map(k => duplicateMap[k]).filter(Boolean);
      const targetRow = matchingRows.length ? matchingRows[0] : 0;

      if (matchingRows.length > 1 && matchingRows.some(n => n !== targetRow)) {
        throw new Error('SKU dan Part Number menunjuk ke dua item berbeda; perlu pemeriksaan manual');
      }

      // The supplied stock export has no purchase-price/vendor values.
      // Preserve existing internal values when those CSV cells are absent/blank.
      let existingRow = null;
      if (targetRow) existingRow = sh.getRange(targetRow, 1, 1, 16).getValues()[0];
      if (targetRow && existingRow) {
        if (indexFor.purchasePrice < 0 || String(csvRow[indexFor.purchasePrice] || '').trim() === '') {
          item.purchasePrice = Number(existingRow[14] || 0);
        }
        if (indexFor.vendor < 0 || String(csvRow[indexFor.vendor] || '').trim() === '') {
          item.vendor = String(existingRow[15] || '');
        }
        if (indexFor.minStock < 0 || String(csvRow[indexFor.minStock] || '').trim() === '') {
          item.minStock = Number(existingRow[5] || 0);
        }
      }
      const id = targetRow ? String(existingRow[0]) : Utilities.getUuid();
      const createdAt = targetRow ? (existingRow[8] || new Date()) : new Date();
      const outRow = pasInventoryToRow(item, id, createdAt);

      if (targetRow) {
        sh.getRange(targetRow, 1, 1, 16).setValues([outRow]);
        updated++;
      } else {
        sh.appendRow(outRow);
        const newRow = sh.getLastRow();
        if (item.sku) duplicateMap['SKU:' + item.sku.toUpperCase()] = newRow;
        if (item.partNumber) duplicateMap['PN:' + item.partNumber.toUpperCase()] = newRow;
        created++;
      }

      const savedRow = targetRow || sh.getLastRow();
      if (item.sku) duplicateMap['SKU:' + item.sku.toUpperCase()] = savedRow;
      if (item.partNumber) duplicateMap['PN:' + item.partNumber.toUpperCase()] = savedRow;
    } catch (err) {
      skipped++;
      if (errors.length < 30) errors.push({ row: r + 1, error: err.message });
    }
  }

  logAudit('INVENTORY_CSV_IMPORT', 'Inventory', {
    created: created, updated: updated, skipped: skipped,
    actor: user.email || user.userId
  });
  return {
    success: true,
    created: created,
    updated: updated,
    skipped: skipped,
    errors: errors,
    message: 'Import selesai: ' + created + ' baru, ' + updated + ' diperbarui, ' + skipped + ' dilewati.'
  };
}

function pasInventoryNormalizeRecord(data) {
  const d = data || {};
  return {
    sku: String(d.sku || '').trim(),
    partNumber: String(d.partNumber || '').trim(),
    name: String(d.name || d.partName || '').trim(),
    brand: String(d.brand || '').trim(),
    category: String(d.category || 'spare-part').trim(),
    unit: String(d.unit || 'pcs').trim(),
    warehouse: String(d.warehouse || '').trim(),
    location: String(d.location || '').trim(),
    quantity: pasInventoryNumber(d.quantity !== undefined ? d.quantity : d.qty, 0),
    minStock: pasInventoryNumber(d.minStock, 0),
    purchasePrice: pasInventoryNumber(d.purchasePrice, 0),
    price: pasInventoryNumber(d.price !== undefined ? d.price : d.salePrice, 0),
    vendor: String(d.vendor || d.supplier || '').trim()
  };
}

function pasInventoryNumber(value, fallback) {
  if (value === null || value === undefined || String(value).trim() === '') return fallback;
  const cleaned = String(value).replace(/[Rp\s]/gi, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function pasInventoryToRow(item, id, createdAt) {
  return [
    id, item.name, item.category, item.unit, item.quantity,
    item.minStock, item.price, item.vendor, createdAt,
    item.sku, item.partNumber, item.brand, item.warehouse,
    item.location, item.purchasePrice, item.vendor
  ];
}

function pasInventoryFindDuplicate(sh, sku, partNumber, excludeRow) {
  const values = sh.getDataRange().getValues();
  const skuKey = String(sku || '').trim().toUpperCase();
  const pnKey = String(partNumber || '').trim().toUpperCase();
  for (let i = 1; i < values.length; i++) {
    const rowNum = i + 1;
    if (excludeRow && rowNum === excludeRow) continue;
    const rowSku = String(values[i][9] || '').trim().toUpperCase();
    const rowPn = String(values[i][10] || '').trim().toUpperCase();
    if ((skuKey && rowSku === skuKey) || (pnKey && rowPn === pnKey)) return rowNum;
  }
  return 0;
}

function pasInventoryNormalizeHeader(value) {
  return String(value || '').replace(/^\uFEFF/, '').trim().toLowerCase()
    .replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

function pasInventorySaveAudit(payload, user) {
  const sh = pasInventorySheet();
  const code = String((payload && (payload.sku || payload.partNumber || payload.scannedCode)) || '').trim();
  const physicalQty = pasInventoryNumber(payload && payload.physicalQty, -1);
  if (!code) return { success: false, error: 'SKU/Part Number hasil scan wajib ada' };
  if (physicalQty < 0) return { success: false, error: 'Qty fisik wajib berupa angka nol atau lebih' };

  const values = sh.getDataRange().getValues();
  let found = null;
  for (let i = 1; i < values.length; i++) {
    const sku = String(values[i][9] || '').trim().toUpperCase();
    const pn = String(values[i][10] || '').trim().toUpperCase();
    if (code.toUpperCase() === sku || code.toUpperCase() === pn || code === String(values[i][0])) {
      found = pasInventoryRowToItem(values[i], i);
      break;
    }
  }
  if (!found) return { success: false, error: 'Part tidak ditemukan berdasarkan SKU/Part Number' };

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let audit = ss.getSheetByName('StockAudit');
  if (!audit) audit = ss.insertSheet('StockAudit');
  if (audit.getLastRow() === 0) {
    audit.appendRow(['auditId','sessionId','scannedCode','partId','partName','systemQty','physicalQty','variance','scannedBy','scannedAt','notes']);
  } else if (audit.getRange(1,1).getValue() === '') {
    audit.getRange(1,1,1,11).setValues([['auditId','sessionId','scannedCode','partId','partName','systemQty','physicalQty','variance','scannedBy','scannedAt','notes']]);
  }
  const sessionId = String(payload.sessionId || Utilities.getUuid());
  audit.appendRow([
    Utilities.getUuid(), sessionId, code, found.id, found.name,
    found.quantity, physicalQty, physicalQty - found.quantity,
    user.email || user.userId || '', new Date(), String(payload.notes || '')
  ]);
  logAudit('STOCK_AUDIT_RECORDED', code, {
    systemQty: found.quantity, physicalQty: physicalQty,
    variance: physicalQty - found.quantity, actor: user.email || user.userId
  });
  return {
    success: true,
    item: found,
    systemQty: found.quantity,
    physicalQty: physicalQty,
    variance: physicalQty - found.quantity,
    sessionId: sessionId
  };
}
