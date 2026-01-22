/**
 * Admin Dealers Repository
 *
 * This repository demonstrates the correct usage of the db() scoped runner pattern
 * with Promise.all for concurrency-safe parallel queries.
 *
 * Each query uses its own registered DB-ID from the QUERIES registry:
 * - ADMIN_DEALERS_LIST: List dealer accounts
 * - ADMIN_DEALERS_USERS_LIST: List dealer users
 * - ADMIN_DEALERS_TIERS_LIST: List dealer discount tiers
 */

import { db } from "@/lib/prisma";
import { QUERIES } from "@repo/identity";

export type DealerAccountRecord = {
  id: string;
  accountNo: string;
  companyName: string | null;
  status: string;
  entitlement: string;
  phone: string | null;
  defaultShippingMethod: string | null;
  shippingNotes: string | null;
  billingLine1: string | null;
  billingLine2: string | null;
  billingCity: string | null;
  billingPostcode: string | null;
  billingCountry: string | null;
};

export type DealerUserRecord = {
  dealerAccountId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
};

export type DealerDiscountTierRecord = {
  dealerAccountId: string;
  discountCode: string;
  tierCode: string;
};

/**
 * Fetch all dealer accounts
 * DB-ID: ADMIN_DEALERS_LIST - List dealer accounts
 */
export async function fetchDealerAccounts(): Promise<DealerAccountRecord[]> {
  // Each db() call creates a scoped context for the DB-ID
  // This is concurrency-safe even when used with Promise.all
  return db(QUERIES.ADMIN_DEALERS_LIST).$queryRaw<DealerAccountRecord[]>`
    SELECT
      id,
      "accountNo",
      "companyName",
      status,
      entitlement,
      phone,
      "defaultShippingMethod",
      "shippingNotes",
      "billingLine1",
      "billingLine2",
      "billingCity",
      "billingPostcode",
      "billingCountry"
    FROM "DealerAccount"
    ORDER BY "createdAt" DESC;
  `;
}

/**
 * Fetch all dealer users with their email
 * DB-ID: ADMIN_DEALERS_USERS_LIST - List dealer users
 */
export async function fetchDealerUsers(): Promise<DealerUserRecord[]> {
  return db(QUERIES.ADMIN_DEALERS_USERS_LIST).$queryRaw<DealerUserRecord[]>`
    SELECT
      du."dealerAccountId",
      du."firstName",
      du."lastName",
      u.email
    FROM "DealerUser" du
    JOIN "AppUser" u ON u.id = du."userId";
  `;
}

/**
 * Fetch all dealer discount tiers
 * DB-ID: ADMIN_DEALERS_TIERS_LIST - List dealer discount tiers
 */
export async function fetchDealerDiscountTiers(): Promise<DealerDiscountTierRecord[]> {
  return db(QUERIES.ADMIN_DEALERS_TIERS_LIST).$queryRaw<DealerDiscountTierRecord[]>`
    SELECT
      "dealerAccountId",
      "discountCode",
      "tierCode"
    FROM "DealerDiscountTier";
  `;
}

/**
 * Example of Promise.all with different DB-IDs
 *
 * This demonstrates that the db() scoped runner pattern is concurrency-safe:
 * - Each query runs with its own DB-ID context
 * - Promise.all does NOT corrupt the DB-ID stamping
 * - Each query is traced with its correct DB-ID in logs
 *
 * Usage in service:
 *   const [accounts, users, tiers] = await Promise.all([
 *     fetchDealerAccounts(),    // Traced as ADMIN_DEALERS_LIST (DB-A-02-01)
 *     fetchDealerUsers(),       // Traced as ADMIN_DEALERS_USERS_LIST (DB-A-02-02)
 *     fetchDealerDiscountTiers() // Traced as ADMIN_DEALERS_TIERS_LIST (DB-A-02-03)
 *   ]);
 */
