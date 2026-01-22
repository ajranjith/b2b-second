import { NextRequest, NextResponse } from "next/server";
import {
  assertNamespaceMatches,
  assertTraceIdNamespaceMatches,
  buildEnvelope,
  Envelope,
  Namespace,
  newSessionId,
  newTraceId,
  resolveFeatureId,
  resolveOperationId,
  isValidSid,
  isValidTid,
  isValidTidForNamespace,
  isValidRef,
  isValidApi,
} from "@repo/identity";
import { runWithContext } from "./runtimeContext";

type RouteContext = unknown;

type RouteHandler<TContext = RouteContext> = (
  req: NextRequest,
  context: TContext,
) => Promise<Response | NextResponse>;

export interface WithEnvelopeOptions {
  namespace?: Namespace;
}

const TRACE_HEADER = "x-trace-id";
const SESSION_HEADER = "x-session-id";
const NAMESPACE_HEADER = "x-app-namespace";
const FEATURE_HEADER = "x-feature-id";
const OPERATION_HEADER = "x-operation-id";

/**
 * Get the namespace-specific session cookie name
 * Admin uses 'sid_a', Dealer uses 'sid_d'
 */
function getSessionCookieName(namespace: Namespace): string {
  return namespace === "A" ? "sid_a" : "sid_d";
}

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

/**
 * STRICTLY determine namespace from pathname
 * No silent defaults - must explicitly match admin or dealer paths
 */
function detectNamespace(pathname: string): Namespace | undefined {
  // Admin routes: /api/bff/v1/admin/* or /api/admin/*
  if (pathname.startsWith("/api/bff/v1/admin") || pathname.startsWith("/api/admin")) {
    return "A";
  }
  // Dealer routes: /api/bff/v1/dealer/* or /api/dealer/*
  if (pathname.startsWith("/api/bff/v1/dealer") || pathname.startsWith("/api/dealer")) {
    return "D";
  }
  // No match - return undefined (will reject with UNKNOWN_NAMESPACE)
  return undefined;
}

function normalizeHeader(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  return value.trim();
}

/**
 * Determine the Trace ID - mint if missing or invalid
 * Enforces namespace bouncer checks
 */
function determineTraceId(
  namespace: Namespace,
  headerValue?: string | null,
): { traceId: string; minted: boolean } {
  const normalized = normalizeHeader(headerValue);

  // If valid TID provided, verify it matches the namespace
  if (normalized && isValidTid(normalized)) {
    if (isValidTidForNamespace(normalized, namespace)) {
      return { traceId: normalized, minted: false };
    }
    // TID exists but wrong namespace - this is a namespace bouncer violation
    console.warn(
      `[BOUNCER] TraceIdNamespaceMismatch: Received TID ${normalized} but route namespace is ${namespace}. Minting new TID.`,
    );
  }

  // Mint new TID at the edge
  return { traceId: newTraceId(namespace), minted: true };
}

/**
 * Determine Session ID from namespace-specific cookie or mint new one
 */
function determineSessionId(
  namespace: Namespace,
  cookieValue?: string | null,
  headerValue?: string | null,
): { sessionId: string; minted: boolean } {
  // Check cookie first (primary source)
  if (cookieValue && isValidSid(cookieValue) && cookieValue.startsWith(`SID-${namespace}-`)) {
    return { sessionId: cookieValue, minted: false };
  }

  // Fall back to header (for internal calls)
  if (headerValue && isValidSid(headerValue) && headerValue.startsWith(`SID-${namespace}-`)) {
    return { sessionId: headerValue, minted: false };
  }

  // Mint new session
  return { sessionId: newSessionId(namespace), minted: true };
}

/**
 * Validate the operational IDs (SID, REF, API) match the namespace
 * This is the bouncer validation - ONLY checks operational IDs, not entity IDs
 */
function validateOperationalIds(
  envelope: Envelope,
): { valid: boolean; error?: string } {
  const ns = envelope.namespace;

  // SID must start with SID-{ns}-
  if (!envelope.sessionId.startsWith(`SID-${ns}-`)) {
    return {
      valid: false,
      error: `Session ID '${envelope.sessionId}' does not match namespace '${ns}'`,
    };
  }

  // REF must start with REF-{ns}-
  if (!envelope.featureId.startsWith(`REF-${ns}-`)) {
    return {
      valid: false,
      error: `Feature ID '${envelope.featureId}' does not match namespace '${ns}'`,
    };
  }

  // API must start with API-{ns}-
  if (!envelope.operationId.startsWith(`API-${ns}-`)) {
    return {
      valid: false,
      error: `Operation ID '${envelope.operationId}' does not match namespace '${ns}'`,
    };
  }

  // TID must start with TID-{ns}- (if present)
  if (envelope.traceId && !envelope.traceId.startsWith(`TID-${ns}-`)) {
    return {
      valid: false,
      error: `Trace ID '${envelope.traceId}' does not match namespace '${ns}'`,
    };
  }

  return { valid: true };
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
    const method = req.method;

    // Step 1: Determine namespace STRICTLY - no silent defaults
    const namespace = options?.namespace ?? detectNamespace(pathname);
    if (!namespace) {
      return envelopeError(
        "UNKNOWN_NAMESPACE",
        `Cannot determine namespace for path '${pathname}'. Expected /api/admin/* or /api/dealer/*`,
        400,
      );
    }

    // Step 2: Resolve operation from TS registry
    const opKey = `${method}:${pathname}`;
    const operationId = resolveOperationId(method, pathname, namespace);
    if (!operationId) {
      return envelopeError(
        "UNREGISTERED_OPERATION",
        `Operation '${opKey}' is not registered in OPERATIONS registry for namespace '${namespace}'`,
        400,
      );
    }

    // Verify operation namespace matches route namespace
    if (!operationId.startsWith(`API-${namespace}-`)) {
      return envelopeError(
        "ENVELOPE_MISMATCH",
        `Operation '${operationId}' namespace does not match route namespace '${namespace}'`,
        403,
      );
    }

    // Step 3: Resolve feature ID
    const featureId = resolveFeatureId(pathname, namespace);
    if (!featureId) {
      return envelopeError(
        "UNREGISTERED_FEATURE",
        `Feature for path '${pathname}' is not registered in FEATURES registry`,
        400,
      );
    }

    // Namespace header bouncer check (for internal forwarded requests)
    const incomingNamespace = normalizeHeader(req.headers.get(NAMESPACE_HEADER));
    if (incomingNamespace && incomingNamespace !== namespace) {
      return envelopeError(
        "ENVELOPE_MISMATCH",
        `Incoming namespace header '${incomingNamespace}' does not match route namespace '${namespace}'`,
        403,
      );
    }

    // Step 4: Determine Trace ID
    const { traceId, minted: tidMinted } = determineTraceId(
      namespace,
      req.headers.get(TRACE_HEADER),
    );

    // Step 5: Session cookie handling - namespace-specific cookies
    const cookieName = getSessionCookieName(namespace);
    const sessionCookie = req.cookies.get(cookieName)?.value;
    const { sessionId, minted: isNewSession } = determineSessionId(
      namespace,
      sessionCookie,
      req.headers.get(SESSION_HEADER),
    );

    // Step 6: Build envelope
    const envelope: Envelope = buildEnvelope({
      namespace,
      traceId,
      sessionId,
      featureId,
      operationId,
      method,
      path: pathname,
    });

    // Step 7: Enforce bouncer - validate all operational IDs
    const validation = validateOperationalIds(envelope);
    if (!validation.valid) {
      return envelopeError("ENVELOPE_MISMATCH", validation.error!, 403);
    }

    // Additional built-in validations
    try {
      assertNamespaceMatches(envelope, namespace);
      assertTraceIdNamespaceMatches(envelope);
    } catch (error) {
      return envelopeError("ENVELOPE_MISMATCH", (error as Error).message, 403);
    }

    // Log envelope creation
    console.info("[ENVELOPE]", JSON.stringify({
      ns: envelope.namespace,
      tid: envelope.traceId,
      sid: envelope.sessionId,
      ref: envelope.featureId,
      api: envelope.operationId,
      path: pathname,
      method,
      tidMinted,
      isNewSession,
      timestamp: new Date().toISOString(),
    }));

    // Step 8: Execute handler inside AsyncLocalStorage
    return runWithContext(envelope, async () => {
      const response = await handler(req, context);
      const nextResponse =
        response instanceof NextResponse
          ? response
          : new NextResponse(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            });

      // Set all envelope headers on response
      nextResponse.headers.set(TRACE_HEADER, traceId);
      nextResponse.headers.set(NAMESPACE_HEADER, namespace);
      nextResponse.headers.set(SESSION_HEADER, sessionId);
      nextResponse.headers.set(FEATURE_HEADER, featureId);
      nextResponse.headers.set(OPERATION_HEADER, operationId);

      // Step 9: Set namespace-specific session cookie if new session
      if (isNewSession) {
        nextResponse.cookies.set(cookieName, sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          // Session cookie - no maxAge means it expires when browser closes
          // For persistent sessions, add: maxAge: 60 * 60 * 24 * 7 // 7 days
        });
      }

      return nextResponse;
    });
  };
}

/**
 * Export header constants for external use
 */
export const ENVELOPE_HEADERS = {
  TRACE: TRACE_HEADER,
  SESSION: SESSION_HEADER,
  NAMESPACE: NAMESPACE_HEADER,
  FEATURE: FEATURE_HEADER,
  OPERATION: OPERATION_HEADER,
} as const;

/**
 * Export cookie name helper for external use
 */
export { getSessionCookieName };
