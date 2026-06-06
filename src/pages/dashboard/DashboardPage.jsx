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
  const { data } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: dashboardApi.getOverview,
  });

  const stats = [
    { label: "Active RFQs", value: data?.stats.active_rfqs ?? 0, tone: "blue" },
    { label: "Pending Approvals", value: data?.stats.pending_approvals ?? 0, tone: "gold" },
    { label: "POs this month", value: formatCompactCurrency(data?.stats.po_this_month_value), tone: "green" },
    { label: "Overdue invoices", value: data?.stats.overdue_invoices ?? 0, tone: "rose" },
  ];

  const maxTrendValue = Math.max(...(data?.trend || [{ value: 1 }]).map((item) => item.value), 1);

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="hero-panel__eyebrow">Welcome back, {user?.first_name}</p>
          <h2>Procurement Officer dashboard for today</h2>
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

      <section className="stats-grid">
        {stats.map((stat) => (
          <SurfaceCard key={stat.label} className={`stat-card stat-card--${stat.tone}`}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>
              <MoveUpRight size={14} />
              Updated moments ago
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
            <Button variant="ghost">See all</Button>
          </div>

          <div className="data-table">
            <div className="data-table__row data-table__row--head">
              <span>PO#</span>
              <span>Vendor</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            {data?.recentPurchaseOrders?.map((item) => (
              <div key={item.po_number} className="data-table__row">
                <span>{item.po_number}</span>
                <span>{item.vendor_name}</span>
                <span>{formatCurrency(item.amount)}</span>
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
            <button className="text-button">
              View report <ArrowRight size={14} />
            </button>
          </div>

          <div className="mini-chart">
            {data?.trend?.map((item) => (
              <div key={item.month} className="mini-chart__bar-group">
                <div className="mini-chart__bar-track">
                  <div
                    className="mini-chart__bar"
                    style={{ height: `${(item.value / maxTrendValue) * 100}%` }}
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
