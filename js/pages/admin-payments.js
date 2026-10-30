// Admin Payment Verification Page (Apple-Style Clean)
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
      <div class="apple-admin-wrapper">
        <div class="apple-section-header" style="margin-bottom: 24px;">
          <div>
            <h2>Pembayaran Menunggu Verifikasi</h2>
            <p class="section-subtitle">Tinjau dan verifikasi transaksi pembayaran dari pelanggan.</p>
          </div>
        </div>

        <div id="payments-table-container">
          ${this.pendingPayments.length === 0 ?
            '<div class="empty-state"><p>Tidak ada pembayaran menunggu verifikasi.</p></div>' :
            `<div class="table-container apple-table-card">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Dibuat</th>
                    <th style="text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.pendingPayments.map(order => `
                    <tr>
                      <td><strong>${order.orderId}</strong></td>
                      <td>${JSON.parse(order.customerData || '{}').name || 'N/A'}</td>
                      <td>Rp ${Number(order.total || 0).toLocaleString('id-ID')}</td>
                      <td>${new Date(order.createdAt).toLocaleDateString('id-ID')}</td>
                      <td style="text-align: right;">
                        <button class="btn-primary btn-small" onclick="adminPayments.openVerifyModal('${order.orderId}', ${order.total})">
                          Verifikasi
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>`
          }
        </div>
      </div>

      <!-- Apple Spatial Modal Verifikasi -->
      <div id="verify-modal" class="modal-overlay" style="display:none;">
        <div class="modal apple-modal">
          <div class="modal-header">
            <h3>Verifikasi Pembayaran</h3>
            <button class="btn-close" onclick="adminPayments.closeVerifyModal()">&times;</button>
          </div>
          <form id="verify-form" onsubmit="adminPayments.submitVerification(event)">
            <input type="hidden" id="verify-order-id">
            
            <div class="apple-summary-box" style="margin-bottom: 16px;">
              <p style="margin-bottom: 4px;"><strong>Order ID:</strong> <span id="verify-order-display"></span></p>
              <p><strong>Total:</strong> <span id="verify-total-display" style="font-weight: 600;"></span></p>
            </div>

            <div class="form-group">
              <label>Method:
                <select name="method" required>
                  <option value="">-- Pilih Metode --</option>
                  <option value="transfer">Transfer Bank</option>
                  <option value="qris">QRIS</option>
                  <option value="cash">Cash</option>
                </select>
              </label>
            </div>

            <div class="form-group">
              <label>Proof URL (optional):
                <input type="url" name="proofUrl" placeholder="https://... (screenshot/bukti transfer)">
              </label>
            </div>

            <div class="form-group">
              <label>Notes:
                <textarea name="notes" placeholder="Catatan admin..."></textarea>
              </label>
            </div>

            <div class="form-actions" style="margin-top: 24px;">
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
    document.getElementById('verify-total-display').textContent = 'Rp ' + Number(total || 0).toLocaleString('id-ID');
    document.getElementById('verify-modal').style.display = 'flex';
  }

  closeVerifyModal() {
    document.getElementById('verify-modal').style.display = 'none';
    const form = document.getElementById('verify-form');
    if (form) form.reset();
  }

  async submitVerification(event) {
    event.preventDefault();
    const form = event.target;
    const orderId = document.getElementById('verify-order-id').value;
    const method = form.querySelector('select[name="method"]').value;
    const proofUrl = form.querySelector('input[name="proofUrl"]').value;
    const notes = form.querySelector('textarea[name="notes"]').value;

    try {
      const response = await window.api.verifyPayment(orderId, {
        method,
        proofUrl,
        notes,
        verifiedAt: new Date()
      });

      if (response && response.success) {
        app.showNotification('Pembayaran verified!');
        this.closeVerifyModal();
        await this.loadPendingPayments();
        this.renderTable();
      } else {
        app.showNotification('Gagal memverifikasi pembayaran', 'error');
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
  } else {
    window.adminPayments.init();
  }
}
