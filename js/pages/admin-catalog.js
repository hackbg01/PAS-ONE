// Admin Catalog Management Page
class AdminCatalogPage {
  constructor() {
    this.items = [];
    this.init();
  }

  async init() {
    await this.loadCatalog();
    this.renderPage();
  }

  async loadCatalog() {
    try {
      const response = await window.api.getCatalog();
      this.items = response.items || [];
    } catch (error) {
      console.error('Failed to load catalog:', error);
      this.items = [];
    }
  }

  renderPage() {
    const pageHtml = `
      <div class="catalog-manager">
        <div class="toolbar">
          <h3>Manajemen Katalog</h3>
          <button class="btn-primary" onclick="adminCatalog.openAddModal()">+ Tambah Item</button>
        </div>

        ${this.items.length === 0 ?
          '<p class="empty-state">Katalog kosong</p>' :
          `<table class="data-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Stok</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${this.items.map(item => `
                <tr>
                  <td><strong>${item.name}</strong></td>
                  <td>${item.category}</td>
                  <td>Rp ${item.price.toLocaleString('id-ID')}</td>
                  <td>${item.stock}</td>
                  <td><span class="status-badge status-${item.active ? 'active' : 'inactive'}">${item.active ? 'Aktif' : 'Inactive'}</span></td>
                  <td>
                    <button class="btn-secondary btn-small" onclick="adminCatalog.openEditModal('${item.id}')">Edit</button>
                    <button class="btn-danger btn-small" onclick="adminCatalog.confirmDelete('${item.id}')">Hapus</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>`
        }
      </div>

      <div id="item-modal" class="modal" style="display:none;">
        <div class="modal-content">
          <h4 id="modal-title">Tambah Item</h4>
          <form onsubmit="adminCatalog.submitItemForm(event)">
            <input type="hidden" id="item-id">

            <label>Nama Item:
              <input type="text" name="name" required>
            </label>

            <label>Kategori:
              <select name="category" required>
                <option value="">-- Pilih --</option>
                <option value="jasa">Jasa</option>
                <option value="spare-part">Spare Part</option>
                <option value="oli">Oli</option>
                <option value="material">Material</option>
              </select>
            </label>

            <label>Deskripsi:
              <textarea name="description" placeholder="Penjelasan detail..."></textarea>
            </label>

            <label>Harga (Rp):
              <input type="number" name="price" min="0" required>
            </label>

            <label>Stok:
              <input type="number" name="stock" min="0" value="0">
            </label>

            <label>
              <input type="checkbox" name="active" value="1"> Aktif
            </label>

            <div class="form-actions">
              <button type="submit" class="btn-success">✓ Simpan</button>
              <button type="button" class="btn-secondary" onclick="adminCatalog.closeItemModal()">Batal</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const container = document.getElementById('tab-catalog');
    if (container) {
      container.innerHTML = pageHtml;
    }
  }

  openAddModal() {
    document.getElementById('item-id').value = '';
    document.getElementById('modal-title').textContent = 'Tambah Item Baru';
    document.querySelector('#item-modal form').reset();
    document.getElementById('item-modal').style.display = 'block';
  }

  openEditModal(itemId) {
    const item = this.items.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('item-id').value = item.id;
    document.getElementById('modal-title').textContent = 'Edit Item';
    document.querySelector('input[name="name"]').value = item.name;
    document.querySelector('select[name="category"]').value = item.category;
    document.querySelector('textarea[name="description"]').value = item.description || '';
    document.querySelector('input[name="price"]').value = item.price;
    document.querySelector('input[name="stock"]').value = item.stock;
    document.querySelector('input[name="active"]').checked = item.active;

    document.getElementById('item-modal').style.display = 'block';
  }

  closeItemModal() {
    document.getElementById('item-modal').style.display = 'none';
  }

  async submitItemForm(event) {
    event.preventDefault();
    const form = event.target;
    const itemId = document.getElementById('item-id').value;

    const data = {
      name: form.querySelector('input[name="name"]').value,
      category: form.querySelector('select[name="category"]').value,
      description: form.querySelector('textarea[name="description"]').value,
      price: parseFloat(form.querySelector('input[name="price"]').value),
      stock: parseInt(form.querySelector('input[name="stock"]').value) || 0,
      active: form.querySelector('input[name="active"]').checked
    };

    try {
      let response;
      if (itemId) {
        response = await window.api.updateCatalogItem(itemId, data);
      } else {
        response = await window.api.createCatalogItem(data);
      }

      if (response.success) {
        app.showNotification(itemId ? 'Item updated!' : 'Item created!');
        this.closeItemModal();
        await this.loadCatalog();
        this.renderPage();
      }
    } catch (error) {
      app.showNotification('Save failed: ' + error.message, 'error');
    }
  }

  confirmDelete(itemId) {
    if (confirm('Hapus item ini?')) {
      this.deleteItem(itemId);
    }
  }

  async deleteItem(itemId) {
    try {
      const response = await window.api.deleteCatalogItem(itemId);
      if (response.success) {
        app.showNotification('Item deleted!');
        await this.loadCatalog();
        this.renderPage();
      }
    } catch (error) {
      app.showNotification('Delete failed: ' + error.message, 'error');
    }
  }
}

window.adminCatalog = null;
function showCatalogTab() {
  if (!window.adminCatalog) {
    window.adminCatalog = new AdminCatalogPage();
  }
}
