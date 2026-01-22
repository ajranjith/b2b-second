import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/bff/v1",
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use((response) => {
  const payload = response.data as any;
  if (payload && typeof payload === "object" && "ok" in payload) {
    if (payload.ok && "data" in payload) {
      return { ...response, data: payload.data };
    }
  }
  return response;
});

export default api;
