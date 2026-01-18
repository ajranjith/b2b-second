# Phase 1 LLD — Data + Imports + Testable End-to-End

## Goals
- Additive-only data model for catalogue, pricing, stock, dealer tiers, supersessions, special pricing.
- Admin programmatic imports for catalogue + dealers.
- UI uploads for supersessions + special price.
- Preserve existing portal data rendering and links.
- UPSERT-only imports (no truncate/drop/wipe).
- Order line price snapshots remain immutable.

## Non-negotiable constraints
- No deletions/renames of existing tables, columns, endpoints, routes, or UI bindings.
- All changes are additive and applied via migrations.
- All imports are UPSERTs.
- Historical orders must never be repriced. Order lines already snapshot unit prices.

## Inputs (Phase 0)
- Catalogue + pricing + stock: `/mnt/data/DGS_Sample_150_GN_ES_BR.xlsx`
- Dealers + tiers: `/mnt/data/Dealer_Accounts_Sample_30_NetTiers.xlsx`
- Supersessions (UI upload): `/mnt/data/Supercessions Master Kerridge.xlsx`
- Special price (UI upload): `/mnt/data/Aftermarket_ES_10_DiscountPrice_4cols.xlsx`

## Current baseline (existing)
- Products + price bands + stock are stored in:
  - `Product`, `ProductPriceBand`, `ProductPriceReference`, `ProductStock`.
- Dealer pricing uses `DealerBandAssignment` + `ProductPriceBand`.
- Order snapshots already stored in `OrderLine` (`unitPriceSnapshot`, `bandCodeSnapshot`, etc.).
- Import batch tracking exists in `ImportBatch` + `ImportError` + staging tables.
- Admin UI has an import management view but upload handler is placeholder.

## Data model changes (additive)
1. Dealer net tiers
   - Add a new table `DealerNetTier`:
     - `dealerAccountId` (FK), `tierCode` (NET1..NET7), `value` (Decimal), `updatedAt`.
     - Unique index `(dealerAccountId, tierCode)`.
   - Rationale: keeps `DealerAccount` stable, supports future tier logic without modifying existing columns.

2. Supersession import staging + uniqueness
   - Add `StgSupersessionRow` with `(batchId, rowNumber, originalPartCode, replacementPartCode, note, isValid, validationErrors, rawRowJson)`.
   - Add unique index on `Supersession` for `(originalPartCode, replacementPartCode)`.

3. Special pricing
   - Add `SpecialPrice`:
     - `id`, `productCode`, `partType`, `price`, `currency`, `startsAt`, `endsAt`, `isActive`.
     - Optional `dealerAccountId` for dealer-specific overrides.
     - Optional `sourceImportBatchId`.
   - Add `StgSpecialPriceRow` for validation and import tracking.

4. Import types
   - Extend `ImportType` enum: `DEALERS`, `SUPERSESSIONS`, `SPECIAL_PRICES`, `PRODUCTS_MIXED`.

## Import flows

### 1) Catalogue + pricing + stock (programmatic admin import)
Input: `DGS_Sample_150_GN_ES_BR.xlsx`

Strategy:
- New worker: `apps/worker/src/importProductsMixed.ts`
- Detect part type per row via a dedicated column (e.g., `Part Type`) or fallback rules:
  - If file has a `Part Type` column, map values to `PartType` enum.
  - If not present, allow `--type` override to import as a single part type.
- Use UPSERTs:
  - `Product` by `productCode`
  - `ProductStock` by `productId`
  - `ProductPriceReference` by `productId`
  - `ProductPriceBand` by `(productId, bandCode)`
- Insert into `StgProductPriceRow` for audit.

Admin trigger:
- New endpoint `POST /admin/imports/run` with `importType=PRODUCTS_MIXED` and `filePath`.
  - Validates file, creates `ImportBatch`, triggers worker.

### 2) Dealer accounts + net tiers (programmatic admin import)
Input: `Dealer_Accounts_Sample_30_NetTiers.xlsx`

Strategy:
- New worker: `apps/worker/src/importDealers.ts`
- UPSERT logic:
  - `DealerAccount` by `accountNo`
  - `DealerNetTier` by `(dealerAccountId, tierCode)`
  - `DealerBandAssignment` remains default (no change unless required by input).
- Staging: `StgDealerAccountRow`.

Admin trigger:
- `POST /admin/imports/run` with `importType=DEALERS` and `filePath`.

### 3) Supersessions (UI upload)
Input: `Supercessions Master Kerridge.xlsx`

Strategy:
- UI uploads to `POST /admin/imports/upload` with `importType=SUPERSESSIONS`.
- API writes file to `infra/uploads/imports`, creates `ImportBatch`.
- Worker `importSupersessions.ts`:
  - Validate each row, record `StgSupersessionRow`.
  - UPSERT `Supersession` by `(originalPartCode, replacementPartCode)`.

### 4) Special price (UI upload)
Input: `Aftermarket_ES_10_DiscountPrice_4cols.xlsx`

Strategy:
- UI uploads to `POST /admin/imports/upload` with `importType=SPECIAL_PRICES`.
- Worker `importSpecialPrices.ts`:
  - Validate row fields (productCode, price, partType, currency or defaults).
  - UPSERT `SpecialPrice` by `(productCode, dealerAccountId?, startsAt, endsAt)`.
  - `isActive` set based on date range.

## Pricing logic (additive)
- Update pricing rules to check `SpecialPrice` first:
  1) If dealer-specific special price active, use it.
  2) Else if global special price active for part type, use it.
  3) Else use existing band pricing.
- Always snapshot chosen price to `OrderLine.unitPriceSnapshot`.

## Admin UI updates (additive)
- Replace placeholder import handler with real `POST /admin/imports/upload`.
- Add import types to dropdown: Dealers, Supersessions, Special Prices, Products Mixed.
- Show status + error counts from `ImportBatch`.
- Links to errors via `GET /admin/imports/:id/errors`.

## API endpoints (additive)
- `POST /admin/imports/run` (programmatic, file path).
- `POST /admin/imports/upload` (multipart, file upload).
- `GET /admin/imports` list.
- `GET /admin/imports/:id` details.
- `GET /admin/imports/:id/errors` error list.

## E2E test plan (testable)
1) Programmatic import — products
   - Run `POST /admin/imports/run` with `DGS_Sample_150_GN_ES_BR.xlsx`.
   - Verify products, bands, stock rows count matches rows.
2) Programmatic import — dealers
   - Run `POST /admin/imports/run` with `Dealer_Accounts_Sample_30_NetTiers.xlsx`.
   - Verify `DealerAccount` + `DealerNetTier` counts.
3) UI upload — supersessions
   - Upload file in Admin > Imports.
   - Verify `Supersession` rows created and searchable by original part code.
4) UI upload — special prices
   - Upload file in Admin > Imports.
   - Verify `SpecialPrice` used in pricing (dealer search page).
5) Checkout snapshot
   - Place order and verify `OrderLine.unitPriceSnapshot` is persisted.
   - Update product price or special price, ensure historical order not repriced.

## Risks / open questions
- Sample file columns for `DGS_Sample_150_GN_ES_BR.xlsx` and `Aftermarket_ES_10_DiscountPrice_4cols.xlsx` are not yet validated locally.
- Need confirmation of part type mapping for mixed catalogue file.
- Special price applicability (dealer-specific vs global) depends on file columns.

## Implementation checklist
- [ ] Add new tables and enums via Prisma migration.
- [ ] Add staging tables and UPSERT import workers.
- [ ] Add `POST /admin/imports/run` to API.
- [ ] Wire admin UI to real upload endpoint.
- [ ] Update pricing rules to include special price.
- [ ] Update tests and import verification scripts.
