// Payment Verification Form - Admin Portal (Apple-Style Clean)
class PaymentVerificationManager {
  constructor() {
    this.pendingPayments = [];
    this.init();
  }

  async init() {
    await this.loadPendingPayments();
    this.renderPaymentList();
    this.attachEventListeners();
  }

  async loadPendingPayments() {
    try {
      const data = await window.api.listOrders({ paymentStatus: 'pending_payment' });
      this.pendingPayments = data.orders || [];
    } catch (error) {
      console.error('Failed to load pending payments:', error);
      app.showNotification('Gagal memuat pembayaran menunggu', 'error');
    }
  }

  renderPaymentList() {
    const container = document.getElementById('payment-list');
    if (!container) return;

    if (this.pendingPayments.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Tidak ada pembayaran menunggu verifikasi</p></div>';
      return;
    }

    const html = `
      <div class="apple-admin-wrapper">
        <div class="apple-section-header" style="margin-bottom: 20px;">
          <div>
            <h2>Verifikasi Pembayaran</h2>
            <p class="section-subtitle">Tinjau konfirmasi transaksi yang masuk dari pelanggan.</p>
          </div>
        </div>
        <div style="display: grid; gap: 16px;">
          ${this.pendingPayments.map(order => `
            <div class="payment-item apple-table-card" style="padding: 20px; background: var(--color-white); border-radius: var(--border-radius-md); border: 1px solid var(--color-gray-medium);">
              <div class="payment-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h4 style="margin: 0; font-size: 17px; font-weight: 600;">Order #${order.orderId}</h4>
                <span class="badge badge-pending">Menunggu Verifikasi</span>
              </div>
              <div class="payment-details" style="background: var(--color-gray-light); padding: 12px 16px; border-radius: var(--border-radius-sm); margin-bottom: 16px; border: 1px solid var(--color-gray-medium);">
                <p style="margin: 4px 0;"><strong>Jumlah</strong>: Rp ${Number(order.total || 0).toLocaleString('id-ID')}</p>
                <p style="margin: 4px 0;"><strong>Customer</strong>: ${order.customerData?.name || 'Guest'}</p>
                <p style="margin: 4px 0;"><strong>Kontak</strong>: ${order.customerData?.phone || 'N/A'}</p>
                <p style="margin: 4px 0;"><strong>Tanggal Order</strong>: ${new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
              </div>
              <div class="payment-actions" style="display: flex; gap: 10px;">
                <button class="btn-primary btn-small" onclick="paymentMgr.showVerifyForm('${order.orderId}', ${order.total})">
                  ✓ Verifikasi Pembayaran
                </button>
                <button class="btn-secondary btn-small" onclick="paymentMgr.rejectPayment('${order.orderId}')" style="color: var(--color-danger);">
                  ✗ Tolak
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  showVerifyForm(orderId, amount) {
    const formHtml = `
      <div class="modal-overlay" onclick="paymentMgr.closeModal()">
        <div class="modal apple-modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>Verifikasi Pembayaran</h3>
            <button class="btn-close" onclick="paymentMgr.closeModal()">&times;</button>
          </div>
          <form id="verify-form" onsubmit="paymentMgr.submitVerification(event)">
            <input type="hidden" name="orderId" value="${orderId}">

            <div class="form-group">
              <label>Order ID</label>
              <input type="text" value="${orderId}" disabled style="background: var(--color-gray-light);">
            </div>

            <div class="form-group">
              <label>Jumlah yang diterima</label>
              <input type="number" name="amount" value="${amount}" required>
            </div>

            <div class="form-group">
              <label>Metode Pembayaran</label>
              <select name="method" required>
                <option value="">-- Pilih Metode --</option>
                <option value="qris">QRIS</option>
                <option value="transfer">Transfer Bank</option>
                <option value="cash">Cash</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div class="form-group">
              <label>Bukti Pembayaran (URL atau catatan)</label>
              <textarea name="proof" placeholder="Paste screenshot/URL atau tulis catatan" rows="3"></textarea>
            </div>

            <div class="form-group">
              <label>Catatan Verifikasi</label>
              <textarea name="notes" placeholder="Catatan tambahan (opsional)" rows="2"></textarea>
            </div>

            <div class="form-actions" style="margin-top: 24px;">
              <button type="submit" class="btn-success">Verifikasi & Konfirmasi</button>
              <button type="button" class="btn-secondary" onclick="paymentMgr.closeModal()">Batal</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.closeModal();
    const modalContainer = document.createElement('div');
    modalContainer.id = 'dynamic-payment-modal';
    modalContainer.innerHTML = formHtml;
    document.body.appendChild(modalContainer);
  }

  async submitVerification(event) {
    event.preventDefault();
    const form = event.target;
    const orderId = form.querySelector('input[name="orderId"]').value;
    const amount = form.querySelector('input[name="amount"]').value;
    const method = form.querySelector('select[name="method"]').value;
    const proof = form.querySelector('textarea[name="proof"]').value;
    const notes = form.querySelector('textarea[name="notes"]').value;

    try {
      const response = await window.api.verifyPayment(orderId, {
        amount: parseFloat(amount),
        method,
        proof,
        notes,
        verifiedBy: app.currentUser?.email || 'admin',
        verifiedAt: new Date()
      });

      if (response && response.success) {
        app.showNotification('Pembayaran terverifikasi! Kode booking digenerate.');
        this.closeModal();
        await this.loadPendingPayments();
        this.renderPaymentList();
      } else {
        app.showNotification('Gagal verifikasi: ' + (response?.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      app.showNotification('Error: ' + error.message, 'error');
    }
  }

  async rejectPayment(orderId) {
    if (!confirm('Yakin tolak pembayaran ini? Customer akan diberitahu.')) return;

    try {
      const response = await window.api.updateOrderStatus(orderId, 'payment_rejected');
      if (response && response.success) {
        app.showNotification('Pembayaran ditolak. Customer diberitahu.');
        await this.loadPendingPayments();
        this.renderPaymentList();
      } else {
        app.showNotification('Gagal menolak pembayaran', 'error');
      }
    } catch (error) {
      app.showNotification('Error: ' + error.message, 'error');
    }
  }

  closeModal() {
    const modal = document.getElementById('dynamic-payment-modal');
    if (modal) modal.remove();
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.remove();
  }

  attachEventListeners() {
    // Auto-refresh every 60 seconds
    setInterval(() => {
      this.loadPendingPayments();
      this.renderPaymentList();
    }, 60000);
  }
}

// Initialize when page loads
let paymentMgr;
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('payment-list')) {
    paymentMgr = new PaymentVerificationManager();
  }
});
