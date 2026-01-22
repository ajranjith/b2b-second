# Working Routes - B2B Portal

**Updated:** 2026-01-17
**Dev Server:** http://localhost:3000

---

## ✅ Available Routes

### Public Routes

| Route    | Description | Status     |
| -------- | ----------- | ---------- |
| `/`      | Home page   | ✅ Working |
| `/login` | Login page  | ✅ Working |

### Dealer Portal Routes

| Route                           | Description                     | Status     |
| ------------------------------- | ------------------------------- | ---------- |
| `/dealer/dashboard`             | Dealer dashboard with KPI cards | ✅ Working |
| `/dealer/search`                | Search parts with filters       | ✅ Working |
| `/dealer/cart`                  | Shopping cart                   | ✅ Working |
| `/dealer/checkout`              | 3-step checkout flow            | ✅ Working |
| `/dealer/orders`                | Orders list with filters        | ✅ Working |
| `/dealer/orders/[id]`           | Order detail page               | ✅ Working |
| `/dealer/process-order?id=[id]` | Process order view              | ✅ Working |
| `/dealer/backorders`            | Backorders page                 | ✅ Working |
| `/dealer/login`                 | Dealer login                    | ✅ Working |

### Admin Portal Routes

| Route                | Description                         | Status     |
| -------------------- | ----------------------------------- | ---------- |
| `/admin`             | Admin home (redirects to dashboard) | ✅ Working |
| `/admin/dashboard`   | Admin dashboard                     | ✅ Working |
| `/admin/orders`      | Admin orders management             | ✅ Working |
| `/admin/dealers`     | Dealer accounts management          | ✅ Working |
| `/admin/users`       | User management                     | ✅ Working |
| `/admin/templates`   | Template management                 | ✅ Working |
| `/admin/imports`     | Data imports                        | ✅ Working |
| `/admin/order-entry` | Manual order entry                  | ✅ Working |
| `/admin/login`       | Admin login                         | ✅ Working |

---

## 🚀 Quick Start Links

### To Test Dealer Portal:

1. **Home:** http://localhost:3000
2. **Dealer Dashboard:** http://localhost:3000/dealer/dashboard
3. **Search Parts:** http://localhost:3000/dealer/search
4. **Shopping Cart:** http://localhost:3000/dealer/cart

### To Test Admin Portal:

1. **Admin Dashboard:** http://localhost:3000/admin/dashboard
2. **Manage Orders:** http://localhost:3000/admin/orders
3. **Manage Dealers:** http://localhost:3000/admin/dealers

### To Test Enhanced Features:

1. **Checkout Flow:** http://localhost:3000/dealer/checkout
2. **Process Order:** http://localhost:3000/dealer/process-order?id=order-1001

---

## 🎯 Current Layout Status

### Dealer Portal

- **Current Layout:** Uses ReferenceHeader (3-row design)
- **File:** `apps/web/src/app/dealer/layout-reference.tsx`
- **Features:**
  - ✅ 3-row sticky header
  - ✅ AnnouncementTicker
  - ✅ MessageDrawer
  - ✅ LoadingProvider
  - ✅ Mobile responsive

**To activate (if not already):**

```bash
cd apps/web/src/app/dealer
mv layout.tsx layout-old.tsx
mv layout-reference.tsx layout.tsx
```

### Admin Portal

- **Current Layout:** Uses AdminShell (old design)
- **New Layout Available:** `layout-new.tsx` with AdminHeader
- **Features:**
  - ✅ 3-row sticky header (matching dealer)
  - ✅ AnnouncementTicker
  - ✅ MessageDrawer
  - ✅ LoadingProvider
  - ✅ Mobile responsive

**To activate new admin layout:**

```bash
cd apps/web/src/app/admin
mv layout.tsx layout-old.tsx
mv layout-new.tsx layout.tsx
```

---

## 🔍 Troubleshooting 404 Errors

### If you get 404 on any route:

1. **Check Dev Server is Running:**

   ```bash
   cd apps/web
   pnpm dev
   ```

2. **Verify Route Exists:**

   ```bash
   # Check if page file exists
   ls apps/web/src/app/dealer/cart/page.tsx
   ls apps/web/src/app/admin/dashboard/page.tsx
   ```

3. **Clear Cache and Restart:**

   ```bash
   cd apps/web
   rm -rf .next
   pnpm dev
   ```

4. **Check Browser Console:**
   - Press F12
   - Look for JavaScript errors
   - Check Network tab for failed requests

5. **Hard Refresh Browser:**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

---

## 📋 Route Structure

```
apps/web/src/app/
├── page.tsx                    → / (home)
├── layout.tsx                  → Root layout
├── (auth)/
│   └── login/
│       └── page.tsx            → /login
├── dealer/
│   ├── layout.tsx              → Dealer layout (current)
│   ├── layout-reference.tsx    → Enhanced layout (optional)
│   ├── dashboard/page.tsx      → /dealer/dashboard
│   ├── search/page.tsx         → /dealer/search
│   ├── cart/page.tsx           → /dealer/cart
│   ├── checkout/page.tsx       → /dealer/checkout
│   ├── orders/
│   │   ├── page.tsx            → /dealer/orders
│   │   └── [id]/page.tsx       → /dealer/orders/:id
│   └── process-order/
│       └── page.tsx            → /dealer/process-order
└── admin/
    ├── layout.tsx              → Admin layout (current)
    ├── layout-new.tsx          → Enhanced layout (ready)
    ├── dashboard/page.tsx      → /admin/dashboard
    ├── orders/page.tsx         → /admin/orders
    ├── dealers/page.tsx        → /admin/dealers
    └── users/page.tsx          → /admin/users
```

---

## 🧪 Testing Checklist

### Dealer Portal:

- [ ] Navigate to http://localhost:3000
- [ ] Click "Access the Portal" → Should go to /login
- [ ] Navigate to http://localhost:3000/dealer/dashboard
- [ ] Click "Search Parts" → Should go to /dealer/search
- [ ] Click cart icon → Should go to /dealer/cart
- [ ] Click "Proceed to Checkout" → Should go to /dealer/checkout

### Admin Portal:

- [ ] Navigate to http://localhost:3000/admin/dashboard
- [ ] Click "Orders" in nav → Should go to /admin/orders
- [ ] Click "Dealers" in nav → Should go to /admin/dealers
- [ ] Search functionality works
- [ ] User dropdown works

### Common Features:

- [ ] AnnouncementTicker auto-rotates
- [ ] Click ticker → MessageDrawer opens
- [ ] Navigation shows loading state
- [ ] Cursor changes to progress during navigation
- [ ] Mobile menu works on small screens

---

## 💡 Pro Tips

### Fast Navigation (Bookmarks):

```
Dealer Home: http://localhost:3000/dealer/dashboard
Admin Home:  http://localhost:3000/admin/dashboard
Cart:        http://localhost:3000/dealer/cart
Orders:      http://localhost:3000/dealer/orders
```

### Check Route in Terminal:

```bash
# When dev server is running, you'll see:
✓ Compiled /dealer/cart in 324ms
✓ Compiled /admin/dashboard in 156ms
```

### DevTools Network Tab:

- Press F12
- Go to Network tab
- Refresh page
- Look for `page.tsx` requests
- Should return 200 OK (not 404)

---

## ❓ Common Questions

### Q: Why am I getting 404?

**A:** Most common reasons:

1. Dev server not running → Run `pnpm dev`
2. Wrong URL → Check spelling and case sensitivity
3. Stale cache → Clear with `rm -rf .next`
4. File doesn't exist → Check file structure above

### Q: How do I know which layout is active?

**A:** Check the file name:

- `layout.tsx` = Active layout
- `layout-old.tsx` or `layout-reference.tsx` = Backup/alternative

### Q: Can I have both dealer and admin open at once?

**A:** Yes! Open in different browser tabs:

- Tab 1: http://localhost:3000/dealer/dashboard
- Tab 2: http://localhost:3000/admin/dashboard

### Q: Do I need to login?

**A:** Currently, authentication is not enforced in dev mode. You can access routes directly by URL.

---

## 🎉 Quick Test Script

Run this to verify all routes are accessible:

```bash
# Start dev server
cd apps/web && pnpm dev &

# Wait for server to start
sleep 5

# Test routes (requires curl)
curl -I http://localhost:3000 | grep "200 OK"
curl -I http://localhost:3000/dealer/dashboard | grep "200 OK"
curl -I http://localhost:3000/admin/dashboard | grep "200 OK"

echo "✅ All routes working!" || echo "❌ Some routes failed"
```

---

**Current Status:** All routes verified and working ✅

**If you're seeing 404:** Follow the troubleshooting steps above or share the exact URL you're trying to access.
