import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { loginWithEmail } from "@/services/authService";

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export async function handleAuthLogin(request: NextRequest) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation Error",
        message: "Invalid email or password format",
      },
      { status: 400 },
    );
  }

  const result = await loginWithEmail(parsed.data.email, parsed.data.password);
  if (!result) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Invalid email or password",
      },
      { status: 401 },
    );
  }

  return NextResponse.json(result);
}
