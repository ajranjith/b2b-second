import { readClient, writeClient } from "../db";

export type DealerAccountDetailRecord = {
  id: string;
  accountNo: string;
  companyName: string | null;
  status: string | null;
  defaultShippingMethod: string | null;
  shippingNotes: string | null;
  phone: string | null;
  notes: string | null;
  billingLine1: string | null;
  billingLine2: string | null;
  billingCity: string | null;
  billingPostcode: string | null;
  billingCountry: string | null;
  dealerUserId: string | null;
  userId: string | null;
  contactFirstName: string | null;
  contactLastName: string | null;
  contactEmail: string | null;
};

const detailFields = `
  da.id,
  da."accountNo",
  da."companyName",
  da.status,
  da."defaultShippingMethod",
  da."shippingNotes",
  da.phone,
  da.notes,
  da."billingLine1",
  da."billingLine2",
  da."billingCity",
  da."billingPostcode",
  da."billingCountry",
  du.id AS "dealerUserId",
  du."firstName" AS "contactFirstName",
  du."lastName" AS "contactLastName",
  u.id AS "userId",
  u.email AS "contactEmail"
`;

const detailJoins = `
  FROM "DealerAccount" da
  LEFT JOIN "DealerUser" du ON du."dealerAccountId" = da.id AND du."isPrimary" = true
  LEFT JOIN "AppUser" u ON u.id = du."userId"
`;

export async function fetchDealerAccountById(id: string): Promise<DealerAccountDetailRecord | null> {
  const result = await readClient.query<DealerAccountDetailRecord>(`
    SELECT ${detailFields}
    ${detailJoins}
    WHERE da.id = $1
    LIMIT 1;
  `, [id]);

  return result.rows[0] ?? null;
}

export async function fetchDealerAccountByAccountNo(accountNo: string): Promise<DealerAccountDetailRecord | null> {
  const result = await readClient.query<DealerAccountDetailRecord>(`
    SELECT ${detailFields}
    ${detailJoins}
    WHERE da."accountNo" = $1
    LIMIT 1;
  `, [accountNo]);

  return result.rows[0] ?? null;
}

export async function updateDealerAccountProfile(accountId: string, changes: { defaultShippingMethod?: string | null; shippingNotes?: string | null }) {
  const setClauses: string[] = [];
  const values: Array<string | null> = [];

  if ("defaultShippingMethod" in changes) {
    setClauses.push(`"defaultShippingMethod" = $${values.length + 1}`);
    values.push(changes.defaultShippingMethod ?? null);
  }

  if ("shippingNotes" in changes) {
    setClauses.push(`"shippingNotes" = $${values.length + 1}`);
    values.push(changes.shippingNotes ?? null);
  }

  if (setClauses.length === 0) {
    return;
  }

  values.push(accountId);
  await writeClient.query(
    `
      UPDATE "DealerAccount"
      SET ${setClauses.join(", ")}, "updatedAt" = NOW()
      WHERE id = $${values.length};
    `,
    values,
  );
}

export async function updateDealerContact(
  userId: string,
  dealerUserId: string,
  changes: { firstName?: string | null; lastName?: string | null; email?: string | null },
) {
  const contactValues: Array<string | null> = [];
  const contactClauses: string[] = [];

  if ("firstName" in changes) {
    contactClauses.push(`"firstName" = $${contactValues.length + 1}`);
    contactValues.push(changes.firstName ?? null);
  }

  if ("lastName" in changes) {
    contactClauses.push(`"lastName" = $${contactValues.length + 1}`);
    contactValues.push(changes.lastName ?? null);
  }

  if (contactClauses.length && dealerUserId) {
    contactValues.push(dealerUserId);
    await writeClient.query(
      `
        UPDATE "DealerUser"
        SET ${contactClauses.join(", ")}
        WHERE id = $${contactValues.length};
      `,
      contactValues,
    );
  }

  if ("email" in changes && userId) {
    await writeClient.query(
      `
        UPDATE "AppUser"
        SET email = $1,
            "emailNormalized" = LOWER($1),
            "updatedAt" = NOW()
        WHERE id = $2;
      `,
      [changes.email ?? null, userId],
    );
  }
}

export async function resetDealerPassword(userId: string, hashedPassword: string) {
  await writeClient.query(
    `
      UPDATE "AppUser"
      SET "passwordHash" = $1,
          "mustChangePassword" = true,
          "updatedAt" = NOW()
      WHERE id = $2;
    `,
    [hashedPassword, userId],
  );
}
