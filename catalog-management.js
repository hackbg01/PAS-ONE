// Catalog Management - Admin Portal
class CatalogManager {
  constructor() {
    this.items = [];
    this.editingId = null;
    this.init();
  }

  async init() {
    await this.loadCatalog();
    this.renderCatalogTable();
    this.attachEventListeners();
  }

  async loadCatalog() {
    try {
      const data = await window.api.getCatalog();
      this.items = data.items || [];
    } catch (error) {
      console.error('Failed to load catalog:', error);
      app.showNotification('Gagal memuat katalog', 'error');
    }
  }

  renderCatalogTable() {
    const container = document.getElementById('catalog-table');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = '<p class="empty-state">Tidak ada item katalog</p>';
      return;
    }

    const html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Kategori</th>
            <th>Harga</th>
            <th>Stok</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${this.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.category}</td>
              <td>Rp ${item.price.toLocaleString('id-ID')}</td>
              <td>${item.stock}</td>
              <td>
                <span class="badge ${item.active ? 'badge-active' : 'badge-inactive'}">
                  ${item.active ? 'Aktif' : 'Nonaktif'}
                </span>
              </td>
              <td>
                <button class="btn-primary btn-small" onclick="catalogMgr.showEditForm('${item.id}')">Edit</button>
                <button class="btn-secondary btn-small" onclick="catalogMgr.deleteItem('${item.id}')">Hapus</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    container.innerHTML = html;
  }

  showAddForm() {
    this.editingId = null;
    this.showCatalogForm();
  }

  showEditForm(id) {
    this.editingId = id;
    this.showCatalogForm();
  }

  showCatalogForm() {
    const item = this.editingId ? this.items.find(i => i.id === this.editingId) : null;
    const title = item ? 'Edit Item' : 'Tambah Item Baru';

    const formHtml = `
      <div class="modal-overlay" onclick="catalogMgr.closeModal()">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>${title}</h3>
            <button class="btn-close" onclick="catalogMgr.closeModal()">×</button>
          </div>
          <form id="catalog-form" onsubmit="catalogMgr.submitForm(event)">
            <div class="form-group">
              <label>Nama Item *</label>
              <input type="text" name="name" value="${item?.name || ''}" required>
            </div>

            <div class="form-group">
              <label>Kategori *</label>
              <select name="category" required>
                <option value="">-- Pilih Kategori --</option>
                <option value="jasa" ${item?.category === 'jasa' ? 'selected' : ''}>Jasa</option>
                <option value="spare-part" ${item?.category === 'spare-part' ? 'selected' : ''}>Spare Part</option>
                <option value="oli" ${item?.category === 'oli' ? 'selected' : ''}>Oli</option>
                <option value="material" ${item?.category === 'material' ? 'selected' : ''}>Material</option>
                <option value="lainnya" ${item?.category === 'lainnya' ? 'selected' : ''}>Lainnya</option>
              </select>
            </div>

            <div class="form-group">
              <label>Deskripsi *</label>
              <textarea name="description" required rows="3">${item?.description || ''}</textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Harga (Rp) *</label>
                <input type="number" name="price" value="${item?.price || ''}" required min="0">
              </div>
              <div class="form-group">
                <label>Stok *</label>
                <input type="number" name="stock" value="${item?.stock || '0'}" required min="0">
              </div>
            </div>

            <div class="form-group">
              <label>
                <input type="checkbox" name="active" ${item?.active ? 'checked' : ''}>
                Item Aktif
              </label>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary">${item ? 'Simpan Perubahan' : 'Tambah Item'}</button>
              <button type="button" class="btn-secondary" onclick="catalogMgr.closeModal()">Batal</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const modal = document.createElement('div');
    modal.innerHTML = formHtml;
    document.body.appendChild(modal);
  }

  async submitForm(event) {
    event.preventDefault();
    const form = event.target;
    const data = {
      name: form.querySelector('input[name="name"]').value,
      category: form.querySelector('select[name="category"]').value,
      description: form.querySelector('textarea[name="description"]').value,
      price: parseFloat(form.querySelector('input[name="price"]').value),
      stock: parseInt(form.querySelector('input[name="stock"]').value),
      active: form.querySelector('input[name="active"]').checked
    };

    try {
      const response = this.editingId
        ? await window.api.updateCatalogItem(this.editingId, data)
        : await window.api.createCatalogItem(data);

      if (response.success) {
        app.showNotification(this.editingId ? 'Item diupdate' : 'Item ditambah');
        this.closeModal();
        await this.loadCatalog();
        this.renderCatalogTable();
      } else {
        app.showNotification('Gagal: ' + response.error, 'error');
      }
    } catch (error) {
      app.showNotification('Error: ' + error.message, 'error');
    }
  }

  async deleteItem(id) {
    if (!confirm('Yakin hapus item ini?')) return;

    try {
      const response = await window.api.deleteCatalogItem(id);
      if (response.success) {
        app.showNotification('Item dihapus');
        await this.loadCatalog();
        this.renderCatalogTable();
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
    const btn = document.getElementById('btn-add-catalog');
    if (btn) btn.addEventListener('click', () => this.showAddForm());
  }
}

let catalogMgr;
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('catalog-table')) {
    catalogMgr = new CatalogManager();
  }
});
