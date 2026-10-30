// Payment Verification Form - Admin Portal
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
      container.innerHTML = '<p class="empty-state">Tidak ada pembayaran menunggu verifikasi</p>';
      return;
    }

    const html = this.pendingPayments.map(order => `
      <div class="payment-item">
        <div class="payment-header">
          <h4>Order #${order.orderId}</h4>
          <span class="badge badge-pending">Menunggu Verifikasi</span>
        </div>
        <div class="payment-details">
          <p><strong>Jumlah</strong>: Rp ${order.total.toLocaleString('id-ID')}</p>
          <p><strong>Customer</strong>: ${order.customerData?.name || 'Guest'}</p>
          <p><strong>Kontak</strong>: ${order.customerData?.phone || 'N/A'}</p>
          <p><strong>Tanggal Order</strong>: ${new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
        </div>
        <div class="payment-actions">
          <button class="btn-primary btn-small" onclick="paymentMgr.showVerifyForm('${order.orderId}', ${order.total})">
            ✓ Verifikasi Pembayaran
          </button>
          <button class="btn-secondary btn-small" onclick="paymentMgr.rejectPayment('${order.orderId}')">
            ✗ Tolak
          </button>
        </div>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  showVerifyForm(orderId, amount) {
    const formHtml = `
      <div class="modal-overlay" onclick="paymentMgr.closeModal()">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>Verifikasi Pembayaran</h3>
            <button class="btn-close" onclick="paymentMgr.closeModal()">×</button>
          </div>
          <form id="verify-form" onsubmit="paymentMgr.submitVerification(event)">
            <input type="hidden" name="orderId" value="${orderId}">

            <div class="form-group">
              <label>Order ID</label>
              <input type="text" value="${orderId}" disabled>
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

            <div class="form-actions">
              <button type="submit" class="btn-primary">Verifikasi & Konfirmasi</button>
              <button type="button" class="btn-secondary" onclick="paymentMgr.closeModal()">Batal</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const modal = document.createElement('div');
    modal.innerHTML = formHtml;
    document.body.appendChild(modal);
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
        verifiedBy: app.currentUser.email,
        verifiedAt: new Date()
      });

      if (response.success) {
        app.showNotification('Pembayaran terverifikasi! Kode booking digenerate.');
        this.closeModal();
        await this.loadPendingPayments();
        this.renderPaymentList();
      } else {
        app.showNotification('Gagal verifikasi: ' + response.error, 'error');
      }
    } catch (error) {
      app.showNotification('Error: ' + error.message, 'error');
    }
  }

  async rejectPayment(orderId) {
    if (!confirm('Yakin tolak pembayaran ini? Customer akan diberitahu.')) return;

    try {
      const response = await window.api.updateOrderStatus(orderId, 'payment_rejected');
      if (response.success) {
        app.showNotification('Pembayaran ditolak. Customer diberitahu.');
        await this.loadPendingPayments();
        this.renderPaymentList();
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
