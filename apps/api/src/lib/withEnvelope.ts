import { NextRequest, NextResponse } from "next/server";
import { newSessionId } from "@repo/identity";
import { requireRole, type UserRole } from "@/auth/requireRole";
import { runWithEnvelope, type Envelope, type Namespace, type Role } from "./runtimeContext";

type RouteContext = unknown;

type RouteHandler<TContext = RouteContext> = (
  req: NextRequest,
  context: TContext,
) => Promise<Response | NextResponse>;

export interface WithEnvelopeOptions {
  namespace?: Namespace;
}

const SESSION_COOKIE = "sid";
const NAMESPACE_HEADER = "x-app-namespace";

function envelopeError(code: string, message: string, status = 400): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

function detectNamespace(pathname: string): Namespace | undefined {
  if (pathname.startsWith("/api/bff/v1/admin")) return "A";
  if (pathname.startsWith("/api/bff/v1/dealer")) return "D";
  return undefined;
}

function normalizeHeader(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  return value.trim();
}

export function withEnvelope<TContext = RouteContext>(
  options: WithEnvelopeOptions | undefined,
  handler: RouteHandler<TContext>,
): RouteHandler<TContext> {
  return async function handlerWithEnvelope(
    req: NextRequest,
    context: TContext,
  ): Promise<NextResponse> {
    const pathname = req.nextUrl?.pathname ?? "/";

    const namespace = options?.namespace ?? detectNamespace(pathname);
    if (!namespace) {
      return envelopeError("UNKNOWN_NAMESPACE", `Cannot determine namespace for '${pathname}'`, 400);
    }

    const headerNamespace = normalizeHeader(req.headers.get(NAMESPACE_HEADER));
    if (!headerNamespace || headerNamespace !== namespace) {
      console.warn("ENVELOPE_MISMATCH", {
        path: pathname,
        requiredNs: namespace,
        headerNs: headerNamespace ?? null,
      });
      return envelopeError("ENVELOPE_MISMATCH", "Namespace header mismatch", 403);
    }

    const requiredRole: UserRole = namespace === "A" ? "ADMIN" : "DEALER";
    const auth = requireRole(req, requiredRole);
    if (!auth.ok) {
      console.warn("ENVELOPE_MISMATCH", {
        path: pathname,
        requiredNs: namespace,
        headerNs: headerNamespace ?? null,
        role: requiredRole,
        userId: null,
      });
      return envelopeError("ENVELOPE_MISMATCH", auth.message, 403);
    }

    const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value;
    const sessionId = sessionCookie && sessionCookie.startsWith(`SID-${namespace}-`)
      ? sessionCookie
      : newSessionId(namespace);
    const isNewSession = sessionId !== sessionCookie;

    const envelope: Envelope = {
      ns: namespace,
      sid: sessionId,
      role: requiredRole as Role,
      userId: auth.user?.id ?? "unknown",
      path: pathname,
      requestId: req.headers.get("x-request-id") ?? undefined,
    };

    console.info("ENVELOPE_OK", {
      sid: envelope.sid,
      ns: envelope.ns,
      path: envelope.path,
    });

    return runWithEnvelope(envelope, async () => {
      const response = await handler(req, context);
      const nextResponse =
        response instanceof NextResponse
          ? response
          : new NextResponse(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            });

      if (isNewSession) {
        nextResponse.cookies.set(SESSION_COOKIE, sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
        });
      }

      return nextResponse;
    });
  };
}
