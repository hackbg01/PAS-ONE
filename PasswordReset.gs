/**
 * PAS-One password reset module
 * Requires Script Property SPREADSHEET_ID and SECRET_KEY.
 * Add routes in handleAuth() as described in PASSWORD_RESET_SETUP.md.
 */

const PAS_PASSWORD_RESET_SHEET = 'PasswordResets';
const PAS_RESET_CODE_TTL_MS = 15 * 60 * 1000;
const PAS_RESET_MAX_ATTEMPTS = 5;
const PAS_RESET_RATE_LIMIT_SECONDS = 3600;

function setupPasswordResetSheet() {
  const ss = SpreadsheetApp.openById(getPasSpreadsheetId_());
  let sheet = ss.getSheetByName(PAS_PASSWORD_RESET_SHEET);
  if (!sheet) sheet = ss.insertSheet(PAS_PASSWORD_RESET_SHEET);

  const headers = [
    'resetId', 'email', 'codeHash', 'expiresAt',
    'attempts', 'createdAt', 'usedAt'
  ];
  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (firstRow.every(v => v === '' || v === null)) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  Logger.log('PasswordResets sheet ready: ' + ss.getUrl());
}

/**
 * Always returns a generic message so callers cannot discover whether an email exists.
 * Called by endpoint auth/forgot-password with { email }.
 */
function requestPasswordReset(email) {
  const generic = {
    success: true,
    message: 'Jika email terdaftar dan aktif, instruksi reset akan dikirim.'
  };

  email = normalizePasEmail_(email);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return generic;

  const cache = CacheService.getScriptCache();
  const rateKey = 'pas_reset_rate_' + sha256Base64Url_(email);
  if (cache.get(rateKey)) return generic;
  cache.put(rateKey, '1', PAS_RESET_RATE_LIMIT_SECONDS);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.openById(getPasSpreadsheetId_());
    const users = ss.getSheetByName('Users');
    const resetSheet = ss.getSheetByName(PAS_PASSWORD_RESET_SHEET);
    if (!users || !resetSheet) throw new Error('Users or PasswordResets sheet missing');

    const values = users.getDataRange().getValues();
    let activeUser = null;
    for (let i = 1; i < values.length; i++) {
      if (normalizePasEmail_(values[i][1]) === email && values[i][6] === true) {
        activeUser = { name: String(values[i][3] || ''), role: String(values[i][4] || '') };
        break;
      }
    }
    if (!activeUser) return generic;

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const secret = getPasSecret_();
    const codeHash = hmacPas_(email + ':' + code, secret);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + PAS_RESET_CODE_TTL_MS);

    // Invalidate earlier unused codes for this email.
    const resetValues = resetSheet.getDataRange().getValues();
    for (let i = 1; i < resetValues.length; i++) {
      if (normalizePasEmail_(resetValues[i][1]) === email && !resetValues[i][6]) {
        resetSheet.getRange(i + 1, 7).setValue(now);
      }
    }

    resetSheet.appendRow([
      Utilities.getUuid(), email, codeHash, expiresAt, 0, now, ''
    ]);

    const greeting = activeUser.name ? ' ' + activeUser.name : '';
    MailApp.sendEmail({
      to: email,
      subject: 'Kode Reset Password PAS-One',
      body: 'Halo' + greeting + ',\n\nKode reset password PAS-One kamu adalah: ' + code +
        '\n\nKode berlaku selama 15 menit dan hanya dapat digunakan satu kali. Jangan bagikan kode ini kepada siapa pun.\n\nJika kamu tidak meminta reset password, abaikan email ini.'
    });
    return generic;
  } catch (err) {
    console.error('Password reset request failed: ' + err.message);
    return generic;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Called by endpoint auth/reset-password with { email, code, newPassword }.
 */
function completePasswordReset(email, code, newPassword) {
  email = normalizePasEmail_(email);
  code = String(code || '').trim();
  newPassword = String(newPassword || '');

  if (!email || !/^\d{6}$/.test(code)) {
    return { success: false, error: 'Kode atau data reset tidak valid atau sudah kedaluwarsa.' };
  }
  if (newPassword.length < 10 || newPassword.length > 128) {
    return { success: false, error: 'Password baru harus terdiri dari 10–128 karakter.' };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.openById(getPasSpreadsheetId_());
    const users = ss.getSheetByName('Users');
    const resetSheet = ss.getSheetByName(PAS_PASSWORD_RESET_SHEET);
    if (!users || !resetSheet) throw new Error('Users or PasswordResets sheet missing');

    const resetValues = resetSheet.getDataRange().getValues();
    let resetRow = -1;
    let resetRecord = null;
    for (let i = resetValues.length - 1; i >= 1; i--) {
      const row = resetValues[i];
      if (normalizePasEmail_(row[1]) === email && !row[6]) {
        resetRow = i + 1;
        resetRecord = row;
        break;
      }
    }

    const now = new Date();
    if (!resetRecord || !(resetRecord[3] instanceof Date) || resetRecord[3].getTime() <= now.getTime()) {
      return { success: false, error: 'Kode atau data reset tidak valid atau sudah kedaluwarsa.' };
    }

    const attempts = Number(resetRecord[4] || 0);
    if (attempts >= PAS_RESET_MAX_ATTEMPTS) {
      resetSheet.getRange(resetRow, 7).setValue(now);
      return { success: false, error: 'Batas percobaan tercapai. Minta kode reset baru.' };
    }

    const expectedHash = hmacPas_(email + ':' + code, getPasSecret_());
    if (String(resetRecord[2]) !== expectedHash) {
      const nextAttempts = attempts + 1;
      resetSheet.getRange(resetRow, 5).setValue(nextAttempts);
      if (nextAttempts >= PAS_RESET_MAX_ATTEMPTS) resetSheet.getRange(resetRow, 7).setValue(now);
      return { success: false, error: 'Kode atau data reset tidak valid atau sudah kedaluwarsa.' };
    }

    const userValues = users.getDataRange().getValues();
    let userRow = -1;
    for (let i = 1; i < userValues.length; i++) {
      if (normalizePasEmail_(userValues[i][1]) === email && userValues[i][6] === true) {
        userRow = i + 1;
        break;
      }
    }
    if (userRow < 0) {
      resetSheet.getRange(resetRow, 7).setValue(now);
      return { success: false, error: 'Kode atau data reset tidak valid atau sudah kedaluwarsa.' };
    }

    const digest = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      newPassword,
      Utilities.Charset.UTF_8
    );
    users.getRange(userRow, 3).setValue(Utilities.base64Encode(digest));
    resetSheet.getRange(resetRow, 7).setValue(now);

    try {
      if (typeof logAudit === 'function') {
        logAudit('PASSWORD_RESET', email, { method: 'email_code' });
      }
    } catch (auditError) {
      console.error('Password reset audit log failed: ' + auditError.message);
    }

    return { success: true, message: 'Password berhasil diperbarui. Silakan login kembali.' };
  } catch (err) {
    console.error('Password reset completion failed: ' + err.message);
    return { success: false, error: 'Reset password gagal diproses. Coba lagi nanti.' };
  } finally {
    lock.releaseLock();
  }
}

function getPasSpreadsheetId_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Script Property SPREADSHEET_ID belum diatur');
  return id;
}

function getPasSecret_() {
  const secret = PropertiesService.getScriptProperties().getProperty('SECRET_KEY');
  if (!secret || secret.length < 32) throw new Error('SECRET_KEY belum diatur dengan benar');
  return secret;
}

function normalizePasEmail_(email) {
  return String(email || '').trim().toLowerCase();
}

function hmacPas_(value, secret) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(value, secret)
  ).replace(/=+$/, '');
}

function sha256Base64Url_(value) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value)
  ).replace(/=+$/, '');
}
