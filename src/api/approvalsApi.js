import http, { useMocks } from "./http";
import { mockApi } from "./mockApi";

export const approvalsApi = {
  getOne: async () => {
    if (useMocks) return mockApi.getApproval();
    const { data } = await http.get("/approvals");
    return data?.items?.[0] ?? data;
  },
  act: async (payload) => {
    if (useMocks) return mockApi.actOnApproval(payload);
    const { data } = await http.post(`/approvals/${payload.id}/steps/${payload.stepId}/${payload.action}`);
    return data;
  },
};
