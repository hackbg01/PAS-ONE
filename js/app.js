<style>
/* ==========================================================================
   PAS-ONE APP STYLING - TRUE APPLE AESTHETIC (CLEAN MONOCHROME & 3D SOFT DEPTH)
   ================================================================---------- */
:root {
  --color-navy: #1d1d1f;           /* Dark Charcoal Apple Standard */
  --color-navy-light: #424245;     /* Neutral Secondary Dark */
  --color-gold: #b5952f;           /* Elegant Muted Gold (Classic Accent) */
  --color-white: #ffffff;
  --color-gray-light: #f5f5f7;     /* macOS Light Surface */
  --color-gray-medium: #d2d2d7;    /* macOS Crisp Border */
  --color-gray-dark: #86868b;      /* Secondary Label */
  --color-text: #1d1d1f;           /* Primary Text */
  
  --color-success: #34c759;        /* Apple Green */
  --color-warning: #ff9f0a;        /* Apple Orange */
  --color-danger: #ff3b30;         /* Apple Red */
  --color-info: #0071e3;           /* Apple Blue */

  --font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-size-base: 15px;
  --font-size-sm: 13px;
  --font-size-lg: 17px;
  --font-size-xl: 24px;
  --font-size-2xl: 32px;

  --spacing-unit: 8px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  --border-radius-sm: 6px;
  --border-radius-md: 12px;
  --border-radius-lg: 18px;

  /* Natural Apple Soft Depth & Elevation */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.12);

  --transition-fast: 200ms cubic-bezier(0.25, 1, 0.5, 1);
  --transition-normal: 350ms cubic-bezier(0.25, 1, 0.5, 1);
}

*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--color-text);
  background-color: var(--color-white);
  line-height: 1.47059;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--color-text);
  letter-spacing: -0.022em;
}

h1 { font-size: var(--font-size-2xl); }
h2 { font-size: var(--font-size-xl); }
h3 { font-size: var(--font-size-lg); }

/* Navigation */
.navbar {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: var(--color-text);
  padding: 12px 0;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--color-gray-medium);
}

.navbar .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-brand h1 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--color-text);
  font-weight: 600;
}

.navbar-menu {
  display: flex;
  list-style: none;
  gap: var(--spacing-lg);
  align-items: center;
}

.navbar-menu a {
  color: var(--color-gray-dark);
  text-decoration: none;
  transition: color var(--transition-fast);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.navbar-menu a:hover {
  color: var(--color-text);
}

/* Catalog Grid */
.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.catalog-item {
  background: var(--color-gray-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
  border: 1px solid var(--color-gray-medium);
}

.catalog-item:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  background: var(--color-white);
}

.catalog-item h4 {
  margin-bottom: var(--spacing-sm);
  color: var(--color-text);
}

.catalog-item .price {
  font-size: var(--font-size-lg);
  color: var(--color-text);
  font-weight: 600;
  margin: var(--spacing-md) 0;
}

/* Cart */
.cart-item {
  display: grid;
  grid-template-columns: 1fr 150px 100px 100px;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-gray-medium);
  align-items: center;
  background: var(--color-white);
}

.cart-summary {
  background: var(--color-gray-light);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  margin: var(--spacing-lg) 0;
  text-align: right;
  border: 1px solid var(--color-gray-medium);
}

/* Dashboard */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin: var(--spacing-lg) 0;
}

.dashboard-card {
  background: var(--color-gray-light);
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  text-align: center;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
}

.dashboard-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  background: var(--color-white);
}

.dashboard-card h3 {
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-md);
  color: var(--color-gray-dark);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dashboard-card .stat {
  font-size: var(--font-size-2xl);
  color: var(--color-text);
  font-weight: 600;
  margin: 0;
}

/* Tabs */
.admin-tabs {
  display: flex;
  gap: var(--spacing-sm);
  border-bottom: 1px solid var(--color-gray-medium);
  margin: var(--spacing-lg) 0;
  flex-wrap: wrap;
}

.tab-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-fast);
  color: var(--color-gray-dark);
  font-size: var(--font-size-sm);
}

.tab-btn:hover {
  color: var(--color-text);
}

.tab-btn.active {
  border-bottom-color: var(--color-text);
  color: var(--color-text);
}

.tab-content {
  display: none;
  padding: var(--spacing-lg) 0;
}

.tab-content.active {
  display: block;
}

/* Forms */
.login-form {
  max-width: 400px;
  margin: var(--spacing-xl) auto;
  background: var(--color-gray-light);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-gray-medium);
  box-shadow: var(--shadow-md);
}

.login-form form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.login-form p {
  text-align: center;
  margin-top: var(--spacing-md);
  font-size: var(--font-size-sm);
}

.login-form a {
  color: var(--color-info);
  text-decoration: none;
}

.login-form a:hover {
  text-decoration: underline;
}

/* Notifications */
.notification {
  position: fixed;
  bottom: var(--spacing-lg);
  right: var(--spacing-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--border-radius-md);
  color: var(--color-white);
  z-index: 1000;
  box-shadow: var(--shadow-lg);
  font-size: var(--font-size-sm);
  font-weight: 500;
  animation: slideIn 300ms cubic-bezier(0.25, 1, 0.5, 1);
}

.notification-success { background: var(--color-success); }
.notification-error { background: var(--color-danger); }
.notification-info { background: var(--color-info); }
.notification-warning { background: var(--color-warning); }

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Buttons */
button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  padding: 10px 18px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

button:active {
  transform: translateY(0);
}

.btn-primary {
  background: var(--color-text);
  color: var(--color-white);
}

.btn-primary:hover {
  background: #333333;
}

.btn-secondary {
  background: var(--color-gray-medium);
  color: var(--color-text);
}

.btn-secondary:hover {
  background: var(--color-gray-dark);
  color: var(--color-white);
}

.btn-danger {
  background: var(--color-danger);
  color: var(--color-white);
}

.btn-danger:hover { background: #e0342b; }

.btn-success {
  background: var(--color-success);
  color: var(--color-white);
}

.btn-success:hover { background: #2eb04f; }

.btn-small { padding: 6px 12px; font-size: var(--font-size-sm); }
.btn-large { padding: 12px 24px; font-size: var(--font-size-base); }

/* Modal & Dialog */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-gray-medium);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-gray-medium);
  padding-bottom: var(--spacing-md);
}

.modal-header h3 { margin: 0; }

.btn-close {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--color-gray-dark);
  padding: 4px;
  box-shadow: none;
}

.btn-close:hover {
  color: var(--color-text);
  transform: none;
  box-shadow: none;
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
  font-size: var(--font-size-sm);
  color: var(--color-gray-dark);
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-base);
  font-family: inherit;
  background: var(--color-white);
  transition: all var(--transition-fast);
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-info);
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.15);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.badge-active { background: #e8f8ec; color: var(--color-success); }
.badge-inactive { background: #fdeeea; color: var(--color-danger); }
.badge-pending { background: #fff8ec; color: var(--color-warning); }

.payment-item {
  background: var(--color-white);
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.payment-details {
  background: var(--color-gray-light);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-sm);
  margin-bottom: var(--spacing-md);
  border: 1px solid var(--color-gray-medium);
}

.payment-details p { margin: var(--spacing-xs) 0; }
.payment-actions { display: flex; gap: var(--spacing-sm); }
.payment-actions button { flex: 1; }

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-gray-dark);
}

.modal-content {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-gray-medium);
}

.modal-content h4 { margin-top: 0; color: var(--color-text); }
.modal-content form { display: flex; flex-direction: column; gap: var(--spacing-md); }
.modal-content label { display: flex; flex-direction: column; gap: var(--spacing-xs); font-weight: 500; color: var(--color-gray-dark); }
.modal-content input[type="checkbox"] { width: auto; margin-right: var(--spacing-sm); }

.form-actions { display: flex; gap: var(--spacing-md); margin-top: var(--spacing-lg); }
.form-actions button { flex: 1; }

/* Tables */
.table-container {
  overflow-x: auto;
  margin: var(--spacing-lg) 0;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-gray-medium);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-white);
}

.data-table thead {
  background: var(--color-gray-light);
  border-bottom: 1px solid var(--color-gray-medium);
}

.data-table th,
.data-table td {
  padding: var(--spacing-md);
  text-align: left;
  font-size: var(--font-size-sm);
  border-bottom: 1px solid var(--color-gray-medium);
}

.data-table tbody tr:hover { background: var(--color-gray-light); }
.data-table tbody tr:last-child td { border-bottom: none; }

/* Status Badges */
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.status-active, .status-verified, .status-completed, .status-in_progress {
  background: #e8f8ec; color: var(--color-success);
}
.status-inactive, .status-pending, .status-pending_payment, .status-draft {
  background: #fff8ec; color: var(--color-warning);
}
.status-rejected, .status-cancelled, .status-failed {
  background: #fdeeea; color: var(--color-danger);
}

/* Filter Bar */
.filter-bar {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}

.filter-bar select, .filter-bar input { max-width: 250px; }

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

/* Cost Summary */
.cost-summary {
  background: var(--color-gray-light);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  margin: var(--spacing-lg) 0;
  border: 1px solid var(--color-gray-medium);
  box-shadow: var(--shadow-sm);
}

.cost-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-gray-medium);
}

.cost-total {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-md) 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
  margin-top: var(--spacing-md);
  border-top: 1px solid var(--color-gray-medium);
}

.total-amount { color: var(--color-text); font-weight: 700; }

.cost-summary .status {
  margin: var(--spacing-md) 0;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-white);
  border-radius: var(--border-radius-sm);
  font-weight: 600;
  border: 1px solid var(--color-gray-medium);
}

.cost-summary .note {
  font-size: var(--font-size-sm);
  color: var(--color-gray-dark);
  margin-top: var(--spacing-md);
  font-style: italic;
}

.cost-summary .info {
  background: var(--color-gray-light);
  color: var(--color-text);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  line-height: 1.8;
  border: 1px solid var(--color-gray-medium);
}

/* Inputs, Textareas, Selects Umum */
input, textarea, select {
  font-family: inherit;
  font-size: inherit;
  padding: 10px 14px;
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--border-radius-sm);
  width: 100%;
  max-width: 100%;
  background: var(--color-white);
  transition: all var(--transition-fast);
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--color-info);
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.15);
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

/* Responsive */
@media (max-width: 768px) {
  .navbar-menu { flex-direction: column; gap: var(--spacing-sm); }
  .catalog-grid { grid-template-columns: 1fr; }
  .cart-item { grid-template-columns: 1fr; }
  .dashboard-grid { grid-template-columns: 1fr; }
  .admin-tabs { flex-direction: column; }
  .data-table { font-size: var(--font-size-sm); }
  .data-table th, .data-table td { padding: var(--spacing-sm); }
  .modal-content, .modal { width: 95%; max-height: 90vh; }
  .toolbar { flex-direction: column; align-items: flex-start; }
  .toolbar button { width: 100%; }
}
</style>

<script>
// PAS-One Main App Router
class PASOneApp {
  constructor() {
    this.currentUser = null;
    this.cart = JSON.parse(localStorage.getItem('cart') || '[]');
    this.currentPortal = 'consumer';
    this.init();
  }

  async init() {
    this.loadAuth();
    this.setupRouter();
    this.attachEventListeners();
    await this.loadCatalog();
  }

  loadAuth() {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    if (token && user) {
      this.currentUser = JSON.parse(user);
      window.api.setToken(token);
    }
    this.updateAuthUI();
  }

  setupRouter() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const [path, ...params] = hash.split('?');

    this.hideAllPages();

    if (path === '/catalog' || path === '/' || path === '') {
      this.showPage('page-catalog');
    } else if (path === '/cart') {
      this.showPage('page-cart');
      this.renderCart();
    } else if (path === '/emergency' || path.startsWith('/emergency/')) {
      this.showPage('page-emergency');
      const ticket = path.split('/')[2];
      if (ticket) document.getElementById('emergency-status').textContent = 'Nomor tiket: ' + ticket;
    } else if (path === '/login') {
      this.showPage('page-login');
    } else if (path === '/register') {
      this.showPage('page-register');
    } else if (path === '/admin' && this.isAdmin()) {
      this.showPage('page-admin');
      this.loadAdminDashboard();
    } else if (path === '/mechanic' && this.isMechanic()) {
      this.showPage('page-mechanic');
      this.loadMechanicDashboard();
    } else if (path === '/management' && this.isManager()) {
      this.showPage('page-management');
      this.loadManagementDashboard();
    } else {
      this.showPage('page-catalog');
    }
  }

  async loadCatalog() {
    try {
      const data = await window.api.getCatalog();
      const items = data.items || [];
      const html = items.map(item => `
        <div class="catalog-item">
          <h4>${item.name}</h4>
          <p>${item.description}</p>
          <p class="price">Rp ${item.price.toLocaleString('id-ID')}</p>
          <button class="btn-primary btn-small" onclick="app.addToCart('${item.id}', '${item.name}', ${item.price})">
            Tambah ke Keranjang
          </button>
        </div>
      `).join('');
      document.getElementById('catalog-list').innerHTML = html;
    } catch (error) {
      console.error('Failed to load catalog:', error);
      document.getElementById('catalog-list').innerHTML = '<p>Gagal memuat katalog</p>';
    }
  }

  addToCart(id, name, price) {
    const existing = this.cart.find(item => item.id === id);
    if (existing) {
      existing.quantity++;
    } else {
      this.cart.push({ id, name, price, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(this.cart));
    this.showNotification('Produk ditambahkan ke keranjang');
  }

  renderCart() {
    if (this.cart.length === 0) {
      document.getElementById('cart-items').innerHTML = '<p>Keranjang kosong</p>';
      document.getElementById('cart-summary').innerHTML = '';
      return;
    }

    const itemsHtml = this.cart.map((item, idx) => `
      <div class="cart-item">
        <span>${item.name}</span>
        <span>Rp ${item.price.toLocaleString('id-ID')}</span>
        <input type="number" min="1" value="${item.quantity}"
               onchange="app.updateCartQty(${idx}, this.value)">
        <button class="btn-secondary btn-small" onclick="app.removeFromCart(${idx})">Hapus</button>
      </div>
    `).join('');

    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const summaryHtml = `
      <div class="cart-summary">
        <p>Subtotal: Rp ${subtotal.toLocaleString('id-ID')}</p>
        <p>Pajak (10%): Rp ${(subtotal * 0.1).toLocaleString('id-ID')}</p>
        <h3>Total: Rp ${(subtotal * 1.1).toLocaleString('id-ID')}</h3>
      </div>
    `;

    document.getElementById('cart-items').innerHTML = itemsHtml;
    document.getElementById('cart-summary').innerHTML = summaryHtml;
  }

  updateCartQty(idx, qty) {
    this.cart[idx].quantity = parseInt(qty) || 1;
    localStorage.setItem('cart', JSON.stringify(this.cart));
    this.renderCart();
  }

  removeFromCart(idx) {
    this.cart.splice(idx, 1);
    localStorage.setItem('cart', JSON.stringify(this.cart));
    this.renderCart();
  }

  async handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;

    try {
      const response = await window.api.login(email, password);
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('auth_user', JSON.stringify(response.user));
        this.currentUser = response.user;
        window.api.setToken(response.token);
        this.updateAuthUI();
        this.showNotification('Login berhasil!');
        window.location.hash = '/';
      } else {
        this.showNotification('Email atau password salah', 'error');
      }
    } catch (error) {
      this.showNotification('Login gagal: ' + error.message, 'error');
    }
  }

  async handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.querySelector('input[type="text"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelectorAll('input[type="password"]')[0].value;
    const passwordConfirm = form.querySelectorAll('input[type="password"]')[1].value;

    if (password !== passwordConfirm) {
      this.showNotification('Password tidak cocok', 'error');
      return;
    }

    try {
      const response = await window.api.register(email, password, name);
      if (response.success) {
        this.showNotification('Registrasi berhasil! Silakan login.');
        window.location.hash = '/login';
      } else {
        this.showNotification(response.message || 'Registrasi gagal', 'error');
      }
    } catch (error) {
      this.showNotification('Registrasi gagal: ' + error.message, 'error');
    }
  }

  async handleLogout() {
    try {
      await window.api.logout();
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      this.currentUser = null;
      this.updateAuthUI();
      window.location.hash = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  updateAuthUI() {
    const authMenu = document.getElementById('auth-menu');
    if (this.currentUser) {
      authMenu.innerHTML = `
        <span>${this.currentUser.name}</span>
        <button class="btn-secondary btn-small" onclick="app.handleLogout()">Logout</button>
      `;
      if (this.isAdmin()) {
        authMenu.innerHTML += '<a href="#/admin">Admin</a>';
      }
      if (this.isMechanic()) {
        authMenu.innerHTML += '<a href="#/mechanic">Mekanik</a>';
      }
      if (this.isManager()) {
        authMenu.innerHTML += '<a href="#/management">Manager</a>';
      }
    } else {
      authMenu.innerHTML = `
        <a href="#/login">Login</a>
        <a href="#/register">Daftar</a>
      `;
    }
  }

  async loadAdminDashboard() {
    try {
      const data = await window.api.getDashboard('admin');
      document.getElementById('stat-booking-today').textContent = data.bookingToday || 0;
      document.getElementById('stat-payment-pending').textContent = data.paymentPending || 0;
      document.getElementById('stat-work-active').textContent = data.workActive || 0;
      document.getElementById('stat-emergency').textContent = data.emergency || 0;
    } catch (error) {
      console.error('Failed to load admin dashboard:', error);
    }
  }

  async loadMechanicDashboard() {
    try {
      const data = await window.api.getDashboard('mechanic');
    } catch (error) {
      console.error('Failed to load mechanic dashboard:', error);
    }
  }

  async loadManagementDashboard() {
    try {
      const data = await window.api.getDashboard('management');
      document.getElementById('stat-revenue').textContent =
        'Rp ' + (data.revenue || 0).toLocaleString('id-ID');
      document.getElementById('stat-discount-pending').textContent = data.discountPending || 0;
    } catch (error) {
      console.error('Failed to load management dashboard:', error);
    }
  }

  isAdmin() {
    return this.currentUser?.role === window.APP_CONFIG.ROLES.ADMIN;
  }

  isMechanic() {
    return this.currentUser?.role === window.APP_CONFIG.ROLES.MECHANIC;
  }

  isManager() {
    return this.currentUser?.role === window.APP_CONFIG.ROLES.MANAGER;
  }

  showPage(pageId) {
    document.getElementById(pageId).style.display = 'block';
  }

  hideAllPages() {
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  attachEventListeners() {
    document.getElementById('form-login')?.addEventListener('submit', e => this.handleLogin(e));
    document.getElementById('form-register')?.addEventListener('submit', e => this.handleRegister(e));
    document.getElementById('btn-checkout')?.addEventListener('click', () => {
      if (this.currentUser || confirm('Lanjut sebagai tamu?')) {
        window.location.hash = '/payment';
      } else {
        window.location.hash = '/login';
      }
    });
    document.getElementById('btn-panic')?.addEventListener('click', () => this.triggerEmergency());

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const attr = e.currentTarget.getAttribute('onclick') || '';
        const match = attr.match(/'([^']+)'/);
        if (match) window.showTab(match[1]);
      });
    });
  }

  async triggerEmergency() {
    if (!navigator.geolocation) {
      this.showNotification('Geolocation tidak didukung', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const response = await window.api.createEmergency({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          complaint: 'Emergency request via panic button',
          customerName: this.currentUser?.name || 'Guest',
          customerPhone: this.currentUser?.phone || 'N/A'
        });
        if (response.ticketId) {
          window.location.hash = `/emergency/${response.ticketId}`;
          this.showNotification('Emergency ticket dibuat: ' + response.ticketId);
        }
      } catch (error) {
        this.showNotification('Gagal membuat emergency ticket: ' + error.message, 'error');
      }
    });
  }
}

window.showTab = function(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

  const tabId = String(tabName).startsWith('tab-') ? String(tabName) : 'tab-' + tabName;
  const tabContent = document.getElementById(tabId);
  const tabBtn = [...document.querySelectorAll('.tab-btn')].find(btn => (btn.getAttribute('onclick') || '').includes(tabId));

  if (tabContent) tabContent.classList.add('active');
  if (tabBtn) tabBtn.classList.add('active');
};

let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new PASOneApp();
});
</script>
