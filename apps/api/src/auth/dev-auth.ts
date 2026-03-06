import type { NextRequest } from "next/server";

export type UserRole = "ADMIN" | "DEALER";

type AuthResult = { ok: true } | { ok: false; status: number; message: string };

export function requireRole(request: NextRequest, role: UserRole): AuthResult {
  if (process.env.NODE_ENV !== "production" && process.env.DEV_BFF_BYPASS_AUTH === "true") {
    const requestedRole = request.headers.get("x-dev-role");
    if (!requestedRole || requestedRole === role) {
      return { ok: true };
    }
    return { ok: false, status: 403, message: "Forbidden" };
  }

  return { ok: false, status: 401, message: "Auth not configured" };
}
