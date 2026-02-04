# Business Rules Dependency Index

This index tracks dependencies on the `rules` package (`packages/rules`). If business logic in `rules` changes, these primary consumers should be verified.

## Source of Truth
- **Package Location**: [packages/rules](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/rules)
- **Primary Service**: [packages/rules/src/engine/RuleEngine.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/packages/rules/src/engine/RuleEngine.ts)

## Consumers

### apps/api
- [lib/ruleEngine.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/api/src/lib/ruleEngine.ts)
- [services/DealerService.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/api/src/services/DealerService.ts)
- [services/CartService.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/api/src/services/CartService.ts)
- [services/OrderService.ts](file:///c:/Users/ajran/.gemini/antigravity/scratch/hotbray-portal-phase1/apps/api/src/services/OrderService.ts)

## Internal Content Map
- **engine/**: Rule execution and context logic.
- **rules/**: Specific logic for Entitlements, Inventory, Orders, and Pricing.
- **validators/**: Schema and business data validation rules.
