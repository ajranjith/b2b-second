import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const allowedOrigin = process.env.CORS_ORIGIN ?? "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-dev-role",
};

export function middleware(request: NextRequest) {
  const response =
    request.method === "OPTIONS" ? new NextResponse(null, { status: 204 }) : NextResponse.next();

  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
