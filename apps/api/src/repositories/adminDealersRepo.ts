/**
 * Admin Dealers Repository
 *
 * This repository demonstrates the correct usage of the db() scoped runner pattern
 * with Promise.all for concurrency-safe parallel queries.
 *
 * Each query uses its own registered DB-ID from the QUERIES registry:
 * - DB-A-02-01: List dealer accounts
 * - DB-A-02-02: List dealer users
 * - DB-A-02-03: List dealer discount tiers
 */

import { db } from "@/lib/prisma";

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
 * DB-ID: DB-A-02-01 - List dealer accounts
 */
export async function fetchDealerAccounts(): Promise<DealerAccountRecord[]> {
  // Each db() call creates a scoped context for the DB-ID
  // This is concurrency-safe even when used with Promise.all
  return db("DB-A-02-01").$queryRaw<DealerAccountRecord[]>`
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
 * DB-ID: DB-A-02-02 - List dealer users
 */
export async function fetchDealerUsers(): Promise<DealerUserRecord[]> {
  return db("DB-A-02-02").$queryRaw<DealerUserRecord[]>`
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
 * DB-ID: DB-A-02-03 - List dealer discount tiers
 */
export async function fetchDealerDiscountTiers(): Promise<DealerDiscountTierRecord[]> {
  return db("DB-A-02-03").$queryRaw<DealerDiscountTierRecord[]>`
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
 *     fetchDealerAccounts(),    // Traced as DB-A-02-01
 *     fetchDealerUsers(),       // Traced as DB-A-02-02
 *     fetchDealerDiscountTiers() // Traced as DB-A-02-03
 *   ]);
 */
