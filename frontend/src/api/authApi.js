import http, { useMocks } from "./http";
import { mockApi } from "./mockApi";

export const authApi = {
  login: async (payload) => {
    if (useMocks) return mockApi.login(payload);
    const { data } = await http.post("/auth/login", payload);
    return data;
  },
  register: async (payload) => {
    if (useMocks) return mockApi.register(payload);
    const { data } = await http.post("/auth/register", payload);
    return data;
  },
};
