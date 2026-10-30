// Order Management - Admin Portal
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
      container.innerHTML = '<p class="empty-state">Tidak ada order</p>';
      return;
    }

    const html = `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Order Status</th>
              <th>Payment Status</th>
              <th>Tanggal</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${this.orders.map(order => `
              <tr>
                <td><strong>${order.orderId}</strong></td>
                <td>${order.customerData?.name || 'Guest'}</td>
                <td>Rp ${order.total.toLocaleString('id-ID')}</td>
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
                <td>
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
      const itemsHtml = order.items.map(item => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>Rp ${item.price.toLocaleString('id-ID')}</td>
          <td>Rp ${(item.quantity * item.price).toLocaleString('id-ID')}</td>
        </tr>
      `).join('');

      const modalHtml = `
        <div class="modal-overlay" onclick="orderMgr.closeModal()">
          <div class="modal" onclick="event.stopPropagation()">
            <div class="modal-header">
              <h3>Detail Order #${orderId}</h3>
              <button class="btn-close" onclick="orderMgr.closeModal()">×</button>
            </div>

            <div class="form-group">
              <label>Customer</label>
              <p>${order.customerData?.name || 'Guest'}</p>
            </div>

            <div class="form-group">
              <label>Kontak</label>
              <p>${order.customerData?.phone || 'N/A'} | ${order.customerData?.email || 'N/A'}</p>
            </div>

            <h4 style="margin-top: 20px; margin-bottom: 10px;">Items</h4>
            <div class="table-container">
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
                <span>Rp ${order.subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div class="cost-item">
                <span>Pajak (10%):</span>
                <span>Rp ${order.tax.toLocaleString('id-ID')}</span>
              </div>
              <div class="cost-total">
                <span>Total:</span>
                <span class="total-amount">Rp ${order.total.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <h4 style="margin-top: 20px; margin-bottom: 10px;">Update Status</h4>
            <div class="form-group">
              <label>Order Status</label>
              <select id="order-status-select">
                <option value="draft" ${order.orderStatus === 'draft' ? 'selected' : ''}>Draft</option>
                <option value="pending_payment" ${order.orderStatus === 'pending_payment' ? 'selected' : ''}>Menunggu Pembayaran</option>
                <option value="payment_verified" ${order.orderStatus === 'payment_verified' ? 'selected' : ''}>Pembayaran Terverifikasi</option>
                <option value="in_progress" ${order.orderStatus === 'in_progress' ? 'selected' : ''}>Sedang Dikerjakan</option>
                <option value="completed" ${order.orderStatus === 'completed' ? 'selected' : ''}>Selesai</option>
                <option value="cancelled" ${order.orderStatus === 'cancelled' ? 'selected' : ''}>Dibatalkan</option>
              </select>
            </div>

            <div class="form-actions">
              <button class="btn-primary" onclick="orderMgr.updateOrderStatus('${orderId}')">Simpan Status</button>
              <button class="btn-secondary" onclick="orderMgr.closeModal()">Tutup</button>
            </div>
          </div>
        </div>
      `;

      const modal = document.createElement('div');
      modal.innerHTML = modalHtml;
      document.body.appendChild(modal);
    } catch (error) {
      app.showNotification('Error: ' + error.message, 'error');
    }
  }

  async updateOrderStatus(orderId) {
    const statusSelect = document.getElementById('order-status-select');
    const newStatus = statusSelect.value;

    try {
      const response = await window.api.updateOrderStatus(orderId, newStatus);
      if (response.success) {
        app.showNotification('Status order diupdate');
        this.closeModal();
        await this.loadOrders();
        this.renderOrderList();
      }
    } catch (error) {
      app.showNotification('Error: ' + error.message, 'error');
    }
  }

  closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
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
