import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
export const useMocks = import.meta.env.VITE_USE_MOCKS === "true";

const http = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
});

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default http;
