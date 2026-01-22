/**
 * BFF Client for internal service calls
 *
 * This client automatically forwards trace context (X-Trace-Id, X-Session-Id, etc.)
 * on every internal request to ensure distributed tracing works correctly.
 *
 * IMPORTANT: Use adminFetch() for admin routes and dealerFetch() for dealer routes.
 * These enforce namespace isolation at the client level.
 */

import { Namespace } from "@repo/identity";
import { getContext, getTraceIdOrThrow } from "./runtimeContext";

const TRACE_HEADER = "x-trace-id";
const SESSION_HEADER = "x-session-id";
const NAMESPACE_HEADER = "x-app-namespace";
const FEATURE_HEADER = "x-feature-id";
const OPERATION_HEADER = "x-operation-id";

export interface BffClientOptions {
  baseUrl?: string;
  /** Required namespace for this client - enforces namespace isolation */
  namespace?: Namespace;
}

export interface BffRequestOptions extends RequestInit {
  /** Skip trace ID validation - NEVER use in production code */
  skipTraceValidation?: boolean;
}

/**
 * Get the trace headers from the current context
 * Throws if trace ID is not available or namespace mismatch
 */
function getTraceHeaders(requiredNamespace?: Namespace): Record<string, string> {
  const ctx = getContext();

  // Always enforce trace ID presence
  getTraceIdOrThrow();

  if (!ctx) {
    throw new Error("BffClientContextMissing: Cannot make internal request without runtime context");
  }

  // Enforce namespace if specified
  if (requiredNamespace && ctx.namespace !== requiredNamespace) {
    throw new Error(
      `BffClientNamespaceMismatch: Current context namespace '${ctx.namespace}' does not match required namespace '${requiredNamespace}'`,
    );
  }

  return {
    [TRACE_HEADER]: ctx.traceId,
    [SESSION_HEADER]: ctx.sessionId,
    [NAMESPACE_HEADER]: ctx.namespace,
    [FEATURE_HEADER]: ctx.featureId,
    [OPERATION_HEADER]: ctx.operationId,
  };
}

/**
 * Get trace headers with optional validation skip (use sparingly)
 */
function getTraceHeadersOptional(skipValidation = false): Record<string, string> {
  const ctx = getContext();

  if (!skipValidation) {
    getTraceIdOrThrow();
  }

  if (!ctx) {
    if (skipValidation) {
      return {};
    }
    throw new Error("BffClientContextMissing: Cannot make internal request without runtime context");
  }

  return {
    [TRACE_HEADER]: ctx.traceId,
    [SESSION_HEADER]: ctx.sessionId,
    [NAMESPACE_HEADER]: ctx.namespace,
    [FEATURE_HEADER]: ctx.featureId,
    [OPERATION_HEADER]: ctx.operationId,
  };
}

/**
 * Create a BFF client for internal service calls
 * @param options.namespace - If specified, enforces namespace isolation
 */
export function createBffClient(options: BffClientOptions = {}) {
  const baseUrl = options.baseUrl || process.env.INTERNAL_API_URL || "";
  const requiredNamespace = options.namespace;

  return {
    /**
     * Make a GET request with trace context
     */
    async get<T = unknown>(path: string, requestOptions?: BffRequestOptions): Promise<T> {
      const traceHeaders = requestOptions?.skipTraceValidation
        ? getTraceHeadersOptional(true)
        : getTraceHeaders(requiredNamespace);
      const url = `${baseUrl}${path}`;

      const response = await fetch(url, {
        ...requestOptions,
        method: "GET",
        headers: {
          ...traceHeaders,
          ...requestOptions?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`BffClientError: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },

    /**
     * Make a POST request with trace context
     */
    async post<T = unknown>(
      path: string,
      body?: unknown,
      requestOptions?: BffRequestOptions,
    ): Promise<T> {
      const traceHeaders = requestOptions?.skipTraceValidation
        ? getTraceHeadersOptional(true)
        : getTraceHeaders(requiredNamespace);
      const url = `${baseUrl}${path}`;

      const response = await fetch(url, {
        ...requestOptions,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...traceHeaders,
          ...requestOptions?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`BffClientError: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },

    /**
     * Make a PUT request with trace context
     */
    async put<T = unknown>(
      path: string,
      body?: unknown,
      requestOptions?: BffRequestOptions,
    ): Promise<T> {
      const traceHeaders = requestOptions?.skipTraceValidation
        ? getTraceHeadersOptional(true)
        : getTraceHeaders(requiredNamespace);
      const url = `${baseUrl}${path}`;

      const response = await fetch(url, {
        ...requestOptions,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...traceHeaders,
          ...requestOptions?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`BffClientError: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },

    /**
     * Make a PATCH request with trace context
     */
    async patch<T = unknown>(
      path: string,
      body?: unknown,
      requestOptions?: BffRequestOptions,
    ): Promise<T> {
      const traceHeaders = requestOptions?.skipTraceValidation
        ? getTraceHeadersOptional(true)
        : getTraceHeaders(requiredNamespace);
      const url = `${baseUrl}${path}`;

      const response = await fetch(url, {
        ...requestOptions,
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...traceHeaders,
          ...requestOptions?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`BffClientError: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },

    /**
     * Make a DELETE request with trace context
     */
    async delete<T = unknown>(path: string, requestOptions?: BffRequestOptions): Promise<T> {
      const traceHeaders = requestOptions?.skipTraceValidation
        ? getTraceHeadersOptional(true)
        : getTraceHeaders(requiredNamespace);
      const url = `${baseUrl}${path}`;

      const response = await fetch(url, {
        ...requestOptions,
        method: "DELETE",
        headers: {
          ...traceHeaders,
          ...requestOptions?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`BffClientError: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },

    /**
     * Get the current trace headers for manual use
     */
    getTraceHeaders,
  };
}

/**
 * Default BFF client instance (no namespace enforcement)
 * Use adminClient or dealerClient for namespace-isolated calls
 */
export const bffClient = createBffClient();

/**
 * Admin-specific BFF client - enforces Admin namespace
 * Throws BffClientNamespaceMismatch if called from Dealer context
 */
export const adminClient = createBffClient({ namespace: "A" });

/**
 * Dealer-specific BFF client - enforces Dealer namespace
 * Throws BffClientNamespaceMismatch if called from Admin context
 */
export const dealerClient = createBffClient({ namespace: "D" });

/**
 * Type-safe fetch functions for namespace isolation
 */
export type BffFetchFn = ReturnType<typeof createBffClient>;

/**
 * Get the namespace-appropriate BFF client
 * @throws if namespace is invalid
 */
export function bffFetch(namespace: Namespace): BffFetchFn {
  switch (namespace) {
    case "A":
      return adminClient;
    case "D":
      return dealerClient;
    default:
      throw new Error(`BffClientInvalidNamespace: Unknown namespace '${namespace}'`);
  }
}

/**
 * Convenience function to make admin API calls
 * Enforces Admin namespace isolation
 */
export const adminFetch = adminClient;

/**
 * Convenience function to make dealer API calls
 * Enforces Dealer namespace isolation
 */
export const dealerFetch = dealerClient;

/**
 * Export header constants for consistency
 */
export const HEADERS = {
  TRACE: TRACE_HEADER,
  SESSION: SESSION_HEADER,
  NAMESPACE: NAMESPACE_HEADER,
  FEATURE: FEATURE_HEADER,
  OPERATION: OPERATION_HEADER,
} as const;
