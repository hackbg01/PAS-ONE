# Security Documentation

## Authentication

### Login Flow
1. User submits email + password
2. Backend: Hash password with SHA-256
3. Compare with stored hash
4. If match: Generate token (Base64-encoded JSON)
5. Frontend: Store token in localStorage
6. Subsequent requests: Include token in header

### Token Format
```javascript
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "admin",
  "iat": 1698595200000
}
```

### Limitations
- Token doesn't expire (future: add 1-hour expiry)
- No refresh token mechanism
- No 2FA/MFA support
- Stored in localStorage (vulnerable to XSS)

## Authorization

### Role-Based Access Control (RBAC)

| Role | Capabilities |
|------|--------------|
| **admin** | All features: users, catalog, orders, payments, settings |
| **mechanic** | View assignments, update status, request discount |
| **manager** | Dashboard, approve discounts |
| **customer** | Catalog, booking, emergency, order history |
| **guest** | Catalog, emergency (limited) |

### Endpoint Protection
Every handler checks user.role:
```javascript
if (action === 'create' && user?.role === 'admin') {
  // Allow
} else {
  return { success: false, error: 'Unauthorized' };
}
```

## Data Security

### Password Hashing
- Algorithm: SHA-256
- Implementation: `Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password)`
- **Note**: Not bcrypt (not available in GAS). Acceptable for low-scale system.
- **Future**: Migrate to Node.js with bcrypt

### Data Validation

#### Frontend
- Email format validation
- Password strength check (future)
- Cart item validation

#### Backend (Critical)
- All inputs re-validated
- Type checking
- Range validation
- Injection prevention

#### Cart Recalculation
```javascript
// ALWAYS recalculate backend, never trust browser total
const subtotal = calculateSubtotal(items);
const tax = subtotal * 0.1;
const total = subtotal + tax;
```

### PII Protection

**Data Collected**
- Users: name, email, phone (optional), address (optional)
- KTP/NPWP: Not stored (business decision)

**Access Restrictions**
- Admin: Can see all customer data
- Customer: Can only see their own data
- Mechanic: Can see assigned customer info only

**Public Exposure**
- KTP/NPWP: Never displayed publicly
- Full phone: Not shown in public portal
- Email: Hidden except in account settings

## Secrets Management

### Current Implementation
- Secrets stored in Google Apps Script → Project Settings
- Never in source code (backend/app.gs)
- Never in .env file tracked to git

### Required Secrets
```
SPREADSHEET_ID = [Google Sheets ID]
SECRET_KEY = [random 32-char string for token signing]
SMTP_PASSWORD = [future: email service]
WHATSAPP_API_KEY = [future: WhatsApp integration]
```

### Safe Configuration
```javascript
// ✅ CORRECT
const secret = PropertiesService.getScriptProperties()
  .getProperty('SECRET_KEY');

// ❌ WRONG
const secret = 'my-secret-hardcoded';
```

## Audit Trail

### Logged Actions
- USER_LOGIN / USER_LOGOUT
- ORDER_CREATED / ORDER_UPDATED
- PAYMENT_VERIFIED
- CATALOG_CREATED / CATALOG_UPDATED / CATALOG_DELETED
- DISCOUNT_APPROVED / DISCOUNT_REJECTED
- EMERGENCY_CREATED / EMERGENCY_ASSIGNED
- USER_REGISTERED

### What NOT to Log
- Passwords (plain text)
- Password hashes
- Full KTP/NPWP numbers
- Credit card / payment method details

### Log Retention
- Keep 6 months of audit logs
- Monthly: Archive old logs
- Yearly: Delete > 1 year old logs

## Network Security

### HTTPS
- GAS Web App: Always HTTPS (enforced by Google)
- Frontend: Deploy on GitHub Pages / Cloud Run (HTTPS)
- All data encrypted in transit

### CORS
- GAS doesn't enforce strict CORS
- Frontend on GitHub Pages can call Apps Script
- **Note**: Future consideration for API gateway

### CSRF Protection
- Current: Minimal (single-origin)
- Future: Add CSRF tokens for sensitive operations

## Data Privacy

### Compliance Considerations
- Personal data: Minimal collection
- Data retention: As needed for business
- User rights: Ability to request data (future)
- DPA: Comply with local regulations (Indonesia)

### Data Deletion
```javascript
// Delete customer data on request (future)
function deleteCustomerData(userId) {
  // Remove from Users
  // Remove from Orders (anonymize)
  // Remove from Emergency
  // Log deletion for compliance
}
```

## Common Vulnerabilities

### ✅ Protected Against
- SQL Injection: No SQL used (Sheets API)
- XSS: HTML content not eval'd
- CSRF: Single origin
- Weak Passwords: No enforcement (future)

### ⚠️ Partially Protected
- Rate Limiting: GAS quota only, no API-level rate limit
- Brute Force: No login attempt throttling
- Session Hijacking: localStorage = XSS risk

### ❌ Not Protected Against
- XSS attacks on frontend (if compromised JS library)
- Real-time location tracking abuse
- Payment fraud (manual verification only)

## Incident Response

### If Breach Suspected
1. Immediately disable Apps Script deployment
2. Change SECRET_KEY in Project Settings
3. Review audit logs for suspicious activity
4. Notify users affected
5. Prepare incident report
6. Re-deploy after fix

### If Payment Fraud
1. Flag order as suspicious
2. Contact customer
3. Do NOT process refund automatically
4. Manual review by manager
5. Document in audit log

## Best Practices Checklist

- [ ] Never commit secrets to git (use .env.example)
- [ ] Always validate on backend
- [ ] Recalculate totals server-side
- [ ] Log all sensitive actions
- [ ] Use HTTPS everywhere
- [ ] Rotate secrets periodically
- [ ] Regular security audits
- [ ] Keep dependencies updated (future)
- [ ] Use least privilege roles
- [ ] Monitor Apps Script quota
- [ ] Backup Sheets daily
- [ ] Test disaster recovery monthly

## Future Security Enhancements

1. **Authentication**
   - Token expiry (1 hour)
   - Refresh token mechanism
   - 2FA for admin accounts
   - OAuth2 integration

2. **Authorization**
   - Fine-grained permissions (per-department)
   - Time-based access (e.g., mechanic only during shift)
   - IP whitelisting for admin

3. **Data Protection**
   - Encryption at rest (Sheets native)
   - Column-level encryption for PII
   - Data masking in logs

4. **Infrastructure**
   - API Gateway (Cloud Endpoints)
   - Rate limiting per IP/user
   - DDoS protection (Cloud Armor)
   - Web Application Firewall (Cloud Armor)

5. **Monitoring**
   - Real-time intrusion detection
   - Anomaly detection (unusual login patterns)
   - Security dashboard
   - Automated alerts

---

**Last Reviewed**: October 29, 2026
**Next Review**: January 29, 2027
**Security Level**: MEDIUM (Acceptable for small business; upgrade as scale)
