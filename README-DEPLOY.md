# PAS-One — Paket Deploy Cloudflare Pages + Worker + Apps Script

Paket ini menggabungkan sumber V3, modul inventori, dan patch reset password. Frontend disiapkan untuk diunggah sebagai folder statis ke Cloudflare Pages. Backend tetap berjalan di Google Apps Script + Google Sheets, melalui Worker `pas-one-api`.

## Yang sudah disiapkan
- Frontend ditempatkan di root folder (ada `index.html`) agar bisa drag-and-drop ke Cloudflare Pages.
- API client menggunakan satu jalur POST melalui Cloudflare Worker, bukan memanggil Apps Script langsung dari browser.
- Worker proxy disediakan di `worker/worker.js`.
- Backend GAS dipisah menjadi `app.gs`, `InventoryModule.gs`, dan `PasswordReset.gs`.
- Token login ditandatangani HMAC dan kedaluwarsa 6 jam.
- Endpoint inventory diarahkan ke modul inventory dan tetap mempertahankan kolom A:I; metadata SKU/Part Number ditambahkan pada J:P.
- Harga order dihitung ulang di backend berdasarkan master katalog, bukan mempercayai harga dari browser.
- Inisialisasi database tidak membuat akun demo ber-password lemah dan tidak menimpa data yang sudah ada.
- Reset password memakai kode email 6 digit, kedaluwarsa 15 menit, maksimal 5 percobaan.

## Penting: jangan deploy sebelum konfigurasi backend
Paket ini belum dapat dianggap production-ready penuh. Beberapa portal/fitur pada V3 masih berupa placeholder atau belum memiliki UI end-to-end (misalnya live tracking mekanik, payment gateway/QRIS dinamis, notifikasi WhatsApp, dan beberapa alur operasional). Fitur yang berstatus partial/not started tetap dijelaskan di `docs/FEATURE-MATRIX.md`.

## A. Upload frontend ke Cloudflare Pages (drag-and-drop)
1. Extract ZIP ini di komputer.
2. Pastikan folder `PAS-ONE-DEPLOY` langsung berisi `index.html`, `css`, `js`, dan `worker`.
3. Cloudflare Dashboard → Workers & Pages → Create application → Pages → Upload assets / Drag and drop.
4. Upload folder root `PAS-ONE-DEPLOY` (jangan upload ZIP, jangan pilih subfolder `backend`).
5. Catat domain Pages yang diberikan, misalnya `nama-project.pages.dev`.
6. Jika project Pages sudah ada, gunakan upload deployment baru pada project yang sama agar URL tidak berubah.

## B. Konfigurasi Worker `pas-one-api` yang sudah ada
1. Buka Worker `pas-one-api` yang domainnya saat ini `pas-one-api.qz57kgqphk.workers.dev`.
2. Edit code, ganti seluruh isi dengan `worker/worker.js`, lalu Save and Deploy.
3. Settings → Variables and Secrets: tambahkan:
   - `GAS_WEB_APP_URL` = URL Web App Apps Script berakhiran `/exec` (bukan `/dev`).
   - `ALLOWED_ORIGIN` = domain frontend Pages persis, contoh `https://nama-project.pages.dev` (tanpa slash di akhir).
4. Jangan masukkan Spreadsheet ID atau SECRET_KEY ke Worker. Keduanya hanya di Script Properties Apps Script.

## C. Konfigurasi Google Apps Script
1. Buat/buka project Apps Script backend PAS-One.
2. Buat file script `app.gs`, `InventoryModule.gs`, `PasswordReset.gs`; salin isi file yang sesuai dari folder `backend/`.
3. Di Project Settings → Script Properties, set:
   - `SPREADSHEET_ID` = ID Google Sheets database.
   - `SECRET_KEY` = string acak rahasia minimal 32 karakter. Jangan kirim ke chat dan jangan commit ke GitHub.
4. Jalankan `initializeDatabase()` dari `scripts/init-sheets.gs` hanya jika database masih kosong/baru. **Jangan jalankan seed test data di database produksi.**
5. Jalankan `pasInventorySheet()` dan `setupPasswordResetSheet()` satu kali. Keduanya memakai Script Property `SPREADSHEET_ID`; jangan memakai ID spreadsheet kedua.
6. Deploy → New deployment → Web app; Execute as: Me; Who has access: Anyone. Salin URL `/exec` ke variable Worker `GAS_WEB_APP_URL`.
7. Setelah mengubah kode GAS, buat New version pada deployment yang sama (Manage deployments → Edit → New version → Deploy).

## D. Konfigurasi final frontend
`js/config.js` sudah mengarah ke Worker yang tampak pada screenshot: `https://pas-one-api.qz57kgqphk.workers.dev`. Jika Worker URL berubah, ubah `API_BASE_URL` di file itu sebelum upload Pages.

## E. Akun admin
Jangan gunakan akun contoh `admin@pasone.local / admin123` untuk produksi. Buat akun melalui registrasi, lalu ubah kolom `role` user tersebut di sheet `Users` menjadi `admin` secara manual. Pastikan kolom `active` bernilai TRUE. Hapus akun contoh jika pernah dibuat.

## F. Urutan pengujian sebelum go-live
1. Buka `https://pas-one-api.qz57kgqphk.workers.dev` — harus menampilkan `status: online` setelah Worker dikonfigurasi.
2. Buka website Pages — katalog bisa memuat data dari sheet `Catalog`.
3. Daftar user uji, login, logout, login ulang.
4. Buat order uji, pastikan satu baris masuk ke `Orders`.
5. Uji inventory list/create/import dengan CSV uji kecil, pastikan duplikat SKU/Part Number memperbarui baris yang sama.
6. Uji forgot-password hanya setelah izin pengiriman email Apps Script tersedia.
7. Uji emergency ticket dan dashboard.
8. Uji akses role: customer tidak boleh membuka fungsi admin/inventory write.

## Batasan penting yang masih ada
- V3 sendiri menyatakan banyak fitur belum selesai. Lihat `docs/FEATURE-MATRIX.md` dan `docs/TEST-REPORT.md`; jangan menganggap laporan lama sebagai hasil tes paket gabungan ini.
- Pembayaran masih verifikasi manual, bukan payment gateway.
- UI inventori V3 masih memiliki TODO pada submit part, mutasi stok, dan import CSV; backend modul inventori sudah disertakan tetapi UI tersebut belum boleh dianggap aktif.
- Form checkout/pembayaran pelanggan belum lengkap di frontend; tombol checkout pada V3 belum menjadi alur transaksi end-to-end.
- Aplikasi belum menyediakan seluruh UI untuk setiap endpoint backend.
- Token disimpan di localStorage, jadi keamanan browser bergantung pada pencegahan XSS dan kontrol akses perangkat.
- Google Sheets cocok untuk volume kecil-menengah; bukan database untuk jutaan transaksi simultan.
- Uji integrasi harus dilakukan pada spreadsheet dan deployment milik pemilik akun sebelum digunakan pelanggan.

## Struktur
```
PAS-ONE-DEPLOY/
  index.html, css/, js/          # Upload folder ini ke Cloudflare Pages
  worker/worker.js               # Kode Worker pas-one-api
  backend/app.gs                 # Backend utama Apps Script
  backend/InventoryModule.gs     # Modul inventori
  backend/PasswordReset.gs       # Reset password via email
  docs/                          # Arsitektur, keamanan, feature matrix, test report
```


## Hasil pemeriksaan paket gabungan (30 Oktober 2026)

Pemeriksaan yang sudah dijalankan pada paket ini:
- Sintaks JavaScript frontend dan Worker: lolos `node --check`.
- Sintaks file Apps Script (diperiksa sebagai JavaScript): lolos `node --check`.
- File entry `index.html`, stylesheet, API client, backend utama, modul inventory, dan password reset tersedia.
- URL API frontend diset ke Worker yang terlihat pada screenshot pengguna.

Belum dilakukan karena memerlukan akses dan konfigurasi di akun pemilik:
- Uji koneksi nyata ke Google Sheets milik pengguna.
- Uji deploy Apps Script dan Worker di akun Cloudflare pengguna.
- Uji browser end-to-end, checkout, reset email, dan izin role pada data produksi.

Dengan demikian, paket siap untuk tahap upload/deployment teknis setelah konfigurasi backend; statusnya belum dinyatakan siap go-live untuk pelanggan.
