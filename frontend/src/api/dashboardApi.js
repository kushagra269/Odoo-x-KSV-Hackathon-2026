import http, { useMocks } from "./http";
import { mockApi } from "./mockApi";

export const dashboardApi = {
  getOverview: async () => {
    if (useMocks) return mockApi.getDashboard();
    const [dashboardRes, trendRes, purchaseOrdersRes] = await Promise.all([
      http.get("/reports/dashboard-stats"),
      http.get("/reports/spending-summary"),
      http.get("/purchase-orders", { params: { limit: 5 } }),
    ]);

    return {
      stats: dashboardRes.data.stats,
      trend: trendRes.data.spending_summary,
      recentPurchaseOrders: purchaseOrdersRes.data.purchase_orders,
    };
  },
};
