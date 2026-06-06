import { Bell, Search } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { getInitials } from "../../utils/formatters";

const pageLabels = {
  "/dashboard": "Command Center",
  "/vendors": "Vendor Network",
  "/rfqs/create": "RFQ Studio",
  "/quotations/submit": "Quotation Desk",
  "/quotations/compare": "Comparison Room",
  "/approvals": "Approval Flow",
  "/invoices": "Purchase Orders & Invoices",
  "/activity": "Activity Timeline",
  "/reports": "Reports & Insights",
};

export function Topbar() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();

  return (
    <header className="topbar">
      <div>
        <p className="topbar__eyebrow">Today&apos;s workspace</p>
        <h1>{pageLabels[location.pathname] || "VendorBridge"}</h1>
      </div>

      <div className="topbar__actions">
        <label className="topbar__search">
          <Search size={16} />
          <input placeholder="Search vendor, RFQ, PO..." />
        </label>
        <button className="topbar__icon" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <div className="topbar__profile">
          <div>
            <strong>{fullName}</strong>
            <span>{user?.role?.replaceAll("_", " ")}</span>
          </div>
          <div className="topbar__avatar">{getInitials(fullName)}</div>
        </div>
      </div>
    </header>
  );
}
