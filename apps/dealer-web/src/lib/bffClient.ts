type RequestParams = Record<string, string | number | boolean | undefined | null>;

type BffOptions = {
  params?: RequestParams;
  headers?: Record<string, string>;
  responseType?: "json" | "blob";
};

type BffResponse<T> = {
  data: T;
  status: number;
  headers: Headers;
};

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
const NAMESPACE = process.env.NEXT_PUBLIC_APP_NAMESPACE || "D";
const BFF_BASE = `${BASE_URL}/api/bff/v1`;

const buildUrl = (path: string, params?: RequestParams): string => {
  const url = new URL(`${BFF_BASE}${path.startsWith("/") ? path : `/${path}`}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
};

const unwrapPayload = <T>(payload: unknown): T => {
  if (payload && typeof payload === "object" && "ok" in payload && "data" in payload) {
    const typed = payload as { ok: boolean; data: T };
    if (typed.ok) {
      return typed.data;
    }
  }
  return payload as T;
};

async function request<T>(
  method: string,
  path: string,
  options?: BffOptions,
  body?: BodyInit | null,
): Promise<BffResponse<T>> {
  const url = buildUrl(path, options?.params);
  const headers: Record<string, string> = {
    "X-App-Namespace": NAMESPACE,
    ...(options?.headers || {}),
  };

  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
    credentials: "include",
  });

  const data =
    options?.responseType === "blob"
      ? await response.blob()
      : unwrapPayload<T>(await response.json());

  return { data, status: response.status, headers: response.headers };
}

export const bffClient = {
  get: <T>(path: string, options?: BffOptions) => request<T>("GET", path, options),
  delete: <T>(path: string, options?: BffOptions) => request<T>("DELETE", path, options),
  post: <T>(path: string, body?: unknown, options?: BffOptions) =>
    request<T>(
      "POST",
      path,
      options,
      body instanceof FormData ? body : body ? JSON.stringify(body) : null,
    ),
  patch: <T>(path: string, body?: unknown, options?: BffOptions) =>
    request<T>(
      "PATCH",
      path,
      options,
      body instanceof FormData ? body : body ? JSON.stringify(body) : null,
    ),
};
