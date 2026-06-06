import http, { useMocks } from "./http";
import { mockApi } from "./mockApi";

export const rfqApi = {
  getOne: async () => {
    if (useMocks) return mockApi.getRFQ();
    const { data } = await http.get("/rfqs");
    return data?.items?.[0] ?? data;
  },
  save: async (payload) => {
    if (useMocks) return mockApi.saveRFQ(payload);
    const { data } = await http.post("/rfqs", payload);
    return data;
  },
};
