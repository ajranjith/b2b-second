import {
  AdminUserCreateDTO,
  AdminUserSchema,
  AdminUsersResponseSchema,
  type AdminUserDTO,
  type AdminUsersResponseDTO,
  type AdminUserUpdateDTO,
} from "@repo/lib";

import {
  fetchAdminUsers,
  insertAdminUser,
  updateAdminUser as updateAdminUserRepo,
} from "../repositories/adminUsersRepo";

const toDTO = (row: {
  id: string;
  email: string;
  role: string;
  adminRole: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
}): AdminUserDTO =>
  AdminUserSchema.parse({
    id: row.id,
    email: row.email,
    role: row.role,
    adminRole: row.adminRole,
    isActive: row.isActive,
    lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
  });

export async function listAdminUsers(): Promise<AdminUsersResponseDTO> {
  const rows = await fetchAdminUsers();
  const users = rows.map(toDTO);
  return AdminUsersResponseSchema.parse({ users });
}

export async function createAdminUser(payload: AdminUserCreateDTO): Promise<AdminUserDTO> {
  const row = await insertAdminUser(payload);
  return toDTO(row);
}

export async function updateAdminUser(
  userId: string,
  payload: AdminUserUpdateDTO,
): Promise<AdminUserDTO | null> {
  const row = await updateAdminUserRepo(userId, payload);
  if (!row) {
    return null;
  }
  return toDTO(row);
}
