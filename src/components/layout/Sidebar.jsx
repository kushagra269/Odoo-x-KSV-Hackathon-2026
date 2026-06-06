import {
  LayoutDashboard,
  Users,
  FilePlus2,
  BadgeIndianRupee,
  ShieldCheck,
  ReceiptText,
  Activity,
  BarChart3,
  Settings,
  UserCircle2,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/vendors", label: "Vendors", icon: Users },
  { to: "/rfqs/create", label: "RFQs", icon: FilePlus2 },
  { to: "/quotations/compare", label: "Quotations", icon: BadgeIndianRupee },
  { to: "/approvals", label: "Approvals", icon: ShieldCheck },
  { to: "/invoices", label: "Invoices", icon: ReceiptText },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/activity", label: "Activity", icon: Activity },
];

const utilityItems = [
  { to: "/account", label: "Account", icon: UserCircle2 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-mark">VB</div>
        <div>
          <p>VendorBridge</p>
          <span>Procurement Suite</span>
        </div>
      </div>

      <nav className="sidebar__nav">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar__link ${isActive ? "sidebar__link--active" : ""}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <nav className="sidebar__nav sidebar__nav--utility">
          {utilityItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar__link sidebar__link--utility ${isActive ? "sidebar__link--active" : ""}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
