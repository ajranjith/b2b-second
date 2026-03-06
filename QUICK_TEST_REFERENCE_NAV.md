# Quick Test - Reference Navigation

**5-Minute Test Guide**

---

## 🚀 Quick Start

### Step 1: Activate the New Layout

**Option A: Swap Files (Recommended)**

```bash
# Backup current layout
mv apps/web/src/app/dealer/layout.tsx apps/web/src/app/dealer/layout-backup.tsx

# Activate reference layout
mv apps/web/src/app/dealer/layout-reference.tsx apps/web/src/app/dealer/layout.tsx

# Start server
pnpm dev
```

**Option B: Manual Edit**

Open `apps/web/src/app/dealer/layout.tsx` and replace the content with the code from `layout-reference.tsx`.

---

## ✅ Visual Checklist

Visit: http://localhost:3000/dealer/dashboard

### Header (Top to Bottom)

**1. Utility Strip** (gray background, small text)

- [ ] "Support" link (left)
- [ ] "Live Chat" link
- [ ] "Call Support" with phone icon
- [ ] Promo text in center
- [ ] Shipping message (right)

**2. Main Header** (white background)

- [ ] HB logo + "Dealer Portal" text (left)
- [ ] Large search bar with placeholder "Search Products"
- [ ] Blue "Search" button inside search bar (right side)
- [ ] Hotline section with phone number (right)

**3. Secondary Nav** (white background with border)

- [ ] **BLACK rounded pill button** "All Categories" (left)
  - Has menu icon
  - Has "All Categories" text
  - Has dropdown chevron
- [ ] Horizontal nav links (center):
  - Dashboard
  - Search Parts
  - Orders
  - Account
- [ ] Icons (right):
  - Heart icon (optional)
  - Cart icon with red badge
  - User icon

**4. Announcement Ticker** (gray background)

- [ ] Visible below header
- [ ] Auto-rotating announcements
- [ ] Click opens drawer on right

---

## 🧪 Functional Tests

### Test 1: Search

1. Click in search bar
2. Type "oil filter"
3. Press Enter
4. **Expected:** Navigate to search page with query

### Test 2: Black Menu Button

1. Click "All Categories" black button
2. **Expected (Desktop):** Could open dropdown
3. **Expected (Mobile):** Opens side drawer from left

### Test 3: Navigation Links

1. Click "Dashboard"
2. **Expected:** Link has blue underline (active state)
3. Click "Search Parts"
4. **Expected:** Dashboard loses underline, Search Parts gets blue underline

### Test 4: Cart Icon

1. Click cart icon
2. **Expected:** Navigate to /dealer/cart

### Test 5: User Dropdown

1. Click user icon
2. **Expected:** Dropdown menu appears
3. Menu shows:
   - Dealer name at top
   - Account link
   - My Orders link
   - Logout link

### Test 6: Loading States

1. Click any navigation link
2. **Expected:**
   - [ ] Blue progress bar appears at top of screen
   - [ ] Cursor changes to progress/wait
   - [ ] After ~500ms, loading completes
   - [ ] Cursor returns to normal

### Test 7: Announcement Ticker

1. Watch ticker for 8 seconds
2. **Expected:** Announcement changes automatically
3. Hover over ticker
4. **Expected:** Auto-rotation pauses
5. Click on announcement
6. **Expected:** Drawer slides in from right with full details

---

## 📱 Mobile Test

Resize browser to 375px width or use mobile device:

- [ ] Utility strip remains visible
- [ ] Search bar shrinks but stays functional
- [ ] Hotline section hides (lg breakpoint)
- [ ] Nav links hide (md breakpoint)
- [ ] Black "All Categories" button visible
- [ ] Only "All Categories" text visible on small screens
- [ ] Cart and user icons remain visible
- [ ] Clicking menu button opens side drawer
- [ ] Side drawer has:
  - Dark overlay
  - White drawer from left
  - All nav links listed
  - Close on overlay click

---

## 🎨 Style Verification

### Colors Check

- [ ] Black button: slate-900 background
- [ ] Search button: blue-600 background
- [ ] Active nav link: blue-600 text + border
- [ ] Inactive nav link: slate-700 text
- [ ] Progress bar: blue gradient
- [ ] Cart badge: red background

### Spacing Check

- [ ] Utility strip: 32px height
- [ ] Main header: 72px height
- [ ] Secondary nav: 56px height
- [ ] Ticker: 40px height
- [ ] Total header height: ~200px

### Fonts Check

- [ ] Utility strip: text-xs (12px)
- [ ] Nav links: text-sm (14px)
- [ ] Logo: text-xl (20px)
- [ ] All text readable and clear

---

## 🐛 Common Issues & Fixes

### Issue: Layout doesn't change

**Fix:** Clear Next.js cache

```bash
rm -rf .next
pnpm dev
```

### Issue: Loading bar doesn't show

**Fix:** Check LoadingProvider is wrapping layout

```tsx
// Should be in layout.tsx
<LoadingProvider>
  <CartProvider>{children}</CartProvider>
</LoadingProvider>
```

### Issue: Cursor doesn't change

**Fix:** Check globals.css has loading styles

```bash
# Search for:
body.app-loading { cursor: progress; }
```

### Issue: Black button not showing

**Fix:** Check ReferenceHeader is imported correctly

```tsx
import { ReferenceHeader } from "@/components/layouts";
```

### Issue: TypeScript errors

**Fix:** Restart TypeScript server

```
VS Code: Ctrl+Shift+P → TypeScript: Restart TS Server
```

---

## ✨ Customization Examples

### Change Black Button to Orange (Reference Video Style)

**File:** `apps/web/src/components/layouts/ReferenceHeader.tsx`

Find line ~130:

```tsx
className = "bg-slate-900 hover:bg-slate-800 text-white h-10 px-4 rounded-full gap-2";
```

Change to:

```tsx
className = "bg-orange-600 hover:bg-orange-700 text-white h-10 px-4 rounded-full gap-2";
```

### Change Search Button Color

Find line ~79:

```tsx
className = "absolute right-1 top-1 h-9 bg-blue-600 hover:bg-blue-700 text-white px-6";
```

Change to:

```tsx
className = "absolute right-1 top-1 h-9 bg-orange-600 hover:bg-orange-700 text-white px-6";
```

### Remove Heart Icon

Find line ~183 and comment out:

```tsx
{
  /* Heart Icon (Optional - can remove for dealer portal) */
}
{
  /* <Button variant="ghost" ... >
  <HeartIcon className="w-5 h-5" />
</Button> */
}
```

### Remove Utility Strip

Find line ~57 and comment out:

```tsx
{
  /* Row 1: Utility Strip (Optional) */
}
{
  /* <div className="bg-slate-50 ...">...</div> */
}
```

Then update ticker position in `layout-reference.tsx`:

```tsx
// Change from:
style={{ top: 'calc(32px + 72px + 56px)' }}

// To:
style={{ top: 'calc(72px + 56px)' }}
```

---

## 📊 Performance Check

Open Chrome DevTools → Performance:

1. Record page load
2. Click navigation link
3. Stop recording

**Expected:**

- Page load: < 2 seconds
- Route transition: < 500ms
- Loading animation: Smooth 60fps
- No layout shifts

---

## ✅ Sign-Off Checklist

Once all tests pass:

- [ ] Header looks like reference video
- [ ] Black pill button visible and functional
- [ ] Nav links work and show active state
- [ ] Loading bar appears on navigation
- [ ] Cursor changes during loading
- [ ] Announcement ticker auto-rotates
- [ ] Mobile responsive (test on phone)
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Performance is smooth

---

## 🎉 Success!

If all checks pass, the reference navigation is working correctly!

**Next Steps:**

1. Test on actual mobile device
2. Get user feedback
3. Continue with remaining features:
   - Checkout flow
   - Orders pages
   - Final polish

---

**Need Help?**

- Full guide: [REFERENCE_NAVIGATION_GUIDE.md](REFERENCE_NAVIGATION_GUIDE.md)
- Implementation details: [DEALER_UI_IMPLEMENTATION_GUIDE.md](DEALER_UI_IMPLEMENTATION_GUIDE.md)
- Troubleshooting: [DEALER_UI_TESTING_GUIDE.md](DEALER_UI_TESTING_GUIDE.md)
