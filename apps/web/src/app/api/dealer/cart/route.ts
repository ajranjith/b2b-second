import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

function authHeaders(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth ? { authorization: auth } : undefined;
}

export async function GET(req: NextRequest) {
  try {
    const upstream = await fetch(`${API_BASE}/api/bff/v1/dealer/cart`, {
      method: "GET",
      headers: authHeaders(req),
      cache: "no-store",
    });
    const payload = await upstream.text();
    return new NextResponse(payload, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Upstream cart failed" }, { status: 500 });
  }
}

// Compatibility shim for callers posting to /api/dealer/cart as add-to-cart.
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headers = new Headers(authHeaders(req) || {});
    headers.set("content-type", "application/json");

    const upstream = await fetch(`${API_BASE}/api/bff/v1/dealer/cart/items`, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    });
    const payload = await upstream.text();
    return new NextResponse(payload, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Upstream cart add failed" }, { status: 500 });
  }
}

export const runtime = "nodejs";
