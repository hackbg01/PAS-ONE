// Admin Payment Verification Page
class AdminPaymentsPage {
  constructor() {
    this.pendingPayments = [];
    this.init();
  }

  async init() {
    await this.loadPendingPayments();
    this.renderTable();
  }

  async loadPendingPayments() {
    try {
      const response = await window.api.listOrders({ status: 'pending_payment' });
      this.pendingPayments = response.orders || [];
    } catch (error) {
      console.error('Failed to load payments:', error);
      this.pendingPayments = [];
    }
  }

  renderTable() {
    const tableHtml = `
      <div class="table-container">
        <h3>Pembayaran Menunggu Verifikasi</h3>
        ${this.pendingPayments.length === 0 ?
          '<p class="empty-state">Tidak ada pembayaran menunggu</p>' :
          `<table class="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Dibuat</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${this.pendingPayments.map(order => `
                <tr>
                  <td>${order.orderId}</td>
                  <td>${JSON.parse(order.customerData || '{}').name || 'N/A'}</td>
                  <td>Rp ${order.total.toLocaleString('id-ID')}</td>
                  <td>${new Date(order.createdAt).toLocaleDateString('id-ID')}</td>
                  <td>
                    <button class="btn-primary btn-small" onclick="adminPayments.openVerifyModal('${order.orderId}', ${order.total})">
                      Verifikasi
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>`
        }
      </div>
      <div id="verify-modal" class="modal" style="display:none;">
        <div class="modal-content">
          <h4>Verifikasi Pembayaran</h4>
          <form id="verify-form" onsubmit="adminPayments.submitVerification(event)">
            <input type="hidden" id="verify-order-id">
            <label>Order ID: <span id="verify-order-display"></span></label>
            <label>Total: <span id="verify-total-display"></span></label>

            <label>Method:
              <select name="method" required>
                <option value="">-- Pilih --</option>
                <option value="transfer">Transfer Bank</option>
                <option value="qris">QRIS</option>
                <option value="cash">Cash</option>
              </select>
            </label>

            <label>Proof URL (optional):
              <input type="url" name="proofUrl" placeholder="Screenshot/bukti transfer">
            </label>

            <label>Notes:
              <textarea name="notes" placeholder="Catatan admin..."></textarea>
            </label>

            <div class="form-actions">
              <button type="submit" class="btn-success">✓ Verifikasi</button>
              <button type="button" class="btn-secondary" onclick="adminPayments.closeVerifyModal()">Batal</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const container = document.getElementById('tab-payments');
    if (container) {
      container.innerHTML = tableHtml;
    }
  }

  openVerifyModal(orderId, total) {
    document.getElementById('verify-order-id').value = orderId;
    document.getElementById('verify-order-display').textContent = orderId;
    document.getElementById('verify-total-display').textContent = 'Rp ' + total.toLocaleString('id-ID');
    document.getElementById('verify-modal').style.display = 'block';
  }

  closeVerifyModal() {
    document.getElementById('verify-modal').style.display = 'none';
    document.getElementById('verify-form').reset();
  }

  async submitVerification(event) {
    event.preventDefault();
    const form = event.target;
    const orderId = document.getElementById('verify-order-id').value;
    const method = form.querySelector('select[name="method"]').value;
    const proofUrl = form.querySelector('input[name="proofUrl"]').value;

    try {
      const response = await window.api.verifyPayment(orderId, {
        method,
        proofUrl,
        verifiedAt: new Date()
      });

      if (response.success) {
        app.showNotification('Pembayaran verified!');
        this.closeVerifyModal();
        await this.loadPendingPayments();
        this.renderTable();
      }
    } catch (error) {
      app.showNotification('Verification failed: ' + error.message, 'error');
    }
  }
}

// Initialize when tab is shown
window.adminPayments = null;
function showPaymentsTab() {
  if (!window.adminPayments) {
    window.adminPayments = new AdminPaymentsPage();
  }
}
