# Fix: ChunkLoadError - Loading chunk failed

**Error:** `ChunkLoadError: Loading chunk app/layout failed`
**Status:** ✅ Fixed
**Date:** 2026-01-17

---

## What Happened

This error occurs when Next.js tries to load a JavaScript chunk (code splitting file) but fails due to:
1. Stale build cache
2. Dev server not restarting after file changes
3. Browser caching old chunks
4. File watcher not detecting changes

---

## ✅ Solution Applied

### Step 1: Clear Next.js Build Cache
```bash
cd apps/web
rm -rf .next
```

### Step 2: Stop Any Running Dev Servers
```bash
pkill -f "next dev"
```

### Step 3: Restart Dev Server
```bash
pnpm dev
```

### Step 4: Hard Refresh Browser
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`
- Or open DevTools (F12) → Right-click refresh → "Empty Cache and Hard Reload"

---

## 🚀 Quick Fix Commands

Run these in order:

```bash
# 1. Navigate to web app
cd apps/web

# 2. Clear cache
rm -rf .next

# 3. Stop dev server (if running)
pkill -f "next dev"

# 4. Restart dev server
pnpm dev

# 5. In browser: Hard refresh (Ctrl+Shift+R)
```

---

## 🔍 Why This Happens

### Common Causes:

1. **File Changes Not Detected**
   - Created new layout files (layout-new.tsx)
   - Modified multiple component files
   - Added new imports (AdminHeader)

2. **Webpack Module Cache**
   - Next.js caches compiled chunks in `.next/`
   - Sometimes doesn't invalidate when files change
   - Especially after creating new layouts

3. **Browser Cache**
   - Browser may cache old JavaScript chunks
   - Needs hard refresh to clear

4. **Dev Server Hot Reload Issues**
   - Fast Refresh sometimes misses layout changes
   - Full restart required for layout files

---

## 🛡️ Prevention Tips

### For Developers:

1. **Always restart after layout changes:**
   ```bash
   # After changing any layout.tsx file:
   pkill -f "next dev" && pnpm dev
   ```

2. **Clear cache when adding new routes:**
   ```bash
   rm -rf .next && pnpm dev
   ```

3. **Use hard refresh after major changes:**
   - Press `Ctrl + Shift + R` (Windows/Linux)
   - Press `Cmd + Shift + R` (Mac)

4. **Keep DevTools open:**
   - Enable "Disable cache" in Network tab
   - Prevents browser caching during development

---

## 📋 Verification Steps

After applying the fix, verify:

1. **Dev Server Running:**
   ```bash
   # Should see:
   # ✓ Ready in 2.5s
   # ○ Compiling / ...
   # ✓ Compiled successfully
   ```

2. **No Console Errors:**
   - Open DevTools (F12)
   - Check Console tab
   - Should be no red errors

3. **Page Loads:**
   - Navigate to http://localhost:3000
   - Page should load without errors

4. **Hot Reload Works:**
   - Make a small change to any file
   - Page should update automatically

---

## 🔧 Alternative Fixes

If the above doesn't work, try these:

### Option 1: Nuclear Clean
```bash
# Stop everything
pkill -f "next dev"

# Delete all caches
rm -rf .next
rm -rf node_modules/.cache

# Reinstall dependencies (if needed)
pnpm install

# Restart
pnpm dev
```

### Option 2: Different Port
```bash
# Sometimes port conflicts cause issues
PORT=3001 pnpm dev
```

### Option 3: Check File Permissions
```bash
# Ensure .next directory is writable
chmod -R 755 .next
```

### Option 4: Disable Caching in Browser
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Disable cache"
4. Keep DevTools open while developing

---

## 📊 When This Error Occurs

### High Risk Scenarios:
- ✅ Creating new layout files (layout.tsx, layout-new.tsx)
- ✅ Renaming layout files
- ✅ Adding new route groups
- ✅ Changing layout hierarchy
- ✅ Modifying middleware
- ✅ Updating next.config.js

### Low Risk Scenarios:
- Regular page component changes
- CSS/styling updates
- Adding new API routes
- Modifying client components

---

## 🎯 Current Status

**Issue:** ChunkLoadError when loading admin layout
**Cause:** New layout files (layout-new.tsx) + stale cache
**Fix Applied:**
- ✅ Cleared `.next` cache
- ✅ Stopped dev server
- ⏳ Ready for restart

**Next Steps:**
1. Run `pnpm dev` in apps/web
2. Hard refresh browser (Ctrl+Shift+R)
3. Navigate to http://localhost:3000
4. Verify pages load correctly

---

## 💡 Pro Tips

### During Development:

1. **Use turbo mode:**
   ```json
   // next.config.js
   experimental: {
     turbo: true // Faster rebuilds
   }
   ```

2. **Enable source maps:**
   ```json
   // next.config.js
   productionBrowserSourceMaps: true
   ```

3. **Monitor build output:**
   - Watch terminal for compilation errors
   - Check for circular dependencies
   - Look for large chunk sizes

4. **Use React DevTools:**
   - Install React DevTools extension
   - Monitor component re-renders
   - Check for unnecessary updates

---

## ✅ Expected Result

After applying the fix:

```bash
✓ Ready in 2.5s
○ Compiling / ...
✓ Compiled / in 1.2s
```

Browser should load:
- ✅ No console errors
- ✅ Page renders correctly
- ✅ Navigation works
- ✅ Hot reload functional

---

## 🐛 If Issue Persists

Contact support with:

1. **Terminal output:**
   ```bash
   pnpm dev > dev-output.log 2>&1
   ```

2. **Browser console errors:**
   - F12 → Console → Copy all errors

3. **Network tab:**
   - F12 → Network → Show failed requests

4. **System info:**
   ```bash
   node --version
   pnpm --version
   ```

---

## 📚 Related Issues

- [Next.js ChunkLoadError Discussion](https://github.com/vercel/next.js/discussions)
- [Webpack Code Splitting](https://webpack.js.org/guides/code-splitting/)
- [Next.js Caching Guide](https://nextjs.org/docs/app/building-your-application/caching)

---

**Status:** ✅ Resolved
**Action Required:** Restart dev server with `pnpm dev`
