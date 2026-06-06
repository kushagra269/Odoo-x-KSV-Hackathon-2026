import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MoveUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { dashboardApi } from "../../api/dashboardApi";
import { Button } from "../../components/ui/Button";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useAuthStore } from "../../store/authStore";
import { formatCompactCurrency, formatCurrency } from "../../utils/formatters";

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: dashboardApi.getOverview,
  });

  const stats = [
    { label: "Active RFQs", value: data?.stats.active_rfqs ?? 0, tone: "blue" },
    { label: "Pending Approvals", value: data?.stats.pending_approvals ?? 0, tone: "gold" },
    { label: "POs this month", value: formatCompactCurrency(data?.stats.po_this_month_total), tone: "green" },
    { label: "Overdue invoices", value: data?.stats.overdue_invoices ?? 0, tone: "rose" },
  ];

  const trend = data?.trend || [];
  const recentPurchaseOrders = data?.recentPurchaseOrders || [];
  const maxTrendValue = Math.max(...(trend.length ? trend : [{ total: 1 }]).map((item) => Number(item.total)), 1);
  const roleLabel = user?.role?.replaceAll("_", " ") || "team";

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="hero-panel__eyebrow">Welcome back, {user?.first_name}</p>
          <h2>{roleLabel} dashboard for today</h2>
          <p>
            Track approvals, monitor purchase velocity, and move vendor conversations
            forward without losing operational detail.
          </p>
        </div>
        <div className="hero-panel__actions">
          <Button size="lg" onClick={() => navigate("/rfqs/create")}>
            Create new RFQ
          </Button>
          <Button variant="secondary" size="lg" onClick={() => navigate("/vendors")}>
            Review vendors
          </Button>
        </div>
      </section>

      {isError && (
        <SurfaceCard className="notice-card">
          <div>
            <h3>Dashboard data is unavailable</h3>
            <p>Check that the VendorBridge API is running on the configured backend URL.</p>
          </div>
          <Button variant="secondary" onClick={() => refetch()}>
            Retry
          </Button>
        </SurfaceCard>
      )}

      <section className="stats-grid">
        {stats.map((stat) => (
          <SurfaceCard key={stat.label} className={`stat-card stat-card--${stat.tone}`}>
            <span>{stat.label}</span>
            <strong>{isLoading ? "..." : stat.value}</strong>
            <small>
              <MoveUpRight size={14} />
              {isLoading ? "Loading live data" : "Synced from backend"}
            </small>
          </SurfaceCard>
        ))}
      </section>

      <section className="dashboard-grid">
        <SurfaceCard className="table-card">
          <div className="section-heading">
            <div>
              <p className="section-heading__eyebrow">Live operations</p>
              <h3>Recent purchase orders</h3>
            </div>
            <Button variant="ghost" onClick={() => navigate("/invoices")}>
              See all
            </Button>
          </div>

          <div className="data-table">
            <div className="data-table__row data-table__row--head">
              <span>PO#</span>
              <span>Vendor</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            {isLoading && <div className="empty-state">Loading recent purchase orders...</div>}
            {!isLoading && recentPurchaseOrders.length === 0 && <div className="empty-state">No purchase orders found.</div>}
            {recentPurchaseOrders.map((item) => (
              <div key={item.id || item.po_number} className="data-table__row data-table__row--dashboard-pos">
                <span>{item.po_number}</span>
                <span>{item.vendor_name}</span>
                <span>{formatCurrency(item.grand_total)}</span>
                <StatusBadge status={item.status}>{item.status}</StatusBadge>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="trend-card">
          <div className="section-heading">
            <div>
              <p className="section-heading__eyebrow">Finance pulse</p>
              <h3>Spending trend</h3>
            </div>
            <button className="text-button" onClick={() => navigate("/reports")}>
              View report <ArrowRight size={14} />
            </button>
          </div>

          <div className="mini-chart">
            {isLoading && <div className="empty-state">Loading spending trend...</div>}
            {!isLoading && trend.length === 0 && <div className="empty-state">No spending data yet.</div>}
            {trend.map((item) => (
              <div key={item.month} className="mini-chart__bar-group">
                <div className="mini-chart__bar-track">
                  <div
                    className="mini-chart__bar"
                    style={{ height: `${(Number(item.total) / maxTrendValue) * 100}%` }}
                  />
                </div>
                <span>{item.month}</span>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
