#!/usr/bin/env npx tsx
/**
 * Database Connection Test Suite
 * Tests database connectivity from UI via API endpoints
 *
 * Run with: npx tsx test-db-connection.ts
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL = process.env.API_URL || "http://localhost:3001";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin-1@hotbray.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Password123!";
const DEALER_EMAIL = process.env.DEALER_EMAIL || "u-1@dealer.com";
const DEALER_PASSWORD = process.env.DEALER_PASSWORD || "Password123!";

interface TestResult {
  name: string;
  status: "PASS" | "FAIL" | "SKIP" | "ERROR";
  duration: number;
  error?: string;
  details?: Record<string, any>;
}

const results: TestResult[] = [];

// ============================================================================
// UTILITIES
// ============================================================================

async function request(
  method: string,
  path: string,
  data?: Record<string, any>,
  token?: string,
): Promise<{ status: number; data: any }> {
  const url = `${API_BASE_URL}${path}`;
  const options: any = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  const body = await response.text();

  let parsed;
  try {
    parsed = body ? JSON.parse(body) : {};
  } catch {
    parsed = { raw: body };
  }

  return {
    status: response.status,
    data: parsed,
  };
}

function log(message: string, color?: string) {
  const colors: Record<string, string> = {
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    reset: "\x1b[0m",
  };

  const prefix = color ? colors[color] : "";
  const suffix = color ? colors.reset : "";
  console.log(`${prefix}${message}${suffix}`);
}

function recordTest(test: TestResult) {
  results.push(test);
  const icon = {
    PASS: "✅",
    FAIL: "❌",
    SKIP: "⏭️ ",
    ERROR: "⚠️ ",
  }[test.status];

  const duration =
    test.duration < 1000 ? `${test.duration}ms` : `${(test.duration / 1000).toFixed(2)}s`;
  log(
    `${icon} ${test.name} (${duration})`,
    test.status === "PASS" ? "green" : test.status === "FAIL" ? "red" : "yellow",
  );

  if (test.error) {
    log(`   Error: ${test.error}`, "red");
  }
}

// ============================================================================
// TESTS
// ============================================================================

let adminToken = "";
let dealerToken = "";

/**
 * Test 1: Health Check - Database Connection
 */
async function test_HealthCheck() {
  const start = Date.now();
  try {
    const res = await request("GET", "/health");

    if (res.status !== 200) {
      recordTest({
        name: "Health Check - Database Connection",
        status: "FAIL",
        duration: Date.now() - start,
        error: `Expected 200, got ${res.status}`,
        details: res.data,
      });
      return;
    }

    if (!res.data.database || res.data.database !== "connected") {
      recordTest({
        name: "Health Check - Database Connection",
        status: "FAIL",
        duration: Date.now() - start,
        error: "Database not connected",
        details: res.data,
      });
      return;
    }

    recordTest({
      name: "Health Check - Database Connection",
      status: "PASS",
      duration: Date.now() - start,
      details: {
        status: res.data.status,
        database: res.data.database,
        dbName: res.data.dbName,
      },
    });
  } catch (error) {
    recordTest({
      name: "Health Check - Database Connection",
      status: "ERROR",
      duration: Date.now() - start,
      error: String(error),
    });
  }
}

/**
 * Test 2: Admin Authentication - Get JWT Token
 */
async function test_AdminLogin() {
  const start = Date.now();
  try {
    const res = await request("POST", "/auth/login", {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (res.status !== 200) {
      recordTest({
        name: "Admin Login - Database Query",
        status: "FAIL",
        duration: Date.now() - start,
        error: `Expected 200, got ${res.status}`,
        details: res.data,
      });
      return;
    }

    if (!res.data.token) {
      recordTest({
        name: "Admin Login - Database Query",
        status: "FAIL",
        duration: Date.now() - start,
        error: "No token in response",
        details: res.data,
      });
      return;
    }

    adminToken = res.data.token;

    recordTest({
      name: "Admin Login - Database Query",
      status: "PASS",
      duration: Date.now() - start,
      details: {
        userId: res.data.user?.id,
        role: res.data.user?.role,
      },
    });
  } catch (error) {
    recordTest({
      name: "Admin Login - Database Query",
      status: "ERROR",
      duration: Date.now() - start,
      error: String(error),
    });
  }
}

/**
 * Test 3: Dealer Authentication
 */
async function test_DealerLogin() {
  const start = Date.now();
  try {
    const res = await request("POST", "/auth/login", {
      email: DEALER_EMAIL,
      password: DEALER_PASSWORD,
    });

    if (res.status !== 200) {
      recordTest({
        name: "Dealer Login - Database Query",
        status: "FAIL",
        duration: Date.now() - start,
        error: `Expected 200, got ${res.status}`,
      });
      return;
    }

    if (!res.data.token) {
      recordTest({
        name: "Dealer Login - Database Query",
        status: "FAIL",
        duration: Date.now() - start,
        error: "No token in response",
      });
      return;
    }

    dealerToken = res.data.token;

    recordTest({
      name: "Dealer Login - Database Query",
      status: "PASS",
      duration: Date.now() - start,
    });
  } catch (error) {
    recordTest({
      name: "Dealer Login - Database Query",
      status: "ERROR",
      duration: Date.now() - start,
      error: String(error),
    });
  }
}

/**
 * Test 4: Read Operation - List Dealers
 */
async function test_ListDealers() {
  const start = Date.now();
  try {
    if (!adminToken) {
      recordTest({
        name: "List Dealers - SELECT Query",
        status: "SKIP",
        duration: Date.now() - start,
        error: "Admin token not available",
      });
      return;
    }

    const res = await request("GET", "/admin/dealers?limit=10", undefined, adminToken);

    if (res.status !== 200) {
      recordTest({
        name: "List Dealers - SELECT Query",
        status: "FAIL",
        duration: Date.now() - start,
        error: `Expected 200, got ${res.status}`,
      });
      return;
    }

    if (!Array.isArray(res.data.dealers)) {
      recordTest({
        name: "List Dealers - SELECT Query",
        status: "FAIL",
        duration: Date.now() - start,
        error: "No dealers array in response",
      });
      return;
    }

    recordTest({
      name: "List Dealers - SELECT Query",
      status: "PASS",
      duration: Date.now() - start,
      details: {
        dealerCount: res.data.dealers.length,
        totalCount: res.data.meta?.total,
      },
    });
  } catch (error) {
    recordTest({
      name: "List Dealers - SELECT Query",
      status: "ERROR",
      duration: Date.now() - start,
      error: String(error),
    });
  }
}

/**
 * Test 5: Dealer Search - Complex Query
 */
async function test_DealerSearch() {
  const start = Date.now();
  try {
    if (!dealerToken) {
      recordTest({
        name: "Product Search - Complex SELECT with Joins",
        status: "SKIP",
        duration: Date.now() - start,
        error: "Dealer token not available",
      });
      return;
    }

    const res = await request(
      "GET",
      "/dealer/search?q=Product&partType=GENUINE",
      undefined,
      dealerToken,
    );

    if (res.status !== 200) {
      recordTest({
        name: "Product Search - Complex SELECT with Joins",
        status: "FAIL",
        duration: Date.now() - start,
        error: `Expected 200, got ${res.status}`,
      });
      return;
    }

    const results = Array.isArray(res.data) ? res.data : res.data.results;
    if (!Array.isArray(results)) {
      recordTest({
        name: "Product Search - Complex SELECT with Joins",
        status: "FAIL",
        duration: Date.now() - start,
        error: "Expected array response",
      });
      return;
    }

    recordTest({
      name: "Product Search - Complex SELECT with Joins",
      status: "PASS",
      duration: Date.now() - start,
      details: {
        resultCount: results.length,
      },
    });
  } catch (error) {
    recordTest({
      name: "Product Search - Complex SELECT with Joins",
      status: "ERROR",
      duration: Date.now() - start,
      error: String(error),
    });
  }
}

/**
 * Test 6: Dealer Orders - Join Query
 */
async function test_DealerOrders() {
  const start = Date.now();
  try {
    if (!dealerToken) {
      recordTest({
        name: "Get Orders - JOIN with Order Lines",
        status: "SKIP",
        duration: Date.now() - start,
        error: "Dealer token not available",
      });
      return;
    }

    const res = await request("GET", "/dealer/orders", undefined, dealerToken);

    if (res.status !== 200) {
      recordTest({
        name: "Get Orders - JOIN with Order Lines",
        status: "FAIL",
        duration: Date.now() - start,
        error: `Expected 200, got ${res.status}`,
      });
      return;
    }

    recordTest({
      name: "Get Orders - JOIN with Order Lines",
      status: "PASS",
      duration: Date.now() - start,
      details: {
        hasOrders: !!res.data.orders || !!res.data.length,
      },
    });
  } catch (error) {
    recordTest({
      name: "Get Orders - JOIN with Order Lines",
      status: "ERROR",
      duration: Date.now() - start,
      error: String(error),
    });
  }
}

/**
 * Test 7: Backorders - SELECT from Special Table
 */
async function test_Backorders() {
  const start = Date.now();
  try {
    if (!dealerToken) {
      recordTest({
        name: "Get Backorders - SELECT Backorder Dataset",
        status: "SKIP",
        duration: Date.now() - start,
        error: "Dealer token not available",
      });
      return;
    }

    const res = await request("GET", "/dealer/backorders", undefined, dealerToken);

    if (res.status !== 200) {
      recordTest({
        name: "Get Backorders - SELECT Backorder Dataset",
        status: "FAIL",
        duration: Date.now() - start,
        error: `Expected 200, got ${res.status}`,
      });
      return;
    }

    recordTest({
      name: "Get Backorders - SELECT Backorder Dataset",
      status: "PASS",
      duration: Date.now() - start,
    });
  } catch (error) {
    recordTest({
      name: "Get Backorders - SELECT Backorder Dataset",
      status: "ERROR",
      duration: Date.now() - start,
      error: String(error),
    });
  }
}

/**
 * Test 8: Create Cart Item - INSERT Operation
 */
async function test_AddToCart() {
  const start = Date.now();
  try {
    if (!dealerToken) {
      recordTest({
        name: "Add to Cart - INSERT Cart Item",
        status: "SKIP",
        duration: Date.now() - start,
        error: "Dealer token not available",
      });
      return;
    }

    // First search for a product
    const searchRes = await request(
      "GET",
      "/dealer/search?q=Product&limit=1",
      undefined,
      dealerToken,
    );

    const results = Array.isArray(searchRes.data) ? searchRes.data : searchRes.data?.results;
    if (searchRes.status !== 200 || !Array.isArray(results) || results.length === 0) {
      recordTest({
        name: "Add to Cart - INSERT Cart Item",
        status: "SKIP",
        duration: Date.now() - start,
        error: "No products found for cart test",
      });
      return;
    }

    const productId = results[0].id;

    // Add to cart
    const cartRes = await request(
      "POST",
      "/dealer/cart/items",
      {
        productId,
        qty: 1,
      },
      dealerToken,
    );

    if (cartRes.status !== 200 && cartRes.status !== 201) {
      recordTest({
        name: "Add to Cart - INSERT Cart Item",
        status: "FAIL",
        duration: Date.now() - start,
        error: `Expected 200/201, got ${cartRes.status}`,
        details: cartRes.data,
      });
      return;
    }

    recordTest({
      name: "Add to Cart - INSERT Cart Item",
      status: "PASS",
      duration: Date.now() - start,
    });
  } catch (error) {
    recordTest({
      name: "Add to Cart - INSERT Cart Item",
      status: "ERROR",
      duration: Date.now() - start,
      error: String(error),
    });
  }
}

/**
 * Test 9: Get Cart - SELECT with Joins
 */
async function test_GetCart() {
  const start = Date.now();
  try {
    if (!dealerToken) {
      recordTest({
        name: "Get Cart - SELECT Cart with Items",
        status: "SKIP",
        duration: Date.now() - start,
        error: "Dealer token not available",
      });
      return;
    }

    const res = await request("GET", "/dealer/cart", undefined, dealerToken);

    if (res.status !== 200) {
      recordTest({
        name: "Get Cart - SELECT Cart with Items",
        status: "FAIL",
        duration: Date.now() - start,
        error: `Expected 200, got ${res.status}`,
      });
      return;
    }

    recordTest({
      name: "Get Cart - SELECT Cart with Items",
      status: "PASS",
      duration: Date.now() - start,
      details: {
        itemCount: res.data.items?.length || 0,
      },
    });
  } catch (error) {
    recordTest({
      name: "Get Cart - SELECT Cart with Items",
      status: "ERROR",
      duration: Date.now() - start,
      error: String(error),
    });
  }
}

/**
 * Test 10: Concurrent Requests
 */
async function test_ConcurrentRequests() {
  const start = Date.now();
  try {
    // Make 10 concurrent requests
    const promises = Array(10)
      .fill(null)
      .map(() => request("GET", "/health"));

    const responses = await Promise.all(promises);
    const successCount = responses.filter((r) => r.status === 200).length;

    if (successCount < 9) {
      recordTest({
        name: "Concurrent Requests - Connection Pool",
        status: "FAIL",
        duration: Date.now() - start,
        error: `Only ${successCount}/10 requests succeeded`,
      });
      return;
    }

    recordTest({
      name: "Concurrent Requests - Connection Pool",
      status: "PASS",
      duration: Date.now() - start,
      details: {
        successCount,
        totalRequests: 10,
      },
    });
  } catch (error) {
    recordTest({
      name: "Concurrent Requests - Connection Pool",
      status: "ERROR",
      duration: Date.now() - start,
      error: String(error),
    });
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function runAllTests() {
  log("\n════════════════════════════════════════════════════════════════", "blue");
  log("  DATABASE CONNECTION TESTING - FROM UI", "blue");
  log(`  API: ${API_BASE_URL}`, "blue");
  log("════════════════════════════════════════════════════════════════\n", "blue");

  // Run tests in sequence
  await test_HealthCheck();
  await test_AdminLogin();
  await test_DealerLogin();
  await test_ListDealers();
  await test_DealerSearch();
  await test_DealerOrders();
  await test_Backorders();
  await test_AddToCart();
  await test_GetCart();
  await test_ConcurrentRequests();

  // Print summary
  log("\n════════════════════════════════════════════════════════════════", "blue");
  log("  TEST SUMMARY", "blue");
  log("════════════════════════════════════════════════════════════════\n", "blue");

  const stats = {
    PASS: results.filter((r) => r.status === "PASS").length,
    FAIL: results.filter((r) => r.status === "FAIL").length,
    ERROR: results.filter((r) => r.status === "ERROR").length,
    SKIP: results.filter((r) => r.status === "SKIP").length,
  };

  log(`Total Tests: ${results.length}`, "blue");
  log(`✅ Passed:  ${stats.PASS}`, "green");
  log(`❌ Failed:  ${stats.FAIL}`, stats.FAIL > 0 ? "red" : "green");
  log(`⚠️  Errors:  ${stats.ERROR}`, stats.ERROR > 0 ? "red" : "green");
  log(`⏭️  Skipped: ${stats.SKIP}`, "yellow");

  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  log(`\nTotal Duration: ${(totalDuration / 1000).toFixed(2)}s\n`, "blue");

  // Exit with appropriate code
  process.exit(stats.FAIL > 0 || stats.ERROR > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  log(`\nFATAL ERROR: ${error}`, "red");
  process.exit(1);
});
