import http, { useMocks } from "./http";
import { mockApi } from "./mockApi";

export const reportsApi = {
  getOverview: async () => {
    if (useMocks) return mockApi.getReports();
    const [spendingSummary, vendorPerformance, procurementStats] = await Promise.all([
      http.get("/reports/spending-summary"),
      http.get("/reports/vendor-performance"),
      http.get("/reports/procurement-stats"),
    ]);

    return {
      spendingSummary: spendingSummary.data,
      vendorPerformance: vendorPerformance.data,
      procurementStats: procurementStats.data,
    };
  },
};
