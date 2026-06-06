import http, { useMocks } from "./http";
import { mockApi } from "./mockApi";

export const quotationsApi = {
  getAll: async () => {
    if (useMocks) return mockApi.getQuotations();
    const { data } = await http.get("/quotations");
    return data;
  },
  submit: async (payload) => {
    if (useMocks) return mockApi.submitQuotation(payload);
    const { data } = await http.post("/quotations", payload);
    return data;
  },
};
