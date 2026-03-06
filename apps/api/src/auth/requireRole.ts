import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

import { requireRole as devRequireRole, type UserRole } from "./dev-auth";

export type { UserRole };

type AuthUser = {
  id?: string;
  email?: string;
  role: UserRole;
  dealerAccountId?: string;
  dealerUserId?: string;
};

type AuthResult = { ok: true; user?: AuthUser } | { ok: false; status: number; message: string };

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

const parseAuthHeader = (request: NextRequest) => {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
};

export function requireRole(request: NextRequest, role: UserRole): AuthResult {
  const devResult = devRequireRole(request, role);
  if (devResult.ok) {
    return {
      ok: true,
      user: {
        role,
        id: request.headers.get("x-dev-user-id") ?? undefined,
        email: request.headers.get("x-dev-email") ?? undefined,
        dealerAccountId: request.headers.get("x-dev-account-id") ?? undefined,
        dealerUserId: request.headers.get("x-dev-dealer-user-id") ?? undefined,
      },
    };
  }

  if (process.env.NODE_ENV !== "production" && process.env.DEV_BFF_BYPASS_AUTH === "true") {
    return devResult;
  }

  const token = parseAuthHeader(request);
  if (!token) {
    return { ok: false, status: 401, message: "Missing Authorization header" };
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
      email?: string;
      role?: string;
      dealerAccountId?: string;
      dealerUserId?: string;
    };

    if (!payload?.role || payload.role !== role) {
      return { ok: false, status: 403, message: "Forbidden" };
    }

    return {
      ok: true,
      user: {
        id: payload.userId,
        email: payload.email,
        role,
        dealerAccountId: payload.dealerAccountId,
        dealerUserId: payload.dealerUserId,
      },
    };
  } catch {
    return { ok: false, status: 401, message: "Invalid token" };
  }
}
