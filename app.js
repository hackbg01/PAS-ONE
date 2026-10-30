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
      // Render mechanic assignments
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

    // Tab navigation
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

// Global tab switching function
window.showTab = function(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

  // Show selected tab
  const tabId = String(tabName).startsWith('tab-') ? String(tabName) : 'tab-' + tabName;
  const tabContent = document.getElementById(tabId);
  const tabBtn = [...document.querySelectorAll('.tab-btn')].find(btn => (btn.getAttribute('onclick') || '').includes(tabId));

  if (tabContent) tabContent.classList.add('active');
  if (tabBtn) tabBtn.classList.add('active');
};

// Initialize on load
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new PASOneApp();
});
