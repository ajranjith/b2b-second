-- Trigger 1: Auto-create band assignments when dealer is created
CREATE OR REPLACE FUNCTION create_default_band_assignments()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create bands for SHOW_ALL dealers (others handled by application)
  IF NEW.entitlement = 'SHOW_ALL' THEN
    INSERT INTO "DealerBandAssignment" (id, "dealerAccountId", "partType", "bandCode", "updatedAt")
    VALUES 
      (gen_random_uuid(), NEW.id, 'GENUINE', '1', NOW()),
      (gen_random_uuid(), NEW.id, 'AFTERMARKET', '2', NOW()),
      (gen_random_uuid(), NEW.id, 'BRANDED', '3', NOW())
    ON CONFLICT ("dealerAccountId", "partType") DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_band_assignments_on_dealer_create
AFTER INSERT ON "DealerAccount"
FOR EACH ROW
EXECUTE FUNCTION create_default_band_assignments();

-- Trigger 2: Validate entitlement changes
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

CREATE TRIGGER enforce_entitlement_bands
AFTER UPDATE OF entitlement ON "DealerAccount"
FOR EACH ROW
EXECUTE FUNCTION validate_entitlement_change();

-- Trigger 3: Prevent order modification after shipped
CREATE OR REPLACE FUNCTION prevent_shipped_order_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IN ('SHIPPED', 'CANCELLED') THEN
    RAISE EXCEPTION 'Cannot modify order in % status', OLD.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_shipped_orders
BEFORE UPDATE ON "OrderHeader"
FOR EACH ROW
WHEN (OLD.status IN ('SHIPPED', 'CANCELLED'))
EXECUTE FUNCTION prevent_shipped_order_changes();

-- Trigger 4: Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updatedAt (Prisma handles this but as backup)
CREATE TRIGGER update_dealerbandassingment_timestamp
BEFORE UPDATE ON "DealerBandAssignment"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
