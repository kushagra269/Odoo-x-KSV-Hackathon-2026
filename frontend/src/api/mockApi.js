import {
  activities,
  approval,
  currentUser,
  dashboardStats,
  invoice,
  quotations,
  recentPurchaseOrders,
  reports,
  rfqDraft,
  spendingTrend,
  vendors,
} from "../data/mockDatabase";

const sleep = (ms = 280) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  async login(payload) {
    await sleep();
    return {
      user: {
        ...currentUser,
        email: payload.email,
      },
      accessToken: "demo-access-token",
    };
  },
  async register(payload) {
    await sleep(450);
    return {
      user: {
        id: "usr-new-001",
        ...payload,
      },
      accessToken: "demo-access-token",
    };
  },
  async getDashboard() {
    await sleep();
    return {
      stats: dashboardStats,
      trend: spendingTrend,
      recentPurchaseOrders,
    };
  },
  async getVendors(filters = {}) {
    await sleep();
    const search = (filters.search || "").toLowerCase();
    const status = filters.status || "all";

    const filtered = vendors.filter((vendor) => {
      const matchesStatus = status === "all" ? true : vendor.status === status;
      const haystack = `${vendor.vendor_name} ${vendor.gst_number} ${vendor.category}`.toLowerCase();
      const matchesSearch = search ? haystack.includes(search) : true;
      return matchesStatus && matchesSearch;
    });

    const counts = vendors.reduce(
      (acc, vendor) => {
        acc.all += 1;
        acc[vendor.status] += 1;
        return acc;
      },
      { all: 0, active: 0, pending: 0, blocked: 0 }
    );

    return { items: filtered, counts };
  },
  async createVendor(payload) {
    await sleep(400);
    return {
      ...payload,
      id: `ven-${Date.now()}`,
      status: "pending",
      rating: 0,
    };
  },
  async getRFQ() {
    await sleep();
    return rfqDraft;
  },
  async saveRFQ(payload) {
    await sleep(500);
    return { ...rfqDraft, ...payload };
  },
  async getQuotations() {
    await sleep();
    return quotations;
  },
  async submitQuotation(payload) {
    await sleep(500);
    return payload;
  },
  async getApproval() {
    await sleep();
    return approval;
  },
  async actOnApproval(payload) {
    await sleep(350);
    return payload;
  },
  async getInvoice() {
    await sleep();
    return invoice;
  },
  async markInvoicePaid() {
    await sleep(280);
    return { ...invoice, status: "paid" };
  },
  async getActivity(filter = "all") {
    await sleep();
    return filter === "all" ? activities : activities.filter((item) => item.entity_type === filter);
  },
  async getReports() {
    await sleep();
    return reports;
  },
};
