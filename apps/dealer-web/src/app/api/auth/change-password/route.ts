import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/bff\/v1\/?$/, "") || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: request.headers.get("authorization") ?? "",
      },
      body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, { status: response.status });
  } catch (error: any) {
    console.error("[Auth API] Change password failed:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
