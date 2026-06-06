import http, { useMocks } from "./http";
import { mockApi } from "./mockApi";

export const invoicesApi = {
  getOne: async () => {
    if (useMocks) return mockApi.getInvoice();
    const { data } = await http.get("/invoices");
    return data?.items?.[0] ?? data;
  },
  markPaid: async (id) => {
    if (useMocks) return mockApi.markInvoicePaid(id);
    const { data } = await http.patch(`/invoices/${id}/mark-paid`);
    return data;
  },
};
