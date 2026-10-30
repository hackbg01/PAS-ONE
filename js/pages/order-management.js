// Order Management - Admin Portal (Apple-Style Clean)
class OrderManager {
  constructor() {
    this.orders = [];
    this.selectedOrder = null;
    this.init();
  }

  async init() {
    await this.loadOrders();
    this.renderOrderList();
    this.attachEventListeners();
  }

  async loadOrders() {
    try {
      const data = await window.api.listOrders();
      this.orders = data.orders || [];
    } catch (error) {
      console.error('Failed to load orders:', error);
      app.showNotification('Gagal memuat orders', 'error');
    }
  }

  renderOrderList() {
    const container = document.getElementById('order-list');
    if (!container) return;

    if (this.orders.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Tidak ada order</p></div>';
      return;
    }

    const html = `
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
              <th style="text-align: right;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${this.orders.map(order => `
              <tr>
                <td><strong>${order.orderId}</strong></td>
                <td>${order.customerData?.name || 'Guest'}</td>
                <td>Rp ${Number(order.total || 0).toLocaleString('id-ID')}</td>
                <td>
                  <span class="status-badge status-${order.orderStatus}">
                    ${this.formatStatus(order.orderStatus)}
                  </span>
                </td>
                <td>
                  <span class="status-badge status-${order.paymentStatus}">
                    ${this.formatStatus(order.paymentStatus)}
                  </span>
                </td>
                <td>${new Date(order.createdAt).toLocaleDateString('id-ID')}</td>
                <td style="text-align: right; white-space: nowrap;">
                  <button class="btn-primary btn-small" onclick="orderMgr.showOrderDetail('${order.orderId}')">
                    Detail
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;
  }

  formatStatus(status) {
    const statusMap = {
      'draft': 'Draft',
      'pending_payment': 'Menunggu Bayar',
      'payment_verified': 'Bayar Terverifikasi',
      'in_progress': 'Sedang Dikerjakan',
      'completed': 'Selesai',
      'cancelled': 'Dibatalkan',
      'payment_rejected': 'Bayar Ditolak'
    };
    return statusMap[status] || status;
  }

  async showOrderDetail(orderId) {
    try {
      const data = await window.api.getOrder(orderId);
      if (!data.order) {
        app.showNotification('Order tidak ditemukan', 'error');
        return;
      }

      const order = data.order;
      const itemsHtml = (order.items || []).map(item => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>Rp ${Number(item.price || 0).toLocaleString('id-ID')}</td>
          <td>Rp ${Number((item.quantity || 0) * (item.price || 0)).toLocaleString('id-ID')}</td>
        </tr>
      `).join('');

      const modalHtml = `
        <div class="modal-overlay" onclick="orderMgr.closeModal()">
          <div class="modal apple-modal" onclick="event.stopPropagation()">
            <div class="modal-header">
              <h3>Detail Order #${orderId}</h3>
              <button class="btn-close" onclick="orderMgr.closeModal()">&times;</button>
            </div>

            <div class="form-group" style="margin-bottom: 12px;">
              <label style="color: var(--color-gray-dark); font-size: 13px;">Customer</label>
              <p style="font-weight: 500; color: var(--color-text);">${order.customerData?.name || 'Guest'}</p>
            </div>

            <div class="form-group" style="margin-bottom: 16px;">
              <label style="color: var(--color-gray-dark); font-size: 13px;">Kontak</label>
              <p style="color: var(--color-text);">${order.customerData?.phone || 'N/A'} | ${order.customerData?.email || 'N/A'}</p>
            </div>

            <h4 style="margin-top: 20px; margin-bottom: 10px; font-size: 15px; font-weight: 600;">Items</h4>
            <div class="table-container" style="margin-bottom: 16px;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Harga</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>

            <div class="cost-summary">
              <div class="cost-item">
                <span>Subtotal:</span>
                <span>Rp ${Number(order.subtotal || 0).toLocaleString('id-ID')}</span>
              </div>
              <div class="cost-item">
                <span>Pajak (10%):</span>
                <span>Rp ${Number(order.tax || 0).toLocaleString('id-ID')}</span>
              </div>
              <div class="cost-total">
                <span>Total:</span>
                <span class="total-amount">Rp ${Number(order.total || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div class="form-group" style="margin-top: 20px;">
              <label>Update Status Order</label>
              <select id="order-status-select" style="margin-top: 4px;">
                <option value="draft" ${order.orderStatus === 'draft' ? 'selected' : ''}>Draft</option>
                <option value="pending_payment" ${order.orderStatus === 'pending_payment' ? 'selected' : ''}>Menunggu Pembayaran</option>
                <option value="payment_verified" ${order.orderStatus === 'payment_verified' ? 'selected' : ''}>Pembayaran Terverifikasi</option>
                <option value="in_progress" ${order.orderStatus === 'in_progress' ? 'selected' : ''}>Sedang Dikerjakan</option>
                <option value="completed" ${order.orderStatus === 'completed' ? 'selected' : ''}>Selesai</option>
                <option value="cancelled" ${order.orderStatus === 'cancelled' ? 'selected' : ''}>Dibatalkan</option>
              </select>
            </div>

            <div class="form-actions" style="margin-top: 24px;">
              <button class="btn-success" onclick="orderMgr.updateOrderStatus('${orderId}')">Simpan Status</button>
              <button class="btn-secondary" onclick="orderMgr.closeModal()">Tutup</button>
            </div>
          </div>
        </div>
      `;

      // Hapus modal lama jika ada
      this.closeModal();

      const modalContainer = document.createElement('div');
      modalContainer.id = 'dynamic-order-detail-modal';
      modalContainer.innerHTML = modalHtml;
      document.body.appendChild(modalContainer);
    } catch (error) {
      app.showNotification('Error: ' + error.message, 'error');
    }
  }

  async updateOrderStatus(orderId) {
    const statusSelect = document.getElementById('order-status-select');
    if (!statusSelect) return;
    const newStatus = statusSelect.value;

    try {
      const response = await window.api.updateOrderStatus(orderId, newStatus);
      if (response && response.success) {
        app.showNotification('Status order diupdate');
        this.closeModal();
        await this.loadOrders();
        this.renderOrderList();
      } else {
        app.showNotification('Gagal memperbarui status', 'error');
      }
    } catch (error) {
      app.showNotification('Error: ' + error.message, 'error');
    }
  }

  closeModal() {
    const modal = document.getElementById('dynamic-order-detail-modal');
    if (modal) modal.remove();
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.remove();
  }

  attachEventListeners() {
    setInterval(() => {
      this.loadOrders();
      this.renderOrderList();
    }, 120000); // Refresh every 2 minutes
  }
}

let orderMgr;
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('order-list')) {
    orderMgr = new OrderManager();
  }
});
