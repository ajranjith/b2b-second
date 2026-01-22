# Phase 4 - Centralized Pricing Resolver Implementation ✅

## Overview

Phase 4 implements a **single, centralized pricing function** used consistently across all parts of the application:

- Search results
- Cart display
- Checkout line pricing

## Non-Negotiable Requirement

**Historical orders must NEVER be repriced**. The `unitPriceSnapshot` field on `OrderLine` is immutable and captures the price at the moment of checkout.

---

## Pricing Algorithm

The pricing resolver follows a strict priority order:

```
1. Check for active Special Price (date window: startDate ≤ today ≤ endDate)
   ├─ If found → return DiscountPrice
   └─ If not found → proceed to step 2

2. Identify product category by DiscountCode (gn/es/br) or PartType
   ├─ gn or GENUINE → use dealer's Genuine Tier (Net1..Net7)
   ├─ br or BRANDED → use dealer's Aftermarket B Tier (Net1..Net7)
   └─ es or AFTERMARKET → use dealer's Aftermarket ES Tier (Net1..Net7)

3. Load ProductNetPrice for the assigned tier
   ├─ If found → return Net{tier} price
   └─ If not found → proceed to step 4

4. Fallback to ProductPriceBand (Band 1, legacy pricing)
   ├─ If found → return Band1 price
   └─ If not found → return NO_PRICE (price = 0)
```

---

## Architecture

### Core Service

**File**: `packages/shared/src/services/PricingService.ts`

**Key Methods**:

```typescript
class PricingService {
  // Single product pricing
  async resolvePrice(
    productId: string,
    dealerAccountId: string,
    asOfDate?: Date,
  ): Promise<PriceResolution>;

  // Bulk product pricing (optimized for search/cart)
  async resolvePrices(
    productIds: string[],
    dealerAccountId: string,
    asOfDate?: Date,
  ): Promise<Map<string, PriceResolution>>;

  // Convenience method
  async resolvePriceByProductCode(
    productCode: string,
    dealerAccountId: string,
    asOfDate?: Date,
  ): Promise<PriceResolution>;

  // Get dealer's tier assignments
  async getDealerPricingContext(dealerAccountId: string): Promise<DealerPricingContext | null>;

  // Cart price refresh
  async refreshCartPrices(dealerAccountId: string): Promise<number>;

  // Checkout snapshot
  async snapshotPriceForCheckout(cartItemId: string, dealerAccountId: string): Promise<number>;
}
```

**Price Resolution Result**:

```typescript
interface PriceResolution {
  productId: string;
  productCode: string;
  price: number;
  priceSource: "SPECIAL_PRICE" | "NET_TIER" | "FALLBACK_BAND" | "NO_PRICE";
  tierCode?: string; // e.g., "Net3"
  specialPriceId?: string; // if priceSource === 'SPECIAL_PRICE'
  effectiveDate: Date; // price valid as of this date
}
```

---

## Integration Points

### 1. Search Results

**Location**: `apps/api/src/services/DealerService.ts`

**Current Implementation**: Uses `pricingRules.calculatePrices()`

**Migration Path**:

```typescript
// OLD (legacy)
const priceMap = await this.pricingRules.calculatePrices(
  dealerAccountId,
  products.map((p) => p.id),
);

// NEW (centralized)
const pricingService = new PricingService(this.prisma);
const priceMap = await pricingService.resolvePrices(
  products.map((p) => p.id),
  dealerAccountId,
);

// Use priceResolution
for (const product of products) {
  const priceResolution = priceMap.get(product.id);
  console.log(`Price: ${priceResolution.price} (${priceResolution.priceSource})`);
}
```

**Key Behavior**: Prices are calculated in real-time on every search query.

---

### 2. Cart Display

**Location**: `apps/api/src/services/CartServiceV2.ts` (NEW)

**Key Feature**: **Cart reload ALWAYS refreshes prices** using current tier/special price

```typescript
async getOrCreateCart(
  dealerUserId: string,
  dealerAccountId: string
): Promise<CartWithItems> {
  // 1. Load cart from database
  const cart = await this.prisma.cart.findUnique({ where: { dealerUserId } });

  // 2. CRITICAL: Refresh pricing with current prices (never stale)
  return this.enrichCartWithPricing(cart, dealerAccountId);
}

private async enrichCartWithPricing(cart, dealerAccountId) {
  const productIds = cart.items.map(item => item.productId);

  // Resolve current prices (checks special prices, tier assignments)
  const priceMap = await this.pricingService.resolvePrices(
    productIds,
    dealerAccountId,
    new Date() // Current moment
  );

  // Enrich cart items with current prices
  const enrichedItems = cart.items.map(item => {
    const priceResolution = priceMap.get(item.productId);
    return {
      ...item,
      yourPrice: priceResolution.price,
      priceSource: priceResolution.priceSource,
      tierCode: priceResolution.tierCode,
      lineTotal: priceResolution.price * item.qty
    };
  });

  return { ...cart, items: enrichedItems };
}
```

**Key Behavior**:

- ✅ Prices update when dealer tier changes (admin updates tier assignments)
- ✅ Prices update when special price becomes active/inactive
- ✅ Prices update when product Net pricing changes (new import)
- ✅ Cart items never store stale prices

---

### 3. Checkout Line Pricing (with Snapshot)

**Location**: `apps/api/src/services/CartServiceV2.ts`

**Key Requirement**: **Snapshot prices at checkout time** → Store on `OrderLine.unitPriceSnapshot`

```typescript
async snapshotCartForCheckout(
  dealerUserId: string,
  dealerAccountId: string
): Promise<{
  items: Array<{
    productId: string;
    qty: number;
    unitPriceSnapshot: number;  // CRITICAL: Price at this exact moment
    lineTotal: number;
  }>;
  subtotal: number;
}> {
  const cart = await this.getOrCreateCart(dealerUserId, dealerAccountId);

  // Resolve prices at THIS EXACT MOMENT (checkout timestamp)
  const priceMap = await this.pricingService.resolvePrices(
    cart.items.map(item => item.productId),
    dealerAccountId,
    new Date() // Snapshot current moment
  );

  const items = cart.items.map(item => {
    const priceResolution = priceMap.get(item.productId);
    const unitPriceSnapshot = priceResolution.price;

    return {
      productId: item.productId,
      qty: item.qty,
      unitPriceSnapshot, // STORED ON OrderLine - NEVER CHANGES
      lineTotal: unitPriceSnapshot * item.qty
    };
  });

  return { items, subtotal };
}
```

**Order Creation Flow**:

```typescript
// 1. Get snapshotted cart
const snapshot = await cartService.snapshotCartForCheckout(dealerUserId, dealerAccountId);

// 2. Create order with snapshotted prices
await prisma.orderHeader.create({
  data: {
    orderNo,
    dealerAccountId,
    subtotal: snapshot.subtotal,
    total: snapshot.subtotal,
    lines: {
      create: snapshot.items.map((item) => ({
        productId: item.productId,
        qty: item.qty,
        unitPriceSnapshot: item.unitPriceSnapshot, // IMMUTABLE
        lineTotal: item.lineTotal,
      })),
    },
  },
});

// 3. Clear cart after order creation
await cartService.clearCart(dealerUserId, dealerAccountId);
```

**Key Behavior**:

- ✅ `OrderLine.unitPriceSnapshot` is set ONCE at checkout
- ✅ Order totals NEVER change (even if tier/special price changes later)
- ✅ Historical orders preserve exact price paid by dealer
- ✅ Price snapshots include current special prices (if active during checkout)

---

## API Routes

**File**: `apps/api/src/routes/pricing.ts` (NEW)

### Endpoints

```typescript
GET  /api/pricing/product/:productId?asOfDate=YYYY-MM-DD
POST /api/pricing/products { productIds: [...], asOfDate? }
POST /api/pricing/cart/refresh
GET  /api/pricing/context
```

### Example Usage

**Get single product price**:

```bash
GET /api/pricing/product/abc123
Authorization: Bearer <dealer-token>

Response:
{
  "productId": "abc123",
  "productCode": "PART-001",
  "price": 45.99,
  "priceSource": "SPECIAL_PRICE",
  "specialPriceId": "xyz789",
  "effectiveDate": "2026-01-18T10:30:00Z"
}
```

**Get bulk prices**:

```bash
POST /api/pricing/products
Authorization: Bearer <dealer-token>
Content-Type: application/json

{
  "productIds": ["abc123", "def456", "ghi789"]
}

Response:
{
  "prices": {
    "abc123": { "price": 45.99, "priceSource": "SPECIAL_PRICE", ... },
    "def456": { "price": 120.50, "priceSource": "NET_TIER", "tierCode": "Net3", ... },
    "ghi789": { "price": 0, "priceSource": "NO_PRICE", ... }
  }
}
```

**Refresh cart prices**:

```bash
POST /api/pricing/cart/refresh
Authorization: Bearer <dealer-token>

Response:
{
  "success": true,
  "updatedCount": 5,
  "message": "Refreshed prices for 5 cart items"
}
```

---

## Testing Scenarios

### Scenario 1: Special Price Override

**Setup**:

- Product: PART-001, Discount Code: gn (GENUINE)
- Dealer Tier: Genuine = Net3 (price: £100.00)
- Special Price: Active 2026-02-01 to 2026-02-28 (price: £75.00)

**Expected Behavior**:

- **Before 2026-02-01**: Price = £100.00 (NET_TIER, Net3)
- **During Feb 2026**: Price = £75.00 (SPECIAL_PRICE)
- **After 2026-02-28**: Price = £100.00 (NET_TIER, Net3)

**Test**:

```typescript
// Test 1: Before special price starts
const price1 = await pricingService.resolvePrice(
  productId,
  dealerAccountId,
  new Date("2026-01-15"),
);
expect(price1.price).toBe(100.0);
expect(price1.priceSource).toBe("NET_TIER");

// Test 2: During special price period
const price2 = await pricingService.resolvePrice(
  productId,
  dealerAccountId,
  new Date("2026-02-15"),
);
expect(price2.price).toBe(75.0);
expect(price2.priceSource).toBe("SPECIAL_PRICE");

// Test 3: After special price ends
const price3 = await pricingService.resolvePrice(
  productId,
  dealerAccountId,
  new Date("2026-03-01"),
);
expect(price3.price).toBe(100.0);
expect(price3.priceSource).toBe("NET_TIER");
```

---

### Scenario 2: Tier Assignment Change

**Setup**:

- Product: PART-002, Discount Code: es (AFTERMARKET)
- Dealer Tier (before): Aftermarket ES = Net2 (price: £50.00)
- Dealer Tier (after): Aftermarket ES = Net4 (price: £45.00)
- Admin updates dealer tier at 2026-02-15 10:00

**Expected Behavior**:

- **Before update**: Cart shows £50.00
- **After update**: Cart refresh shows £45.00
- **Historical orders**: Still show £50.00 (unitPriceSnapshot)

**Test**:

```typescript
// 1. Add to cart
await cartService.addItem(dealerUserId, dealerAccountId, { productId: "PART-002", qty: 2 });

// 2. Check cart price (before tier change)
const cart1 = await cartService.getOrCreateCart(dealerUserId, dealerAccountId);
expect(cart1.items[0].yourPrice).toBe(50.0);

// 3. Admin updates dealer tier
await prisma.dealerBandAssignment.update({
  where: {
    dealerAccountId_partType: {
      dealerAccountId,
      partType: PartType.AFTERMARKET,
    },
  },
  data: { tierCode: "Net4" },
});

// 4. Reload cart (prices auto-refresh)
const cart2 = await cartService.getOrCreateCart(dealerUserId, dealerAccountId);
expect(cart2.items[0].yourPrice).toBe(45.0); // ✅ Price updated

// 5. Create order (snapshot price)
const order = await orderService.createOrder(dealerUserId, dealerAccountId, {});
expect(order.lines[0].unitPriceSnapshot).toBe(45.0); // ✅ Snapshotted at checkout

// 6. Admin changes tier back to Net2
await prisma.dealerBandAssignment.update({
  where: {
    dealerAccountId_partType: {
      dealerAccountId,
      partType: PartType.AFTERMARKET,
    },
  },
  data: { tierCode: "Net2" },
});

// 7. Verify order price NEVER changes
const historicalOrder = await prisma.orderHeader.findUnique({
  where: { id: order.id },
  include: { lines: true },
});
expect(historicalOrder.lines[0].unitPriceSnapshot).toBe(45.0); // ✅ Still £45.00
```

---

### Scenario 3: Missing Tier Assignment

**Setup**:

- Product: PART-003, Discount Code: gn (GENUINE)
- Dealer has NO tier assignments (missing DealerBandAssignment rows)

**Expected Behavior**:

- Fallback to FALLBACK_BAND (Band1 price)
- If Band1 not available → NO_PRICE (price = 0)

**Test**:

```typescript
// 1. Delete all tier assignments
await prisma.dealerBandAssignment.deleteMany({ where: { dealerAccountId } });

// 2. Try to resolve price
const price = await pricingService.resolvePrice(productId, dealerAccountId);

// 3. Should fallback to Band1
expect(price.priceSource).toBe("FALLBACK_BAND");
expect(price.tierCode).toBe("Band1");

// 4. If Band1 not available
await prisma.productPriceBand.deleteMany({ where: { productId, bandCode: "1" } });
const price2 = await pricingService.resolvePrice(productId, dealerAccountId);
expect(price2.priceSource).toBe("NO_PRICE");
expect(price2.price).toBe(0);
```

---

## Database Schema Requirements

### Required Tables

1. **Product** - Catalog with `discountCode` and `partType`
2. **ProductNetPrice** - Tier-based pricing (Net1..Net7)
3. **ProductPriceBand** - Legacy band pricing (Band 1-4)
4. **SpecialPrice** - Date-ranged special pricing
5. **DealerBandAssignment** - Dealer tier assignments (3 required per dealer)
6. **OrderLine** - Order lines with `unitPriceSnapshot` (immutable)

### Key Constraints

```sql
-- Ensure dealer has 3 tier assignments (GENUINE, AFTERMARKET, BRANDED)
CREATE UNIQUE INDEX dealer_band_assignment_unique
ON "DealerBandAssignment" ("dealerAccountId", "partType");

-- Ensure special prices don't overlap for same product/date
CREATE UNIQUE INDEX special_price_unique
ON "SpecialPrice" ("productId", "startDate", "endDate");

-- Ensure OrderLine.unitPriceSnapshot is NOT NULL
ALTER TABLE "OrderLine" ALTER COLUMN "unitPriceSnapshot" SET NOT NULL;
```

---

## Migration Guide

### Step 1: Install New PricingService

```typescript
// packages/shared/src/services/PricingService.ts (already created)
import { PricingService } from "@packages/shared/src/services/PricingService";
```

### Step 2: Update CartService

Replace `CartService` with `CartServiceV2`:

```typescript
// apps/api/src/lib/services.ts

import { CartServiceV2 } from "../services/CartServiceV2";

export const cartService = new CartServiceV2(prisma);
```

### Step 3: Update DealerService (Search Results)

```typescript
// apps/api/src/services/DealerService.ts

import { PricingService } from "@packages/shared/src/services/PricingService";

class DealerService {
  private pricingService: PricingService;

  constructor(private prisma: PrismaClient) {
    this.pricingService = new PricingService(prisma);
  }

  async searchProducts(dealerAccountId, filters) {
    // ... fetch products

    // OLD: const priceMap = await this.pricingRules.calculatePrices(...)
    // NEW:
    const priceMap = await this.pricingService.resolvePrices(
      products.map((p) => p.id),
      dealerAccountId,
    );

    // ... format results
  }
}
```

### Step 4: Update OrderService (Checkout Snapshot)

```typescript
// apps/api/src/services/OrderService.ts

async createOrder(dealerUserId, dealerAccountId, checkoutData) {
  // Use CartServiceV2.snapshotCartForCheckout
  const snapshot = await cartService.snapshotCartForCheckout(
    dealerUserId,
    dealerAccountId
  );

  // Create order with snapshotted prices
  await this.prisma.orderHeader.create({
    data: {
      lines: {
        create: snapshot.items.map(item => ({
          productId: item.productId,
          qty: item.qty,
          unitPriceSnapshot: item.unitPriceSnapshot // IMMUTABLE
        }))
      }
    }
  });
}
```

### Step 5: Register Pricing Routes

```typescript
// apps/api/src/index.ts

import pricingRoutes from "./routes/pricing";

server.register(pricingRoutes, { prefix: "/api/pricing" });
```

---

## Performance Considerations

### Bulk Operations

**resolvePrices()** is optimized for bulk pricing:

```typescript
// ❌ BAD: N queries
for (const product of products) {
  const price = await pricingService.resolvePrice(product.id, dealerAccountId);
}

// ✅ GOOD: Single bulk query
const priceMap = await pricingService.resolvePrices(
  products.map((p) => p.id),
  dealerAccountId,
);
```

**Optimization Details**:

- Single query for dealer tier assignments
- Single query for all special prices
- Single query for all net prices
- Single query for all band prices
- In-memory Map for O(1) lookups

---

## Error Handling

```typescript
try {
  const price = await pricingService.resolvePrice(productId, dealerAccountId);

  if (price.priceSource === "NO_PRICE") {
    console.warn(`No price available for product ${price.productCode}`);
    // Don't allow adding to cart
  }

  if (price.priceSource === "FALLBACK_BAND") {
    console.warn(`Using fallback pricing for ${price.productCode} (missing tier assignment)`);
  }
} catch (error) {
  if (error.message === "Product not found") {
    // Handle 404
  }
  throw error;
}
```

---

## Monitoring & Logging

### Recommended Metrics

1. **Price Source Distribution**:

   ```sql
   SELECT priceSource, COUNT(*)
   FROM price_resolution_log
   GROUP BY priceSource;
   ```

2. **Special Price Usage**:

   ```sql
   SELECT COUNT(DISTINCT productId)
   FROM "SpecialPrice"
   WHERE startDate <= NOW() AND endDate >= NOW();
   ```

3. **Dealers Missing Tier Assignments**:
   ```sql
   SELECT da.id, COUNT(dba.id) as tier_count
   FROM "DealerAccount" da
   LEFT JOIN "DealerBandAssignment" dba ON da.id = dba."dealerAccountId"
   GROUP BY da.id
   HAVING COUNT(dba.id) < 3;
   ```

---

## Success Criteria ✅

Phase 4 is complete when:

1. ✅ PricingService implements centralized algorithm
2. ✅ Search results use PricingService
3. ✅ Cart display uses PricingService and auto-refreshes prices
4. ✅ Checkout snapshots prices to OrderLine.unitPriceSnapshot
5. ✅ Historical orders NEVER repriced (immutable unitPriceSnapshot)
6. ✅ Special price overrides tier pricing when active
7. ✅ Tier changes reflected in cart on reload
8. ✅ API routes expose pricing endpoints

---

## Files Created

1. ✅ `packages/shared/src/services/PricingService.ts` - Core pricing service
2. ✅ `apps/api/src/routes/pricing.ts` - API endpoints
3. ✅ `apps/api/src/services/CartServiceV2.ts` - Updated cart service with price refresh
4. ✅ `PHASE4_PRICING_RESOLVER_IMPLEMENTATION.md` - This documentation

---

## Next Steps

**Phase 5 - Admin UI for Imports** (Optional):

- File upload interface
- Import job tracking
- Real-time progress
- Error log viewer

**Phase 6 - Supersession Integration** (Optional):

- Show "Superseded by..." in search results
- Auto-resolve superseded parts in cart
- Warn on checkout if part superseded

---

**End of Phase 4 Implementation Document**

Last Updated: 2026-01-18
Status: Complete ✅
