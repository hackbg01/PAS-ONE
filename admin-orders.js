// Admin Order Management Page
class AdminOrdersPage {
  constructor() {
    this.orders = [];
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
    const tableHtml = `
      <div class="table-container">
        <h3>Manajemen Pesanan</h3>
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
        ${this.orders.length === 0 ?
          '<p class="empty-state">Tidak ada pesanan</p>' :
          `<table class="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Order Status</th>
                <th>Payment Status</th>
                <th>Tanggal</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${this.orders.map(order => `
                <tr>
                  <td><strong>${order.orderId}</strong></td>
                  <td>${JSON.parse(order.customerData || '{}').name || 'Guest'}</td>
                  <td>Rp ${order.total.toLocaleString('id-ID')}</td>
                  <td><span class="status-badge status-${order.orderStatus}">${order.orderStatus}</span></td>
                  <td><span class="status-badge status-${order.paymentStatus}">${order.paymentStatus}</span></td>
                  <td>${new Date(order.createdAt).toLocaleDateString('id-ID')}</td>
                  <td>
                    <button class="btn-primary btn-small" onclick="adminOrders.viewDetails('${order.orderId}')">Detail</button>
                    <button class="btn-secondary btn-small" onclick="adminOrders.openStatusModal('${order.orderId}', '${order.orderStatus}')">Update</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>`
        }
      </div>

      <div id="order-detail-modal" class="modal" style="display:none;">
        <div class="modal-content">
          <h4>Order Details</h4>
          <div id="order-detail-content"></div>
          <button class="btn-secondary" onclick="adminOrders.closeDetailModal()">Close</button>
        </div>
      </div>

      <div id="status-modal" class="modal" style="display:none;">
        <div class="modal-content">
          <h4>Update Order Status</h4>
          <form onsubmit="adminOrders.submitStatusUpdate(event)">
            <input type="hidden" id="status-order-id">
            <label>New Status:
              <select name="status" required>
                <option value="">-- Pilih --</option>
                <option value="draft">Draft</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label>Notes:
              <textarea name="notes" placeholder="Update notes..."></textarea>
            </label>
            <div class="form-actions">
              <button type="submit" class="btn-success">✓ Update</button>
              <button type="button" class="btn-secondary" onclick="adminOrders.closeStatusModal()">Batal</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const container = document.getElementById('tab-orders');
    if (container) {
      container.innerHTML = tableHtml;
    }
  }

  filterByStatus(status) {
    const filtered = status ? this.orders.filter(o => o.orderStatus === status) : this.orders;
    // Render filtered view (can be improved)
    alert(`Filter: ${status} - Found ${filtered.length} orders`);
  }

  viewDetails(orderId) {
    const order = this.orders.find(o => o.orderId === orderId);
    if (!order) return;

    const items = JSON.parse(order.items || '[]');
    const customer = JSON.parse(order.customerData || '{}');

    const detailHtml = `
      <h5>${order.orderId}</h5>
      <p><strong>Customer:</strong> ${customer.name || 'Guest'} | ${customer.email}</p>
      <p><strong>Items:</strong></p>
      <ul>
        ${items.map(item => `
          <li>${item.name} x ${item.quantity} = Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</li>
        `).join('')}
      </ul>
      <p><strong>Subtotal:</strong> Rp ${order.subtotal.toLocaleString('id-ID')}</p>
      <p><strong>Tax:</strong> Rp ${order.tax.toLocaleString('id-ID')}</p>
      <p><strong>Total:</strong> Rp ${order.total.toLocaleString('id-ID')}</p>
      <p><strong>Order Status:</strong> ${order.orderStatus}</p>
      <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
    `;

    document.getElementById('order-detail-content').innerHTML = detailHtml;
    document.getElementById('order-detail-modal').style.display = 'block';
  }

  closeDetailModal() {
    document.getElementById('order-detail-modal').style.display = 'none';
  }

  openStatusModal(orderId, currentStatus) {
    document.getElementById('status-order-id').value = orderId;
    const select = document.querySelector('#status-modal select[name="status"]');
    select.value = currentStatus;
    document.getElementById('status-modal').style.display = 'block';
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
      if (response.success) {
        app.showNotification('Order status updated!');
        this.closeStatusModal();
        await this.loadOrders();
        this.renderTable();
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
  }
}
