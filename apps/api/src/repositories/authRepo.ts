import { writeClient } from "../db";

export type AuthUserRow = {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  adminRole: string | null;
  mustChangePassword: boolean;
  isActive: boolean;
  dealerUserId: string | null;
  dealerAccountId: string | null;
  companyName: string | null;
};

export async function fetchAuthUserByEmail(
  email: string,
  emailNormalized: string,
): Promise<AuthUserRow | null> {
  const result = await writeClient.query<AuthUserRow>(
    `
      SELECT
        u.id,
        u.email,
        u."passwordHash",
        u.role,
        u."adminRole",
        u."mustChangePassword",
        u."isActive",
        du.id AS "dealerUserId",
        du."dealerAccountId",
        da."companyName"
      FROM "AppUser" u
      LEFT JOIN "DealerUser" du ON du."userId" = u.id
      LEFT JOIN "DealerAccount" da ON da.id = du."dealerAccountId"
      WHERE u.email = $1 OR u."emailNormalized" = $2
      LIMIT 1;
    `,
    [email, emailNormalized],
  );

  return result.rows[0] ?? null;
}

export async function updateLastLogin(userId: string) {
  await writeClient.query(
    `
      UPDATE "AppUser"
      SET "lastLoginAt" = NOW()
      WHERE id = $1;
    `,
    [userId],
  );
}
