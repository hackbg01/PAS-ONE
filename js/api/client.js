// API Client for PAS-One
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || window.APP_CONFIG?.API_BASE_URL || '';
    if (!this.baseUrl) console.warn('API_BASE_URL belum diatur.');
    this.token = localStorage.getItem('auth_token');
    this.headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      this.headers['Authorization'] = `Bearer ${this.token}`;
    }
  }

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.headers['Authorization'];
    }
  }

  async request(endpoint, options = {}) {
    const raw = String(endpoint || '');
    const [route, queryString] = raw.split('?');
    const query = Object.fromEntries(new URLSearchParams(queryString || ''));
    const payload = Object.assign({}, query, options.body || {});
    if (this.token) payload.token = this.token;
    const url = this.baseUrl.replace(/\/$/, '');
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: route, payload })
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.error || `API Error: ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Auth
  async register(email, password, name) {
    return this.request('auth/register', {
      method: 'POST',
      body: { email, password, name }
    });
  }

  async login(email, password) {
    return this.request('auth/login', {
      method: 'POST',
      body: { email, password }
    });
  }

  async logout() {
    const result = await this.request('auth/logout', { method: 'POST' });
    this.setToken(null);
    return result;
  }

  async forgotPassword(email) {
    return this.request('auth/forgot-password', { method: 'POST', body: { email } });
  }

  async resetPassword(email, code, newPassword) {
    return this.request('auth/reset-password', { method: 'POST', body: { email, code, newPassword } });
  }

  async getCurrentUser() {
    return this.request('auth/me');
  }

  // Catalog
  async getCatalog(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`catalog/list?${params}`);
  }

  async getCatalogItem(id) {
    return this.request(`catalog/get?id=${id}`);
  }

  async createCatalogItem(data) {
    return this.request('catalog/create', { method: 'POST', body: data });
  }

  async updateCatalogItem(id, data) {
    return this.request(`catalog/update?id=${id}`, { method: 'PUT', body: data });
  }

  async deleteCatalogItem(id) {
    return this.request(`catalog/delete?id=${id}`, { method: 'DELETE' });
  }

  // Orders
  async createOrder(items, customerData) {
    return this.request('orders/create', {
      method: 'POST',
      body: { items, customerData }
    });
  }

  async getOrder(id) {
    return this.request(`orders/get?id=${id}`);
  }

  async listOrders(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`orders/list?${params}`);
  }

  async updateOrderStatus(id, status) {
    return this.request(`orders/update-status?id=${id}`, {
      method: 'PATCH',
      body: { status }
    });
  }

  // Payments
  async verifyPayment(orderId, proof) {
    return this.request('payments/verify', {
      method: 'POST',
      body: { orderId, proof: (proof && typeof proof === 'object') ? proof : { proof: String(proof || '') } }
    });
  }

  async getPaymentStatus(orderId) {
    return this.request(`payments/status?orderId=${orderId}`);
  }

  // Emergency
  async createEmergency(data) {
    return this.request('emergency/create', {
      method: 'POST',
      body: data
    });
  }

  async getEmergency(id) {
    return this.request(`emergency/get?id=${id}`);
  }

  async updateEmergencyStatus(id, status) {
    return this.request(`emergency/update?id=${id}`, {
      method: 'PATCH',
      body: { status }
    });
  }

  // Location
  async shareLocation(emergencyId, lat, lng) {
    return this.request('location/share', {
      method: 'POST',
      body: { emergencyId, lat, lng, timestamp: Date.now() }
    });
  }

  async getMechanicLocation(emergencyId) {
    return this.request(`location/mechanic?emergencyId=${emergencyId}`);
  }

  // Inventory
  async getInventory(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`inventory/list?${params}`);
  }

  async importInventoryCSV(csvData) {
    return this.request('inventory/import', {
      method: 'POST',
      body: { csvData }
    });
  }

  // Discount
  async requestDiscount(data) {
    return this.request('discount/request', {
      method: 'POST',
      body: data
    });
  }

  async approveDiscount(id, approved, reason) {
    return this.request(`discount/approve?id=${id}`, {
      method: 'PATCH',
      body: { approved, reason }
    });
  }

  // Dashboard
  async getDashboard(portal) {
    return this.request(`dashboard/${portal}`);
  }

  // Audit Log
  async getAuditLog(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`audit/list?${params}`);
  }
}

window.api = new ApiClient();
