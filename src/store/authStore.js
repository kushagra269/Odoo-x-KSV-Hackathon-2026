import { create } from "zustand";

const procurementOfficer = {
  id: "usr-po-001",
  first_name: "Harshal",
  last_name: "Patel",
  email: "harshal@vendorbridge.demo",
  role: "procurement_officer",
  country: "India",
  phone: "+91 98989 45000",
  organization: "VendorBridge Procurement",
};

export const useAuthStore = create((set) => ({
  user: procurementOfficer,
  accessToken: "demo-access-token",
  isAuthenticated: true,
  setAuth: (user, token) =>
    set({
      user,
      accessToken: token,
      isAuthenticated: true,
    }),
  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    }),
}));
