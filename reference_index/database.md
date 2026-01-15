# Database Dependency Index

This index tracks all files and packages that depend on the Prisma Client or the `db` workspace. If you update `packages/db/prisma/schema.prisma`, all the following areas may need verification or updates.

## Source of Truth
- **Schema File**: [schema.prisma](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/db/prisma/schema.prisma)
- **Client Definition**: [packages/db/src/index.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/db/src/index.ts)

## Consumers by Package

### apps/api
- [index.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/api/src/index.ts)
- [server.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/api/src/server.ts)
- [routes/admin.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/api/src/routes/admin.ts)
- [routes/auth.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/api/src/routes/auth.ts)
- [routes/dealer.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/api/src/routes/dealer.ts)
- [services/OrderService.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/api/src/services/OrderService.ts)
- [services/DealerService.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/api/src/services/DealerService.ts)
- [services/CartService.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/api/src/services/CartService.ts)
- [lib/services.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/api/src/lib/services.ts)
- [lib/ruleEngine.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/api/src/lib/ruleEngine.ts)

### apps/web
- [app/admin/orders/page.tsx](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/web/src/app/admin/orders/page.tsx)
- [app/dealer/orders/page.tsx](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/web/src/app/dealer/orders/page.tsx)
- [app/dealer/backorders/page.tsx](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/web/src/app/dealer/backorders/page.tsx)
- [lib/prisma.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/web/src/lib/prisma.ts)
- [services/OrderEngine.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/web/src/services/OrderEngine.ts)

### apps/worker
- [importProducts.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/worker/src/importProducts.ts)
- [importBackorders.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/worker/src/importBackorders.ts)

### apps/api-experience
- [index.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/api-experience/src/index.ts)

### packages/rules
- [engine/RuleEngine.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/rules/src/engine/RuleEngine.ts)
- [engine/RuleContext.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/rules/src/engine/RuleContext.ts)
- [PricingService.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/rules/src/PricingService.ts)
- [rules/PricingRules.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/rules/src/rules/PricingRules.ts)
- [rules/OrderRules.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/rules/src/rules/OrderRules.ts)
- [rules/InventoryRules.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/rules/src/rules/InventoryRules.ts)
- [rules/EntitlementRules.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/rules/src/rules/EntitlementRules.ts)
- [validators/DealerValidator.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/rules/src/validators/DealerValidator.ts)
- [validators/OrderValidator.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/rules/src/validators/OrderValidator.ts)
- [validators/ProductValidator.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/rules/src/validators/ProductValidator.ts)
- [types.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/rules/src/types.ts)

### Domain Packages (packages/domain-*)
- [domain-admin/src/AdminService.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/domain-admin/src/AdminService.ts)
- [domain-auth/src/AuthService.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/domain-auth/src/AuthService.ts)
- [domain-orders/src/OrderService.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/domain-orders/src/OrderService.ts)
- [domain-partners/src/PartnerService.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/domain-partners/src/PartnerService.ts)
- [domain-pricing/src/PricingService.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/domain-pricing/src/PricingService.ts)

### packages/shared
- [src/email.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/shared/src/email.ts)

### Scripts & Utilities
- [packages/db/seed-products.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/db/seed-products.ts)
- [packages/db/prisma/seed.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/db/prisma/seed.ts)
- [packages/db/prisma/seed-sample-data.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/db/prisma/seed-sample-data.ts)
- [packages/db/scripts/createTestUsers.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/db/scripts/createTestUsers.ts)
- [scripts/verifyImports.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/scripts/verifyImports.ts)
