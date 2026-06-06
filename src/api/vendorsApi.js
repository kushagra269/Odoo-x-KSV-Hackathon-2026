import http, { useMocks } from "./http";
import { mockApi } from "./mockApi";

export const vendorsApi = {
  getAll: async (filters) => {
    if (useMocks) return mockApi.getVendors(filters);
    const { data } = await http.get("/vendors", { params: filters });
    return data;
  },
  create: async (payload) => {
    if (useMocks) return mockApi.createVendor(payload);
    const { data } = await http.post("/vendors", payload);
    return data;
  },
};
