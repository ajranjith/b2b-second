-- =====================================================
-- MIGRATION: Add Database Triggers for Auto-Validation
-- =====================================================

-- TRIGGER 1: Auto-create band assignments when dealer is created
-- =====================================================
-- This solves your "missing band assignments" problem!

CREATE OR REPLACE FUNCTION create_default_band_assignments()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create bands for SHOW_ALL entitlement
  -- (Other entitlements handled by application)
  IF NEW.entitlement = 'SHOW_ALL' THEN
    INSERT INTO "DealerBandAssignment" (id, "dealerAccountId", "partType", "bandCode", "updatedAt")
    VALUES 
      (gen_random_uuid(), NEW.id, 'GENUINE', '1', NOW()),
      (gen_random_uuid(), NEW.id, 'AFTERMARKET', '2', NOW()),
      (gen_random_uuid(), NEW.id, 'BRANDED', '3', NOW())
    ON CONFLICT ("dealerAccountId", "partType") DO NOTHING;
  ELSIF NEW.entitlement = 'GENUINE_ONLY' THEN
    INSERT INTO "DealerBandAssignment" (id, "dealerAccountId", "partType", "bandCode", "updatedAt")
    VALUES (gen_random_uuid(), NEW.id, 'GENUINE', '1', NOW())
    ON CONFLICT ("dealerAccountId", "partType") DO NOTHING;
  ELSIF NEW.entitlement = 'AFTERMARKET_ONLY' THEN
    INSERT INTO "DealerBandAssignment" (id, "dealerAccountId", "partType", "bandCode", "updatedAt")
    VALUES 
      (gen_random_uuid(), NEW.id, 'AFTERMARKET', '2', NOW()),
      (gen_random_uuid(), NEW.id, 'BRANDED', '3', NOW())
    ON CONFLICT ("dealerAccountId", "partType") DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for re-running migration)
DROP TRIGGER IF EXISTS ensure_band_assignments_on_dealer_create ON "DealerAccount";

-- Create trigger
CREATE TRIGGER ensure_band_assignments_on_dealer_create
AFTER INSERT ON "DealerAccount"
FOR EACH ROW
EXECUTE FUNCTION create_default_band_assignments();

-- =====================================================
-- TRIGGER 2: Update band assignments when entitlement changes
-- =====================================================

CREATE OR REPLACE FUNCTION validate_entitlement_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When entitlement changes, ensure proper bands exist
  IF NEW.entitlement != OLD.entitlement THEN
    
    -- Delete bands that don't match new entitlement
    IF NEW.entitlement = 'GENUINE_ONLY' THEN
      DELETE FROM "DealerBandAssignment" 
      WHERE "dealerAccountId" = NEW.id 
        AND "partType" IN ('AFTERMARKET', 'BRANDED');
    ELSIF NEW.entitlement = 'AFTERMARKET_ONLY' THEN
      DELETE FROM "DealerBandAssignment" 
      WHERE "dealerAccountId" = NEW.id 
        AND "partType" = 'GENUINE';
    END IF;
    
    -- Create missing bands for new entitlement
    IF NEW.entitlement = 'SHOW_ALL' OR NEW.entitlement = 'GENUINE_ONLY' THEN
      INSERT INTO "DealerBandAssignment" (id, "dealerAccountId", "partType", "bandCode", "updatedAt")
      VALUES (gen_random_uuid(), NEW.id, 'GENUINE', '1', NOW())
      ON CONFLICT ("dealerAccountId", "partType") DO NOTHING;
    END IF;
    
    IF NEW.entitlement = 'SHOW_ALL' OR NEW.entitlement = 'AFTERMARKET_ONLY' THEN
      INSERT INTO "DealerBandAssignment" (id, "dealerAccountId", "partType", "bandCode", "updatedAt")
      VALUES 
        (gen_random_uuid(), NEW.id, 'AFTERMARKET', '2', NOW()),
        (gen_random_uuid(), NEW.id, 'BRANDED', '3', NOW())
      ON CONFLICT ("dealerAccountId", "partType") DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_entitlement_bands ON "DealerAccount";

CREATE TRIGGER enforce_entitlement_bands
AFTER UPDATE OF entitlement ON "DealerAccount"
FOR EACH ROW
EXECUTE FUNCTION validate_entitlement_change();

-- =====================================================
-- TRIGGER 3: Prevent modification of shipped/cancelled orders
-- =====================================================

CREATE OR REPLACE FUNCTION prevent_shipped_order_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IN ('SHIPPED', 'CANCELLED') THEN
    RAISE EXCEPTION 'Cannot modify order in % status', OLD.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_shipped_orders ON "OrderHeader";

CREATE TRIGGER protect_shipped_orders
BEFORE UPDATE ON "OrderHeader"
FOR EACH ROW
WHEN (OLD.status IN ('SHIPPED', 'CANCELLED'))
EXECUTE FUNCTION prevent_shipped_order_changes();

-- =====================================================
-- TRIGGER 4: Auto-update timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to DealerBandAssignment (as backup to Prisma)
DROP TRIGGER IF EXISTS update_dealerbandassingment_timestamp ON "DealerBandAssignment";

CREATE TRIGGER update_dealerbandassingment_timestamp
BEFORE UPDATE ON "DealerBandAssignment"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 
    'Triggers Created: ' || COUNT(*)::text as result
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
  AND (trigger_name LIKE '%band%' OR trigger_name LIKE '%order%');
