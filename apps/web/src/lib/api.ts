import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";
const BFF_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/bff/v1";

// BFF API client for admin/dealer endpoints, proxied through the web app by default.
const api = axios.create({
  baseURL: BFF_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const url = `${config.url || ""}`;
  if (url.startsWith("/dealer")) {
    config.headers["X-App-Namespace"] = "D";
  } else if (url.startsWith("/admin")) {
    config.headers["X-App-Namespace"] = "A";
  }

  return config;
});

// Auth API client for /auth endpoints (no BFF prefix)
export const authApi = axios.create({
  baseURL: API_BASE,
});

export default api;
