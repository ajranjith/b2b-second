# B2B Portal - Rule Engine Detection Script (PowerShell Version)

$global:MISSING = 0
$global:PRESENT = 0

function Check-File {
    param($Path, $Description)
    if (Test-Path $Path -PathType Leaf) {
        Write-Host "[OK] $Description" -ForegroundColor Green
        Write-Host "  -> $Path" -ForegroundColor Blue
        $global:PRESENT++
    }
    else {
        Write-Host "[X]  $Description" -ForegroundColor Red
        Write-Host "  Missing: $Path" -ForegroundColor Yellow
        $global:MISSING++
    }
}

function Check-Dir {
    param($Path, $Description)
    if (Test-Path $Path -PathType Container) {
        Write-Host "[OK] $Description" -ForegroundColor Green
        $global:PRESENT++
    }
    else {
        Write-Host "[X]  $Description" -ForegroundColor Red
        $global:MISSING++
    }
}

function Check-DbConstraint {
    param($ConstraintName, $Description)
    try {
        $result = docker exec hotbray_postgres psql -U postgres -d hotbray -t -c "SELECT COUNT(*) FROM pg_constraint WHERE conname = '$ConstraintName';" 2>$null
        if ($null -ne $result) {
            $val = 0
            $str = $result.ToString().Trim()
            if ([int]::TryParse($str, [ref]$val) -and $val -gt 0) {
                Write-Host "[OK] $Description" -ForegroundColor Green
                $global:PRESENT++
                return
            }
        }
        Write-Host "[X]  $Description" -ForegroundColor Red
        $global:MISSING++
    }
    catch {
        Write-Host "[X]  $Description (Error)" -ForegroundColor Red
        $global:MISSING++
    }
}

function Check-DbTrigger {
    param($TriggerName, $Description)
    try {
        $result = docker exec hotbray_postgres psql -U postgres -d hotbray -t -c "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name = '$TriggerName';" 2>$null
        if ($null -ne $result) {
            $val = 0
            $str = $result.ToString().Trim()
            if ([int]::TryParse($str, [ref]$val) -and $val -gt 0) {
                Write-Host "[OK] $Description" -ForegroundColor Green
                $global:PRESENT++
                return
            }
        }
        Write-Host "[X]  $Description" -ForegroundColor Red
        $global:MISSING++
    }
    catch {
        Write-Host "[X]  $Description (Error)" -ForegroundColor Red
        $global:MISSING++
    }
}

Write-Host "`n==========================================================="
Write-Host "PART 1: APPLICATION RULE ENGINE (packages/rules/)"
Write-Host "===========================================================`n"

Check-Dir "packages/rules" "Rule Engine Package"
Check-Dir "packages/rules/src" "Source Directory"
Check-File "packages/rules/src/index.ts" "Main Export File"
Check-File "packages/rules/src/types.ts" "Type Definitions"
Check-File "packages/rules/src/errors.ts" "Custom Error Classes"

Write-Host "`n--- Rule Modules ---"
Check-Dir "packages/rules/src/rules" "Rules Directory"
Check-File "packages/rules/src/rules/PricingRules.ts" "Pricing Rules Module"
Check-File "packages/rules/src/rules/OrderRules.ts" "Order Rules Module"
Check-File "packages/rules/src/rules/EntitlementRules.ts" "Entitlement Rules Module"
Check-File "packages/rules/src/rules/InventoryRules.ts" "Inventory Rules Module (Optional)"

Write-Host "`n--- Engine Core ---"
Check-Dir "packages/rules/src/engine" "Engine Directory"
Check-File "packages/rules/src/engine/RuleEngine.ts" "Rule Engine Core"
Check-File "packages/rules/src/engine/RuleContext.ts" "Rule Context (Optional)"

Write-Host "`n--- Validators ---"
Check-Dir "packages/rules/src/validators" "Validators Directory (Optional)"

Write-Host "`n==========================================================="
Write-Host "PART 2: DATABASE RULE ENGINE (PostgreSQL)"
Write-Host "===========================================================`n"

# Check Docker connectivity
$dockerCheck = docker exec hotbray_postgres psql -U postgres -d hotbray -c "SELECT 1;" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X]  Cannot connect to database" -ForegroundColor Red
    Write-Host "  Make sure PostgreSQL is running: docker compose up -d" -ForegroundColor Yellow
}
else {
    Write-Host "[OK] Database connection successful" -ForegroundColor Green
    
    Write-Host "`n--- CHECK Constraints ---"
    Check-DbConstraint "bandcode_valid_check" "Band Code Validation (1-4)"
    Check-DbConstraint "price_positive_check" "Positive Price Validation"
    Check-DbConstraint "email_format_check" "Email Format Validation"
    Check-DbConstraint "cart_qty_positive_check" "Cart Quantity Positive"
    Check-DbConstraint "orderline_qty_positive_check" "Order Quantity Positive"
    Check-DbConstraint "stock_nonnegative_check" "Stock Non-Negative"
    Check-DbConstraint "accountno_not_empty_check" "Account Number Not Empty"
    Check-DbConstraint "companyname_not_empty_check" "Company Name Not Empty"
    Check-DbConstraint "productcode_not_empty_check" "Product Code Not Empty"
    
    Write-Host "`n--- Database Triggers ---"
    Check-DbTrigger "ensure_band_assignments_on_dealer_create" "Auto-Create Bands on Dealer Insert"
    Check-DbTrigger "enforce_entitlement_bands" "Enforce Entitlement Band Rules"
    Check-DbTrigger "protect_shipped_orders" "Prevent Shipped Order Modification"
    Check-DbTrigger "update_dealerbandassingment_timestamp" "Auto-Update Timestamps"
    
    Write-Host "`n--- Prisma Unique Constraints ---"
    Check-DbConstraint "DealerBandAssignment_dealerAccountId_partType_key" "One Band Per Dealer Per PartType"
    Check-DbConstraint "ProductPriceBand_productId_bandCode_key" "One Price Per Product Per Band"
}

Write-Host "`n==========================================================="
Write-Host "PART 3: API INTEGRATION"
Write-Host "===========================================================`n"

Check-File "apps/api/src/lib/ruleEngine.ts" "Rule Engine Singleton"
Check-File "apps/api/src/routes/dealer.ts" "Dealer Routes (should use rule engine)"
Check-File "apps/api/src/routes/admin.ts" "Admin Routes"

Write-Host "`n--- Checking Rule Engine Usage in API ---"

if (Test-Path "apps/api/src/routes/dealer.ts") {
    $dealerContent = Get-Content "apps/api/src/routes/dealer.ts" -Raw
    if ($dealerContent -match "ruleEngine") {
        Write-Host "[OK] Rule engine imported in dealer routes" -ForegroundColor Green
        $global:PRESENT++
    }
    else {
        Write-Host "[X]  Rule engine NOT used in dealer routes" -ForegroundColor Red
        $global:MISSING++
    }
    
    if ($dealerContent -match "PricingRules|calculatePrice") {
        Write-Host "[OK] Pricing rules used in dealer routes" -ForegroundColor Green
        $global:PRESENT++
    }
    else {
        Write-Host "[X]  Pricing rules NOT used in dealer routes" -ForegroundColor Red
        $global:MISSING++
    }
}

Write-Host "`n==========================================================="
Write-Host "PART 4: VALIDATION SCHEMAS"
Write-Host "===========================================================`n"

Check-Dir "packages/shared/src/schemas" "Shared Schemas Directory (Optional)"
Check-File "packages/shared/src/schemas/dealer.ts" "Dealer Validation Schemas (Optional)"

Write-Host "`n==========================================================="
Write-Host "SUMMARY"
Write-Host "===========================================================`n"

$TOTAL = $global:PRESENT + $global:MISSING
$PERCENTAGE = 0
if ($TOTAL -gt 0) {
    $PERCENTAGE = [math]::Round(($global:PRESENT * 100 / $TOTAL))
}

Write-Host "Present: $global:PRESENT / $TOTAL" -ForegroundColor Green
Write-Host "Missing: $global:MISSING / $TOTAL" -ForegroundColor Red
Write-Host ""

if ($PERCENTAGE -ge 80) {
    Write-Host "[OK] Implementation Status: GOOD ($PERCENTAGE%)" -ForegroundColor Green
    Write-Host "`nYou have most rule engines in place!"
}
elseif ($PERCENTAGE -ge 50) {
    Write-Host "[!] Implementation Status: PARTIAL ($PERCENTAGE%)" -ForegroundColor Yellow
    Write-Host "`nYou have some rule engines but need more work."
}
else {
    Write-Host "[X] Implementation Status: MISSING/MINIMAL ($PERCENTAGE%)" -ForegroundColor Red
    Write-Host "`nRule engines are mostly missing!"
}
