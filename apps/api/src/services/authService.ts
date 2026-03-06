import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { fetchAuthUserByEmail, updateLastLogin } from "../repositories/authRepo";

export type LoginResult = {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    adminRole?: string;
    mustChangePassword: boolean;
    dealerAccountId?: string;
    dealerUserId?: string;
    companyName?: string;
  };
};

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

export async function loginWithEmail(email: string, password: string): Promise<LoginResult | null> {
  const trimmedEmail = email.trim();
  const normalizedEmail = trimmedEmail.toLowerCase();

  const user = await fetchAuthUserByEmail(trimmedEmail, normalizedEmail);
  if (!user || !user.isActive) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return null;
  }

  const payload: Record<string, string> = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  if (user.dealerAccountId) {
    payload.dealerAccountId = user.dealerAccountId;
  }

  if (user.dealerUserId) {
    payload.dealerUserId = user.dealerUserId;
  }

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

  await updateLastLogin(user.id);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      adminRole: user.adminRole ?? undefined,
      mustChangePassword: user.mustChangePassword,
      dealerAccountId: user.dealerAccountId ?? undefined,
      dealerUserId: user.dealerUserId ?? undefined,
      companyName: user.companyName ?? undefined,
    },
  };
}
