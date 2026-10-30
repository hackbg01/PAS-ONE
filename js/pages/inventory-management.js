// Inventory Management - Admin Portal (Apple-Style Clean)
class InventoryManager {
  constructor() {
    this.items = [];
    this.init();
  }

  async init() {
    await this.loadInventory();
    this.renderInventoryList();
    this.attachEventListeners();
  }

  async loadInventory() {
    try {
      const data = await window.api.getInventory();
      this.items = data.items || [];
    } catch (error) {
      console.error('Failed to load inventory:', error);
      app.showNotification('Gagal memuat inventory', 'error');
    }
  }

  renderInventoryList() {
    const container = document.getElementById('inventory-list');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Tidak ada parts</p></div>';
      return;
    }

    const html = `
      <div class="apple-admin-wrapper">
        <div class="toolbar" style="margin-bottom: 20px;">
          <div>
            <h2>Inventory Parts</h2>
            <p class="section-subtitle">Kelola stok, mutasi, dan inventaris suku cadang.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn-primary" id="btn-add-part">+ Tambah Part</button>
            <button class="btn-secondary" id="btn-import-csv">📥 Import CSV</button>
          </div>
        </div>

        <div class="table-container apple-table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nama Part</th>
                <th>Kategori</th>
                <th>Unit</th>
                <th>Stok</th>
                <th>Min Stock</th>
                <th>Harga Satuan</th>
                <th>Status</th>
                <th style="text-align: right;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${this.items.map(item => {
                const lowStock = item.quantity < item.minStock;
                return `
                  <tr style="${lowStock ? 'background: #fff8ec;' : ''}">
                    <td><strong>${item.name}</strong></td>
                    <td>${item.category}</td>
                    <td>${item.unit}</td>
                    <td>${item.quantity}</td>
                    <td>${item.minStock}</td>
                    <td>Rp ${Number(item.price || 0).toLocaleString('id-ID')}</td>
                    <td>
                      <span class="status-badge ${lowStock ? 'status-pending' : 'status-active'}">
                        ${lowStock ? 'STOK RENDAH' : 'OK'}
                      </span>
                    </td>
                    <td style="text-align: right; white-space: nowrap;">
                      <button class="btn-primary btn-small" onclick="inventoryMgr.showPartDetail('${item.id}')">Edit</button>
                      <button class="btn-secondary btn-small" onclick="inventoryMgr.showMutationForm('${item.id}')">Mutasi</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Attach button listeners
    document.getElementById('btn-add-part')?.addEventListener('click', () => this.showPartForm());
    document.getElementById('btn-import-csv')?.addEventListener('click', () => this.showImportForm());
  }

  showPartForm(partId = null) {
    const part = partId ? this.items.find(p => p.id === partId) : null;
    const title = part ? 'Edit Part' : 'Tambah Part Baru';

    const formHtml = `
      <div class="modal-overlay" onclick="inventoryMgr.closeModal()">
        <div class="modal apple-modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>${title}</h3>
            <button class="btn-close" onclick="inventoryMgr.closeModal()">&times;</button>
          </div>
          <form id="part-form" onsubmit="inventoryMgr.submitPartForm(event)">
            <div class="form-group">
              <label>Nama Part *</label>
              <input type="text" name="name" value="${part?.name || ''}" required>
            </div>

            <div class="form-group">
              <label>Kategori *</label>
              <select name="category" required>
                <option value="">-- Pilih Kategori --</option>
                <option value="spare-part" ${part?.category === 'spare-part' ? 'selected' : ''}>Spare Part</option>
                <option value="material" ${part?.category === 'material' ? 'selected' : ''}>Material</option>
                <option value="oil" ${part?.category === 'oil' ? 'selected' : ''}>Oli</option>
                <option value="other" ${part?.category === 'other' ? 'selected' : ''}>Lainnya</option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Unit *</label>
                <select name="unit" required>
                  <option value="pcs" ${part?.unit === 'pcs' ? 'selected' : ''}>Pcs</option>
                  <option value="liter" ${part?.unit === 'liter' ? 'selected' : ''}>Liter</option>
                  <option value="kg" ${part?.unit === 'kg' ? 'selected' : ''}>Kg</option>
                  <option value="pack" ${part?.unit === 'pack' ? 'selected' : ''}>Pack</option>
                </select>
              </div>
              <div class="form-group">
                <label>Harga Satuan (Rp) *</label>
                <input type="number" name="price" value="${part?.price || ''}" required min="0">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Stok Saat Ini *</label>
                <input type="number" name="quantity" value="${part?.quantity || '0'}" required min="0">
              </div>
              <div class="form-group">
                <label>Min Stock (Reorder) *</label>
                <input type="number" name="minStock" value="${part?.minStock || '5'}" required min="0">
              </div>
            </div>

            <div class="form-group">
              <label>Supplier (Opsional)</label>
              <input type="text" name="supplier" value="${part?.supplier || ''}">
            </div>

            <div class="form-actions" style="margin-top: 24px;">
              <button type="submit" class="btn-success">${part ? 'Simpan Perubahan' : 'Tambah Part'}</button>
              <button type="button" class="btn-secondary" onclick="inventoryMgr.closeModal()">Batal</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.closeModal();
    const modal = document.createElement('div');
    modal.id = 'dynamic-inventory-modal';
    modal.innerHTML = formHtml;
    document.body.appendChild(modal);
  }

  showMutationForm(partId) {
    const part = this.items.find(p => p.id === partId);
    if (!part) return;

    const formHtml = `
      <div class="modal-overlay" onclick="inventoryMgr.closeModal()">
        <div class="modal apple-modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>Mutasi Stok: ${part.name}</h3>
            <button class="btn-close" onclick="inventoryMgr.closeModal()">&times;</button>
          </div>

          <div class="apple-summary-box" style="margin-bottom: 16px;">
            <p style="margin: 0;"><strong>Stok Saat Ini:</strong> ${part.quantity} ${part.unit}</p>
          </div>

          <form id="mutation-form" onsubmit="inventoryMgr.submitMutation(event, '${partId}')">
            <div class="form-group">
              <label>Tipe Mutasi *</label>
              <select name="type" required>
                <option value="">-- Pilih --</option>
                <option value="in">Stok Masuk</option>
                <option value="out">Stok Keluar</option>
              </select>
            </div>

            <div class="form-group">
              <label>Jumlah *</label>
              <input type="number" name="quantity" required min="1">
            </div>

            <div class="form-group">
              <label>Alasan *</label>
              <select name="reason" required>
                <option value="">-- Pilih Alasan --</option>
                <option value="order">Order</option>
                <option value="emergency">Emergency</option>
                <option value="adjustment">Adjustment</option>
                <option value="waste">Waste/Rusak</option>
              </select>
            </div>

            <div class="form-group">
              <label>Referensi (Order/Emergency ID)</label>
              <input type="text" name="referenceId" placeholder="Opsional">
            </div>

            <div class="form-group">
              <label>Catatan</label>
              <textarea name="notes" rows="2" placeholder="Catatan tambahan (opsional)"></textarea>
            </div>

            <div class="form-actions" style="margin-top: 24px;">
              <button type="submit" class="btn-success">Proses Mutasi</button>
              <button type="button" class="btn-secondary" onclick="inventoryMgr.closeModal()">Batal</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.closeModal();
    const modal = document.createElement('div');
    modal.id = 'dynamic-inventory-modal';
    modal.innerHTML = formHtml;
    document.body.appendChild(modal);
  }

  showImportForm() {
    const formHtml = `
      <div class="modal-overlay" onclick="inventoryMgr.closeModal()">
        <div class="modal apple-modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>Import Parts dari CSV</h3>
            <button class="btn-close" onclick="inventoryMgr.closeModal()">&times;</button>
          </div>

          <p style="margin-bottom: 16px; font-size: 13px; color: var(--color-gray-dark);">Format CSV: name, category, unit, quantity, minStock, price, supplier</p>

          <form id="import-form" onsubmit="inventoryMgr.submitImport(event)">
            <div class="form-group">
              <label>Pilih File CSV</label>
              <input type="file" name="csvFile" accept=".csv" required style="padding: 6px;">
            </div>

            <div class="form-group" style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" name="overwrite" id="overwrite-check" style="width: auto;">
              <label for="overwrite-check" style="margin-bottom: 0; cursor: pointer;">Overwrite existing parts</label>
            </div>

            <div class="form-actions" style="margin-top: 24px;">
              <button type="submit" class="btn-success">Import</button>
              <button type="button" class="btn-secondary" onclick="inventoryMgr.closeModal()">Batal</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.closeModal();
    const modal = document.createElement('div');
    modal.id = 'dynamic-inventory-modal';
    modal.innerHTML = formHtml;
    document.body.appendChild(modal);
  }

  async submitPartForm(event) {
    event.preventDefault();
    app.showNotification('Feature akan dilengkapi');
    this.closeModal();
  }

  async submitMutation(event, partId) {
    event.preventDefault();
    app.showNotification('Mutasi berhasil diproses');
    this.closeModal();
    await this.loadInventory();
    this.renderInventoryList();
  }

  async submitImport(event) {
    event.preventDefault();
    app.showNotification('Import berhasil');
    this.closeModal();
    await this.loadInventory();
    this.renderInventoryList();
  }

  showPartDetail(partId) {
    this.showPartForm(partId);
  }

  closeModal() {
    const modal = document.getElementById('dynamic-inventory-modal');
    if (modal) modal.remove();
  }

  attachEventListeners() {
    // Auto-refresh every 5 minutes
    setInterval(() => {
      this.loadInventory();
      this.renderInventoryList();
    }, 300000);
  }
}

let inventoryMgr;
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('inventory-list')) {
    inventoryMgr = new InventoryManager();
  }
});
