import { readClient } from "../db";

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

export async function fetchDealerAccounts(): Promise<DealerAccountRecord[]> {
  const result = await readClient.query<DealerAccountRecord>(
    `
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
    `,
  );

  return result.rows;
}

export async function fetchDealerUsers(): Promise<DealerUserRecord[]> {
  const result = await readClient.query<DealerUserRecord>(
    `
      SELECT
        du."dealerAccountId",
        du."firstName",
        du."lastName",
        u.email
      FROM "DealerUser" du
      JOIN "AppUser" u ON u.id = du."userId";
    `,
  );

  return result.rows;
}

export async function fetchDealerDiscountTiers(): Promise<DealerDiscountTierRecord[]> {
  const result = await readClient.query<DealerDiscountTierRecord>(
    `
      SELECT
        "dealerAccountId",
        "discountCode",
        "tierCode"
      FROM "DealerDiscountTier";
    `,
  );

  return result.rows;
}
