<!-- Struktur HTML & Interface Admin Orders - Apple.com Style -->
<div id="tab-orders" class="tab-content active">
  <div class="apple-admin-wrapper">
    
    <!-- Header Section ala Apple (Clean & Typography-focused) -->
    <div class="apple-section-header">
      <div>
        <h2>Manajemen Pesanan</h2>
        <p class="section-subtitle">Kelola dan pantau status transaksi pelanggan secara real-time.</p>
      </div>
      <div class="filter-bar">
        <select id="status-filter" onchange="adminOrders.filterByStatus(this.value)">
          <option value="">-- Semua Status --</option>
          <option value="draft">Draft</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="payment_verified">Payment Verified</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>

    <!-- Container Tabel Pesanan -->
    <div id="orders-table-container">
      <!-- Diisi secara dinamis oleh JavaScript -->
    </div>
  </div>

  <!-- Modal Detail Pesanan (Apple Spatial Modal) -->
  <div id="order-detail-modal" class="modal-overlay" style="display:none;">
    <div class="modal apple-modal">
      <div class="modal-header">
        <h3>Detail Pesanan</h3>
        <button class="btn-close" onclick="adminOrders.closeDetailModal()">&times;</button>
      </div>
      <div class="modal-content" id="order-detail-content">
        <!-- Konten Detail -->
      </div>
      <div class="form-actions" style="margin-top: 24px;">
        <button class="btn-secondary" onclick="adminOrders.closeDetailModal()">Tutup</button>
      </div>
    </div>
  </div>

  <!-- Modal Update Status (Apple Spatial Modal) -->
  <div id="status-modal" class="modal-overlay" style="display:none;">
    <div class="modal apple-modal">
      <div class="modal-header">
        <h3>Perbarui Status Pesanan</h3>
        <button class="btn-close" onclick="adminOrders.closeStatusModal()">&times;</button>
      </div>
      <form onsubmit="adminOrders.submitStatusUpdate(event)">
        <input type="hidden" id="status-order-id">
        <div class="form-group">
          <label>Status Baru:
            <select name="status" required>
              <option value="">-- Pilih Status --</option>
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
        </div>
        <div class="form-group">
          <label>Catatan:
            <textarea name="notes" placeholder="Tambahkan catatan pembaruan..."></textarea>
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-success">Simpan Perubahan</button>
          <button type="button" class="btn-secondary" onclick="adminOrders.closeStatusModal()">Batal</button>
        </div>
      </form>
    </div>
  </div>
</div>

<script>
// Admin Order Management Page (Apple Clean Implementation)
class AdminOrdersPage {
  constructor() {
    this.orders = [];
    this.currentFilter = '';
    this.init();
  }

  async init() {
    await this.loadOrders();
    this.renderTable();
  }

  async loadOrders() {
    try {
      const response = await window.api.listOrders();
      this.orders = response.orders || [];
    } catch (error) {
      console.error('Failed to load orders:', error);
      this.orders = [];
    }
  }

  renderTable() {
    const displayOrders = this.currentFilter 
      ? this.orders.filter(o => o.orderStatus === this.currentFilter) 
      : this.orders;

    // Sinkronisasi dropdown filter jika ada
    const statusFilterEl = document.getElementById('status-filter');
    if (statusFilterEl && statusFilterEl.value !== this.currentFilter) {
      statusFilterEl.value = this.currentFilter;
    }

    const container = document.getElementById('orders-table-container');
    if (!container) return;

    if (displayOrders.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Tidak ada pesanan ditemukan.</p></div>';
      return;
    }

    const tableHtml = `
      <div class="table-container apple-table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Order Status</th>
              <th>Payment Status</th>
              <th>Tanggal</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${displayOrders.map(order => `
              <tr>
                <td><strong>${order.orderId}</strong></td>
                <td>${JSON.parse(order.customerData || '{}').name || 'Guest'}</td>
                <td>Rp ${Number(order.total || 0).toLocaleString('id-ID')}</td>
                <td><span class="status-badge status-${order.orderStatus}">${order.orderStatus}</span></td>
                <td><span class="status-badge status-${order.paymentStatus}">${order.paymentStatus}</span></td>
                <td>${new Date(order.createdAt).toLocaleDateString('id-ID')}</td>
                <td style="text-align: right; white-space: nowrap;">
                  <button class="btn-primary btn-small" onclick="adminOrders.viewDetails('${order.orderId}')">Detail</button>
                  <button class="btn-secondary btn-small" onclick="adminOrders.openStatusModal('${order.orderId}', '${order.orderStatus}')">Update</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = tableHtml;
  }

  filterByStatus(status) {
    this.currentFilter = status;
    this.renderTable();
  }

  viewDetails(orderId) {
    const order = this.orders.find(o => o.orderId === orderId);
    if (!order) return;

    const items = JSON.parse(order.items || '[]');
    const customer = JSON.parse(order.customerData || '{}');

    const detailHtml = `
      <div class="apple-detail-content">
        <h4 style="margin-bottom: 12px; font-size: 17px; font-weight: 600;">${order.orderId}</h4>
        <p style="color: var(--color-gray-dark); margin-bottom: 16px;"><strong>Pelanggan:</strong> ${customer.name || 'Guest'} (${customer.email || 'N/A'})</p>
        
        <p style="font-weight: 500; margin-bottom: 8px;">Daftar Item:</p>
        <ul style="margin-left: 18px; margin-bottom: 16px; color: var(--color-text);">
          ${items.map(item => `
            <li style="margin-bottom: 4px;">${item.name} × ${item.quantity} — <strong>Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</strong></li>
          `).join('')}
        </ul>
        
        <div class="apple-summary-box">
          <p>Subtotal: Rp ${(order.subtotal || 0).toLocaleString('id-ID')}</p>
          <p>Pajak: Rp ${(order.tax || 0).toLocaleString('id-ID')}</p>
          <p style="font-weight: 600; margin-top: 6px; color: var(--color-text);">Total: Rp ${(order.total || 0).toLocaleString('id-ID')}</p>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 16px; font-size: 13px;">
          <span class="status-badge status-${order.orderStatus}">Status: ${order.orderStatus}</span>
          <span class="status-badge status-${order.paymentStatus}">Pembayaran: ${order.paymentStatus}</span>
        </div>
      </div>
    `;

    document.getElementById('order-detail-content').innerHTML = detailHtml;
    document.getElementById('order-detail-modal').style.display = 'flex';
  }

  closeDetailModal() {
    document.getElementById('order-detail-modal').style.display = 'none';
  }

  openStatusModal(orderId, currentStatus) {
    document.getElementById('status-order-id').value = orderId;
    const select = document.querySelector('#status-modal select[name="status"]');
    if (select) select.value = currentStatus;
    document.getElementById('status-modal').style.display = 'flex';
  }

  closeStatusModal() {
    document.getElementById('status-modal').style.display = 'none';
  }

  async submitStatusUpdate(event) {
    event.preventDefault();
    const form = event.target;
    const orderId = document.getElementById('status-order-id').value;
    const newStatus = form.querySelector('select[name="status"]').value;

    try {
      const response = await window.api.updateOrderStatus(orderId, newStatus);
      if (response && response.success) {
        app.showNotification('Status pesanan berhasil diperbarui!');
        this.closeStatusModal();
        await this.loadOrders();
        this.renderTable();
      } else {
        app.showNotification('Gagal memperbarui status', 'error');
      }
    } catch (error) {
      app.showNotification('Update failed: ' + error.message, 'error');
    }
  }
}

window.adminOrders = null;
function showOrdersTab() {
  if (!window.adminOrders) {
    window.adminOrders = new AdminOrdersPage();
  } else {
    window.adminOrders.init();
  }
}
</script>

<style>
/* Tambahan Utility CSS Apple Aesthetic khusus komponen ini (Tanpa AI Slop) */
.apple-admin-wrapper {
  padding: 8px 0;
}

.apple-section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.section-subtitle {
  font-size: 13px;
  color: var(--color-gray-dark);
  margin-top: 2px;
}

.apple-table-card {
  background: var(--color-white);
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.apple-modal {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-gray-medium);
  box-shadow: 0 20px 40px rgba(0,0,0,0.12);
  animation: appleModalScale 250s cubic-bezier(0.25, 1, 0.5, 1);
}

.apple-summary-box {
  background: var(--color-gray-light);
  padding: 12px 16px;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-gray-medium);
}

@keyframes appleModalScale {
  from { transform: scale(0.96); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
