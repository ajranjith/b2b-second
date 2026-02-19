import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

export async function GET(req: NextRequest) {
  try {
    const upstreamUrl = `${API_BASE}/api/bff/v1/dealer/search${req.nextUrl.search}`;
    const auth = req.headers.get("authorization");
    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: auth ? { authorization: auth } : undefined,
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
    return NextResponse.json({ error: error.message || "Upstream search failed" }, { status: 500 });
  }
}

export const runtime = "nodejs";
