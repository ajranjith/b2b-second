# B2B-First Endpoint Index & ID Architecture

> Generated: 2026-01-22
> Updated: 2026-01-22
> Purpose: Map all UI calls → BFF endpoints → services with ID-based tracking

## Recent Fixes Applied
- ✅ Fixed `users/page.tsx` to call `/admin/admin-users` instead of `/admin/users`
- ✅ Fixed `dealerApi.ts` to call `/dealer/account` instead of `/dealer/profile`
- ✅ Fixed `dealerApi.ts` pricing context to use `/dealer/account` endpoint
- ✅ Created BFF route `/admin/banners/{id}` DELETE for banner deletion
- ✅ Created BFF route `/dealer/orders/{id}` GET for order details

## Environment Configuration

### Subdomain Architecture (Production)
| App | Subdomain | Port (Dev) | Base URL Pattern |
|-----|-----------|------------|------------------|
| Admin Web | `admin.example.com` | 3000 | `NEXT_PUBLIC_API_URL` |
| Dealer Web | `dealer.example.com` | 3000 | `NEXT_PUBLIC_API_URL` |
| API (BFF) | `api.example.com` | 3001 | `API_BASE_URL` |

### Environment Variables
```bash
# Admin Web (.env)
NEXT_PUBLIC_API_URL="https://api.example.com/api/bff/v1"
API_BASE_URL="https://api.example.com"

# Dealer Web (.env)
NEXT_PUBLIC_API_URL="https://api.example.com/api/bff/v1"
API_BASE_URL="https://api.example.com"

# API Server (.env)
API_BASE_URL="https://api.example.com"
```

---

## ID-Based Endpoint Registry

### Namespace Identifiers
| Namespace ID | Description | Prefix |
|--------------|-------------|--------|
| `AUTH` | Authentication endpoints | `/api/auth/` |
| `A` | Admin BFF endpoints | `/api/bff/v1/admin/` |
| `D` | Dealer BFF endpoints | `/api/bff/v1/dealer/` |
| `P` | Pricing endpoints | `/api/bff/v1/pricing/` |

---

## ADMIN ENDPOINTS (Namespace: A)

### A-DASH: Dashboard
| Endpoint ID | Method | BFF Route | UI File | Trigger | Status |
|-------------|--------|-----------|---------|---------|--------|
| `A-DASH-001` | GET | `/admin/dashboard` | `AdminDashboard.tsx:67` | Page load | ✅ Active |

### A-DEAL: Dealers Management
| Endpoint ID | Method | BFF Route | UI File | Trigger | Status |
|-------------|--------|-----------|---------|---------|--------|
| `A-DEAL-001` | GET | `/admin/dealers` | `dealers/page.tsx:99` | Page load | ✅ Active |
| `A-DEAL-002` | POST | `/admin/dealers` | `DealerDialog.tsx:227` | Create button | ⚠️ Returns 501 |
| `A-DEAL-003` | PATCH | `/admin/dealers/{id}` | `DealerDialog.tsx:223` | Update button | ⚠️ Returns 501 |
| `A-DEAL-004` | DELETE | `/admin/dealers/{id}` | `dealers/page.tsx:132` | Delete button | ❌ No BFF route |
| `A-DEAL-005` | POST | `/admin/dealers/{id}/reset-password` | `dealers/page.tsx:115` | Reset pwd button | ❌ No BFF route |

### A-USER: Admin Users Management
| Endpoint ID | Method | BFF Route | UI File | Trigger | Status |
|-------------|--------|-----------|---------|---------|--------|
| `A-USER-001` | GET | `/admin/admin-users` | `users/page.tsx:81` | Page load | ✅ Fixed |
| `A-USER-002` | POST | `/admin/admin-users` | `users/page.tsx:117` | Create button | ✅ Fixed |
| `A-USER-003` | PATCH | `/admin/admin-users/{id}` | - | - | ✅ BFF exists |
| `A-USER-004` | DELETE | `/admin/admin-users/{id}` | `users/page.tsx:103` | Deactivate button | ⚠️ Needs BFF route |
| `A-USER-005` | POST | `/admin/admin-users/{id}/reset-password` | `users/page.tsx:92` | Reset pwd button | ⚠️ Needs BFF route |

### A-ORDR: Orders Management
| Endpoint ID | Method | BFF Route | UI File | Trigger | Status |
|-------------|--------|-----------|---------|---------|--------|
| `A-ORDR-001` | GET | `/admin/orders` | `orders/page.tsx` | Page load (SSR) | ✅ Active |

### A-IMPT: Imports Management
| Endpoint ID | Method | BFF Route | UI File | Trigger | Status |
|-------------|--------|-----------|---------|---------|--------|
| `A-IMPT-001` | GET | `/admin/imports` | `useImportProcessor.ts:79` | Page load + poll | ✅ Active |
| `A-IMPT-002` | POST | `/admin/imports/run` | `useImportProcessor.ts:140` | Run import button | ✅ Active |
| `A-IMPT-003` | GET | `/admin/imports/status/{batchId}` | - | - | ✅ BFF exists |
| `A-IMPT-004` | GET | `/admin/imports/templates/{type}` | `useImportProcessor.ts:93` | Type selection | ✅ Active |
| `A-IMPT-005` | POST | `/admin/import/special-prices` | `special-prices/page.tsx:84` | Upload button | ❌ No BFF route |

### A-BNRS: Banners Management
| Endpoint ID | Method | BFF Route | UI File | Trigger | Status |
|-------------|--------|-----------|---------|---------|--------|
| `A-BNRS-001` | GET | `/admin/banners` | `banners/page.tsx:22` | Page load | ✅ Active |
| `A-BNRS-002` | POST | `/admin/banners` | `banners/page.tsx:37` | File upload | ✅ Active |
| `A-BNRS-003` | DELETE | `/admin/banners/{id}` | `banners/page.tsx:53` | Delete button | ✅ Created |

### A-NEWS: News Management
| Endpoint ID | Method | BFF Route | UI File | Trigger | Status |
|-------------|--------|-----------|---------|---------|--------|
| `A-NEWS-001` | GET | `/admin/news` | `news/page.tsx:51` | Page load | ✅ Active |
| `A-NEWS-002` | POST | `/admin/news` | `news/page.tsx:110` | Save article | ✅ Active |
| `A-NEWS-003` | POST | `/admin/news/{id}/archive` | - | Archive button | ✅ BFF exists |
| `A-NEWS-004` | POST | `/admin/news/{id}/publish` | - | Publish button | ✅ BFF exists |
| `A-NEWS-005` | GET | `/admin/news/{id}/attachments/{attachmentId}/download` | `news/page.tsx:65` | Download button | ❌ Route mismatch |

### A-EXPRT: Exports
| Endpoint ID | Method | BFF Route | UI File | Trigger | Status |
|-------------|--------|-----------|---------|---------|--------|
| `A-EXPRT-001` | GET | `/admin/exports/backorders` | - | Export button | ✅ BFF exists |
| `A-EXPRT-002` | GET | `/admin/exports/orders` | - | Export button | ✅ BFF exists |

### A-TMPL: Templates
| Endpoint ID | Method | BFF Route | UI File | Trigger | Status |
|-------------|--------|-----------|---------|---------|--------|
| `A-TMPL-001` | GET | `/admin/templates` | `templates/page.tsx:124` | Page load | ❌ No BFF route |
| `A-TMPL-002` | GET | `/admin/templates/{id}/download` | `templates/page.tsx:133` | Download button | ❌ No BFF route |

---

## DEALER ENDPOINTS (Namespace: D)

### D-DASH: Dashboard
| Endpoint ID | Method | BFF Route | UI File | Trigger | Status |
|-------------|--------|-----------|---------|---------|--------|
| `D-DASH-001` | GET | `/dealer/dashboard` | `dashboard/page.tsx:39` | Page load | ✅ Active |

### D-SRCH: Product Search
| Endpoint ID | Method | BFF Route | UI File | Trigger | Status |
|-------------|--------|-----------|---------|---------|--------|
| `D-SRCH-001` | GET | `/dealer/search` | `dealerApi.ts:117` | Search input | ✅ Active |

### D-CART: Shopping Cart
| Endpoint ID | Method | BFF Route | UI File | Trigger | Status |
|-------------|--------|-----------|---------|---------|--------|
| `D-CART-001` | GET | `/dealer/cart` | `dealerApi.ts:184` | Page load | ✅ Active |
| `D-CART-002` | POST | `/dealer/cart/items` | `dealerApi.ts:195` | Add to cart | ✅ Active |
| `D-CART-003` | PATCH | `/dealer/cart/items/{id}` | `dealerApi.ts:205` | Update qty | ✅ Active |
| `D-CART-004` | DELETE | `/dealer/cart/items/{id}` | `dealerApi.ts:215` | Remove item | ✅ Active |

### D-CHKT: Checkout
| Endpoint ID | Method | BFF Route | UI File | Trigger | Status |
|-------------|--------|-----------|---------|---------|--------|
| `D-CHKT-001` | POST | `/dealer/checkout` | `cart/page.tsx:81` | Place order | ✅ Active |

### D-ORDR: Orders
| Endpoint ID | Method | BFF Route | UI File | Trigger | Status |
|-------------|--------|-----------|---------|---------|--------|
| `D-ORDR-001` | GET | `/dealer/orders` | `dealerApi.ts:225` | Page load | ✅ Active |
| `D-ORDR-002` | GET | `/dealer/orders/{id}` | `dealerApi.ts:252` | Order click | ✅ Created |
| `D-ORDR-003` | GET | `/dealer/orders/export` | `orders/page.tsx:133` | Export button | ✅ Active |

### D-BACK: Backorders
| Endpoint ID | Method | BFF Route | UI File | Trigger | Status |
|-------------|--------|-----------|---------|---------|--------|
| `D-BACK-001` | GET | `/dealer/backorders` | `dealerApi.ts:289` | Dashboard load | ✅ Active |
| `D-BACK-002` | GET | `/dealer/backorders/export` | - | Export button | ✅ BFF exists |

### D-ACCT: Account
| Endpoint ID | Method | BFF Route | UI File | Trigger | Status |
|-------------|--------|-----------|---------|---------|--------|
| `D-ACCT-001` | GET | `/dealer/account` | `dealerApi.ts:309` | Page load | ✅ Fixed (was /dealer/profile) |
| `D-ACCT-002` | PATCH | `/dealer/account` | - | Update button | ✅ BFF exists |
| `D-ACCT-003` | POST | `/dealer/account/reset-password` | - | Reset pwd | ✅ BFF exists |

### D-BNRS: Banners
| Endpoint ID | Method | BFF Route | UI File | Trigger | Status |
|-------------|--------|-----------|---------|---------|--------|
| `D-BNRS-001` | GET | `/dealer/banners` | `bannerApi.ts:20` | Page load | ✅ Active |

### D-NEWS: News
| Endpoint ID | Method | BFF Route | UI File | Trigger | Status |
|-------------|--------|-----------|---------|---------|--------|
| `D-NEWS-001` | GET | `/dealer/news` | `dealerApi.ts:319` | Page load | ✅ Active |
| `D-NEWS-002` | GET | `/dealer/news/{id}/download/{attachmentId}` | `news/page.tsx:19` | Download button | ✅ Active |

### D-PRIC: Pricing
| Endpoint ID | Method | BFF Route | UI File | Trigger | Status |
|-------------|--------|-----------|---------|---------|--------|
| `D-PRIC-001` | GET | `/dealer/account` | `dealerApi.ts:299` | Dashboard load | ✅ Fixed (uses account endpoint) |

---

## AUTH ENDPOINTS (Namespace: AUTH)

| Endpoint ID | Method | Route | UI File | Trigger | Status |
|-------------|--------|-------|---------|---------|--------|
| `AUTH-001` | POST | `/api/auth/login` | `login/page.tsx` | Login form | ✅ Active |
| `AUTH-002` | POST | `/auth/change-password` | `change-password/page.tsx` | Change pwd form | ❌ No BFF route |

---

## ENDPOINT MISMATCH SUMMARY

### ✅ FIXED: These issues have been resolved
| ID | Issue | Resolution |
|----|-------|------------|
| `A-USER-001` | UI called `/admin/users` | Updated to `/admin/admin-users` |
| `A-USER-002` | UI called `/admin/users/admin` | Updated to `/admin/admin-users` POST |
| `A-BNRS-003` | No DELETE route for banners | Created `/admin/banners/{id}` DELETE |
| `D-ORDR-002` | No order detail route | Created `/dealer/orders/{id}` GET |
| `D-ACCT-004` | UI called `/dealer/profile` | Updated to `/dealer/account` |
| `D-PRIC-001` | Separate pricing endpoint | Merged into `/dealer/account` response |

### ❌ REMAINING: UI calls endpoint that doesn't exist
| ID | UI Calls | Expected BFF | Fix Required |
|----|----------|--------------|--------------|
| `A-DEAL-004` | `/admin/dealers/{id}` DELETE | Missing | Create BFF route |
| `A-DEAL-005` | `/admin/dealers/{id}/reset-password` | Missing | Create BFF route |
| `A-USER-004` | `/admin/admin-users/{id}` DELETE | Missing | Create BFF route |
| `A-USER-005` | `/admin/admin-users/{id}/reset-password` | Missing | Create BFF route |
| `A-IMPT-005` | `/admin/import/special-prices` | Missing | Create BFF route |
| `A-NEWS-005` | `/admin/news/{id}/attachments/...` | Different path | Align paths |
| `A-TMPL-001` | `/admin/templates` | Missing | Create BFF route |
| `A-TMPL-002` | `/admin/templates/{id}/download` | Missing | Create BFF route |
| `AUTH-002` | `/auth/change-password` | Missing | Create BFF route |

### ⚠️ WARNING: BFF returns 501 Not Implemented
| ID | BFF Route | Reason |
|----|-----------|--------|
| `A-DEAL-002` | `/admin/dealers` POST | Returns 501 |
| `A-DEAL-003` | `/admin/dealers` PATCH | Returns 501 |

---

## WEBHOOK REGISTRY

> No webhooks currently configured. Reserved IDs for future implementation:

| Webhook ID | Event | Target Endpoint | Status |
|------------|-------|-----------------|--------|
| `WH-ORDR-001` | order.created | - | 🔮 Planned |
| `WH-ORDR-002` | order.shipped | - | 🔮 Planned |
| `WH-IMPT-001` | import.completed | - | 🔮 Planned |
| `WH-IMPT-002` | import.failed | - | 🔮 Planned |
| `WH-DEAL-001` | dealer.created | - | 🔮 Planned |
| `WH-DEAL-002` | dealer.deactivated | - | 🔮 Planned |

---

## API CLIENT CONFIGURATION

### Primary API Client (`api.ts`)
```typescript
// BFF endpoints - use 'api' (default export)
import api from "@/lib/api";
api.get("/admin/dealers");  // → /api/bff/v1/admin/dealers

// Auth endpoints - use 'authApi' (no BFF prefix)
import { authApi } from "@/lib/api";
authApi.post("/auth/login");  // → /api/auth/login
```

### File Locations
| File | Purpose | Base URL |
|------|---------|----------|
| `apps/web/src/lib/api.ts` | Axios clients | BFF: `/api/bff/v1`, Auth: `/` |
| `apps/web/src/lib/api-client.ts` | Fetch client | BFF: `/api/bff/v1` |
| `apps/web/src/lib/services/dealerApi.ts` | Dealer service | Uses `api.ts` |
| `apps/web/src/lib/services/bannerApi.ts` | Banner service | Uses `api.ts` |

---

## STATISTICS

| Category | Count |
|----------|-------|
| Total BFF Endpoints | 34 |
| Admin Endpoints | 20 |
| Dealer Endpoints | 13 |
| Auth Endpoints | 1 |
| UI API Calls (Admin) | 29 |
| UI API Calls (Dealer) | 15 |
| **Fixed Endpoints** | **6** |
| **Remaining Mismatches** | **9** |
| Not Implemented (501) | 2 |
| Webhooks (Planned) | 6 |

---

## RECOMMENDED FIXES (Priority Order)

### ✅ COMPLETED
- ~~Fix UI `/admin/users` → `/admin/admin-users`~~ → Done
- ~~Create `/dealer/orders/{id}` GET route~~ → Done
- ~~Create `/admin/banners/{id}` DELETE route~~ → Done
- ~~Fix `/dealer/profile` → `/dealer/account` in UI~~ → Done

### P0 - Critical (Blocking Functionality)
1. Create `/admin/dealers/{id}` DELETE route → `A-DEAL-004`
2. Create `/admin/dealers/{id}/reset-password` POST route → `A-DEAL-005`

### P1 - High (Feature Complete)
3. Implement `/admin/dealers` POST (currently 501) → `A-DEAL-002`
4. Implement `/admin/dealers` PATCH (currently 501) → `A-DEAL-003`
5. Create `/admin/admin-users/{id}` DELETE route → `A-USER-004`
6. Create `/admin/admin-users/{id}/reset-password` POST route → `A-USER-005`

### P2 - Medium (Full Coverage)
7. Create `/auth/change-password` POST route → `AUTH-002`

### P3 - Low (Nice to Have)
8. Create `/admin/templates` routes → `A-TMPL-001`, `A-TMPL-002`
9. Create `/admin/import/special-prices` route → `A-IMPT-005`
10. Align news attachment download paths → `A-NEWS-005`
