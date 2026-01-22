import { NextResponse } from "next/server";

export type ApiError = {
  message: string;
  code?: string;
  details?: unknown;
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(error: ApiError, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}
