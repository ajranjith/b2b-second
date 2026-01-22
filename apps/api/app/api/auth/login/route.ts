import type { NextRequest } from "next/server";

import { handleAuthLogin } from "@/handlers/authLoginHandler";

export async function POST(request: NextRequest) {
  return handleAuthLogin(request);
}

export const runtime = "nodejs";
