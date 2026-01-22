import bcrypt from "bcrypt";
import { writeClient, readClient } from "../db";
import crypto from "crypto";

export type AdminUserRow = {
  id: string;
  email: string;
  role: string;
  adminRole: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  mustChangePassword: boolean;
};

export async function fetchAdminUsers() {
  const result = await readClient.query<AdminUserRow>(
    `
      SELECT
        id,
        email,
        role,
        "adminRole",
        "isActive",
        "lastLoginAt",
        "mustChangePassword"
      FROM "AppUser"
      WHERE role = 'ADMIN'
      ORDER BY "createdAt" DESC;
    `,
  );
  return result.rows;
}

export async function insertAdminUser(payload: {
  email: string;
  password: string;
  adminRole: string;
}) {
  const hashed = await bcrypt.hash(payload.password, 12);
  const normalized = payload.email.toLowerCase();
  const id = crypto.randomUUID();
  const result = await writeClient.query<AdminUserRow>(
    `
      INSERT INTO "AppUser" (
        id,
        email,
        "emailNormalized",
        "passwordHash",
        role,
        "adminRole",
        "mustChangePassword",
        "createdAt",
        "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, 'ADMIN', $5, true, NOW(), NOW()
      )
      RETURNING id, email, role, "adminRole", "isActive", "lastLoginAt", "mustChangePassword";
    `,
    [id, payload.email, normalized, hashed, payload.adminRole],
  );
  return result.rows[0];
}

export async function updateAdminUser(
  userId: string,
  changes: {
    email?: string;
    adminRole?: string;
    isActive?: boolean;
  },
) {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  if (changes.email) {
    fields.push(`email = $${idx++}`);
    values.push(changes.email);
  }
  if (changes.adminRole) {
    fields.push(`"adminRole" = $${idx++}`);
    values.push(changes.adminRole);
  }
  if (typeof changes.isActive === "boolean") {
    fields.push(`"isActive" = $${idx++}`);
    values.push(changes.isActive);
  }

  if (fields.length === 0) {
    return null;
  }

  values.push(userId);
  const result = await writeClient.query<AdminUserRow>(
    `
      UPDATE "AppUser"
      SET ${fields.join(", ")}, "updatedAt" = NOW()
      WHERE id = $${idx}
      RETURNING id, email, role, "adminRole", "isActive", "lastLoginAt", "mustChangePassword";
    `,
    values,
  );
  return result.rows[0] ?? null;
}

export async function deleteAdminUser(userId: string) {
  const result = await writeClient.query(
    `
      DELETE FROM "AppUser"
      WHERE id = $1;
    `,
    [userId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function resetAdminPassword(userId: string, newPassword: string) {
  const hashed = await bcrypt.hash(newPassword, 12);
  const result = await writeClient.query<AdminUserRow>(
    `
      UPDATE "AppUser"
      SET "passwordHash" = $1,
          "mustChangePassword" = true,
          "updatedAt" = NOW()
      WHERE id = $2
      RETURNING id, email, role, "adminRole", "isActive", "lastLoginAt", "mustChangePassword";
    `,
    [hashed, userId],
  );
  return result.rows[0] ?? null;
}
