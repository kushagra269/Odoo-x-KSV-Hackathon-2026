import http, { useMocks } from "./http";
import { mockApi } from "./mockApi";

export const reportsApi = {
  getOverview: async (month) => {
    if (useMocks) return mockApi.getReports();
    const params = month ? { month } : {};
    const [spendingSummary, vendorPerformance, procurementStats] = await Promise.all([
      http.get("/reports/spending-summary"),
      http.get("/reports/vendor-performance", { params }),
      http.get("/reports/procurement-stats", { params }),
    ]);

    const trendRows = spendingSummary.data.spending_summary || [];
    const vendorRows = vendorPerformance.data.vendor_performance || [];
    const stats = procurementStats.data.procurement_stats || {};
    const categoryMap = vendorRows.reduce((acc, vendor) => {
      acc[vendor.category] = (acc[vendor.category] || 0) + Number(vendor.total_spend || 0);
      return acc;
    }, {});
    const tones = ["green", "blue", "gold", "rose"];

    return {
      month: month
        ? new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(new Date(`${month}-01T00:00:00.000Z`))
        : trendRows.at(-1)?.month || "Current period",
      availableMonths: trendRows.map((row) => ({
        label: row.month,
        value: new Date(row.month_date).toISOString().slice(0, 7),
      })),
      stats: [
        { label: "Total RFQs", value: stats.total_rfqs || 0, tone: "blue" },
        { label: "Total POs", value: stats.total_pos || 0, tone: "green" },
        { label: "Invoice Value", value: stats.total_invoice_value || 0, tone: "gold" },
        { label: "Active Vendors", value: stats.active_vendors || 0, tone: "rose" },
      ],
      categorySpend: Object.entries(categoryMap).map(([name, amount], index) => ({
        name,
        amount,
        tone: tones[index % tones.length],
      })),
      topVendors: vendorRows.slice(0, 5).map((vendor) => ({
        vendor: vendor.vendor_name,
        spend: Number(vendor.total_spend || 0),
        poCount: Number(vendor.total_pos || 0),
      })),
      monthlyTrend: trendRows.map((row) => ({
        month: row.month,
        value: Number(row.total || 0),
      })),
    };
  },
};
