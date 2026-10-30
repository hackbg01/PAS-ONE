# PAS-One Architecture

## Overview
PAS-One adalah platform terintegrasi untuk manajemen layanan otomotif dengan 3 portal utama:
- **Consumer Portal**: Katalog, booking, pembayaran, emergency
- **Operational Portal**: Admin, mekanik, inventory management
- **Management Portal**: Dashboard, approval diskon

## Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Google Apps Script (GAS)
- **Database**: Google Sheets
- **Authentication**: Token-based (Base64 encoded)
- **Hosting**: Google Apps Script Web App + GitHub Pages (frontend)

## Architecture Layers

```
┌─────────────────────────────────────────────────┐
│         Consumer/Admin/Mechanic Portal           │
│  (HTML5 + CSS3 + Vanilla JS, SPA Router)        │
└────────────────┬────────────────────────────────┘
                 │
        REST API (JSON over HTTP)
                 │
┌────────────────▼────────────────────────────────┐
│      Google Apps Script Backend (Web App)       │
│  • Route Handler (doPost)                        │
│  • Auth (Login, Register, Token Verify)         │
│  • Business Logic (Orders, Payments, Etc)       │
│  • Data Validation & Audit Logging              │
└────────────────┬────────────────────────────────┘
                 │
     Google Sheets API (SpreadsheetApp)
                 │
┌────────────────▼────────────────────────────────┐
│          Google Sheets Database                  │
│  • Users, Catalog, Orders, Payments            │
│  • Emergency Tickets, Inventory, Logs          │
└─────────────────────────────────────────────────┘
```

## Frontend Structure

```
frontend/
├── index.html              # Entry point, all portals in one
├── js/
│   ├── config.js          # Global config (roles, statuses, fees)
│   ├── app.js             # Main router and app logic
│   └── api/
│       └── client.js      # API wrapper for backend calls
├── css/
│   ├── design-tokens.css  # Colors, typography, spacing
│   ├── components.css     # Reusable components
│   └── pages.css          # Page-specific styles
└── .env.example           # Configuration template
```

### Frontend Router
- Hash-based routing (#/catalog, #/login, #/admin, etc)
- Role-based page visibility (admin, mechanic, manager, customer)
- Local state management (cart, user session)
- API client abstraction (window.api)

## Backend Structure

```
backend/
└── app.gs
    ├── doPost(e)                    # Main entry point
    ├── Endpoint Handlers            # /auth/*, /catalog/*, etc
    ├── Business Logic Functions     # createOrder, etc
    ├── Authentication               # generateToken, verifyToken
    ├── Audit Logging               # logAudit
    └── Spreadsheet Operations      # listCatalog, getOrder, etc
```

### API Endpoints (POST /?)
```
POST /?endpoint=auth/register       # Register user
POST /?endpoint=auth/login          # Login user
POST /?endpoint=catalog/list        # Get catalog items
POST /?endpoint=catalog/create      # Create item (admin)
POST /?endpoint=orders/create       # Create order
POST /?endpoint=payments/verify     # Verify payment
POST /?endpoint=emergency/create    # Create emergency ticket
POST /?endpoint=dashboard/admin     # Get admin dashboard
```

### Authentication Flow
1. Frontend: POST /auth/login with email/password
2. Backend: Hash password, verify against Sheets, generate token
3. Token: Base64-encoded JSON with userId, role, email
4. Storage: localStorage on client
5. Validation: Token verified on each protected endpoint

## Database Schema (Google Sheets)

### Users
| userId | email | passwordHash | name | role | createdAt | active |

### Catalog
| itemId | name | category | description | price | stock | active | createdAt |

### Orders
| orderId | customerId | customerData | items | subtotal | tax | total | orderStatus | paymentStatus | createdAt | createdBy |

### Payments
| paymentId | orderId | amount | status | verifiedBy | verifiedAt | proofUrl |

### Emergency
| ticketId | customerId | lat | lng | complaint | status | assignedTo | estimatedCost | createdAt |

### Inventory
| partId | name | category | unit | quantity | minStock | price | createdAt |

### DiscountRequests
| requestId | orderId | originalAmount | discountAmount | finalAmount | reason | requestedBy | approvedBy | status | createdAt |

### AuditLog
| logId | timestamp | action | resource | details | user |

## Data Flow Examples

### Order Creation
1. User adds items to cart (client storage)
2. User submits checkout form
3. Frontend: POST /orders/create
4. Backend: Validate items, calculate total, create row in Orders sheet
5. Return orderId + total
6. Frontend: Redirect to payment page

### Payment Verification
1. Customer uploads payment proof
2. Admin verifies payment manually
3. Admin: POST /payments/verify with proof
4. Backend: Create Payments row, update Orders.paymentStatus to "verified"
5. Frontend: Show "booking confirmed" with booking code

### Emergency Request
1. Customer hits panic button
2. Frontend: Get geolocation, POST /emergency/create
3. Backend: Create Emergency row, log audit
4. Return ticketId
5. Frontend: Show status tracking with mechanic location polling

## Security Considerations

### Authentication
- Passwords: SHA-256 hashed (not bcrypt, but standard for GAS)
- Tokens: Base64 encoded JSON, 1-hour expiry (future enhancement)
- No secrets in source code (use Script Properties)

### Authorization
- Role-based: admin, mechanic, manager, customer, guest
- Endpoint validation: Check user.role before sensitive operations
- Data isolation: Users see only their orders/assignments

### Data Validation
- Frontend: Input validation (email format, number ranges)
- Backend: Always re-validate & recalculate (never trust frontend)
- Cart total: Recalculated from DB prices, not from browser total

### Audit Trail
- All sensitive actions logged (login, payments, catalog changes)
- Timestamp + user email for accountability
- No passwords/KTP/NPWP stored in logs

## Rate Limiting & Performance
- **GAS Quotas**: 20k POST requests/day (per deployment)
- **Caching**: Frontend caches catalog in sessionStorage
- **Polling**: Location updates every 30s, dashboard every 60s
- **Async**: Long operations should queue via Sheets

## Limitations & Future Improvements

### Current Limitations
- Real-time location: Polling-based, not true WebSocket
- Concurrent transactions: Google Sheets row locking limited
- File uploads: Base64 encoding or Google Drive integration needed
- Email/SMS: Manual notification via script properties

### Future Enhancements
1. Replace GAS with Node.js + PostgreSQL for scale
2. Payment gateway integration (Midtrans, Stripe)
3. WhatsApp Business API integration
4. Real-time notifications (Firebase, Pusher)
5. File storage (Google Drive, S3)

## Deployment Architecture

### Local Development
1. Clone repo
2. Open /frontend/index.html in browser
3. Apps Script editor: paste backend/app.gs
4. Deploy Apps Script as Web App
5. Update frontend/.env with deployment URL

### Production
1. Frontend: Host on GitHub Pages, CDN, or server
2. Backend: Deploy Apps Script from Google Cloud
3. Database: Google Sheets (shared/team owned)
4. Backup: Daily export to version control

## Testing Strategy

### Frontend Tests (Manual/Browser)
- Page load & rendering
- Form validation
- Navigation between portals
- API error handling

### Backend Tests (GAS Editor)
- Function calls in editor console
- Sheet operations (CRUD)
- Auth flow
- Audit logging

## Documentation Map

- **ARCHITECTURE.md** (this file): System design & layers
- **DATABASE-SETUP.md**: Sheet schema & initialization
- **DEPLOYMENT.md**: Step-by-step deploy guide
- **SECURITY.md**: Auth, roles, secrets, data privacy
- **FEATURE-MATRIX.md**: Status of each feature
- **TEST-REPORT.md**: Test results & coverage
