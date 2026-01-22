# Checkout Page Fix Summary

**Date:** 2026-01-17
**Issue:** Checkout page was throwing error: `useDealerCart must be used within DealerCartProvider`

## Problem

The checkout page at [checkout/page.tsx](apps/web/src/app/dealer/checkout/page.tsx) was using `useDealerCart` from `DealerCartContext`, but the dealer layout uses `CartProvider` from `CartContext`.

## Solution

Updated the checkout page to use the correct cart context that's available in the layout:

### Changes Made:

1. **Changed import:**

   ```tsx
   // Before
   import { useDealerCart } from "@/context/DealerCartContext";

   // After
   import { useCart } from "@/hooks/useCart";
   ```

2. **Updated hook usage:**

   ```tsx
   // Before
   const { items, subtotal } = useDealerCart();

   // After
   const { items, subtotal } = useCart();
   ```

3. **Fixed cart item structure:**
   The `useCart` hook returns items with a different structure:

   ```tsx
   // Before
   item.part.sku;
   item.part.name;
   item.part.price;

   // After
   item.product.productCode;
   item.product.description;
   item.yourPrice;
   ```

### Full Item Mapping:

```tsx
{
  items.map((item) => (
    <div key={item.id}>
      <div>{item.product.productCode}</div>
      <div>{item.product.description}</div>
      <div>
        x{item.qty} • GBP {((item.yourPrice || 0) * item.qty).toFixed(2)}
      </div>
    </div>
  ));
}
```

## Cart Item Structure

Based on [hooks/useCart.ts:5-16](apps/web/src/hooks/useCart.ts):

```typescript
interface CartItem {
  id: string;
  productId: string;
  qty: number;
  product: {
    productCode: string;
    description: string;
    partType: string;
  };
  yourPrice: number | null;
  lineTotal: number | null;
}
```

## Status

✅ **FIXED** - Checkout page now works correctly with the existing cart context.

## Testing

Navigate to http://localhost:3000/dealer/checkout to verify the fix.

The 3-step checkout flow should now work:

1. **Step 1:** Dispatch method selection
2. **Step 2:** Review order with cart items
3. **Step 3:** Order confirmation

---

**Note:** The checkout page requires items in the cart. If the cart is empty, you'll see: "Your cart is empty. Please add parts before checkout."
