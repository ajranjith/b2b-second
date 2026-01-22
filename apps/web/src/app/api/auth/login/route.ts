import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch (error: any) {
    console.error("[Auth API] Login failed:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
