import http, { useMocks } from "./http";
import { mockApi } from "./mockApi";

export const dashboardApi = {
  getOverview: async () => {
    if (useMocks) return mockApi.getDashboard();
    const { data } = await http.get("/reports/dashboard-stats");
    return data;
  },
};
