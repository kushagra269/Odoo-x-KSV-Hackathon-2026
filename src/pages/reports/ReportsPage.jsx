import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { reportsApi } from "../../api/reportsApi";
import { Button } from "../../components/ui/Button";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { useUiStore } from "../../store/uiStore";
import { downloadCsv } from "../../utils/downloads";
import { formatCurrency } from "../../utils/formatters";

export function ReportsPage() {
  const pushToast = useUiStore((state) => state.pushToast);
  const { data } = useQuery({
    queryKey: ["reports"],
    queryFn: reportsApi.getOverview,
  });

  const maxCategoryAmount = Math.max(...(data?.categorySpend || [{ amount: 1 }]).map((item) => item.amount), 1);
  const maxTrendAmount = Math.max(...(data?.monthlyTrend || [{ value: 1 }]).map((item) => item.value), 1);

  return (
    <div className="page-stack">
      <section className="page-header-card">
        <div>
          <h2>Reports & Analytics</h2>
          <p>Procurement insights for {data?.month} with spend, vendor performance, and operational trends.</p>
        </div>
        <div className="page-actions page-actions--inline">
          <Button
            variant="secondary"
            onClick={() =>
              pushToast({
                tone: "info",
                title: "Period filter",
                description: "Monthly report filters are interactive and ready for live backend data.",
              })
            }
          >
            May 2026
          </Button>
          <Button
            onClick={() =>
              downloadCsv("vendorbridge-report.csv", [
                ["Section", "Label", "Value"],
                ...(data?.stats || []).map((stat) => ["Stats", stat.label, stat.value]),
                ...(data?.topVendors || []).map((vendor) => ["Top Vendor", vendor.vendor, vendor.spend]),
              ])
            }
          >
            <Download size={16} />
            Export
          </Button>
        </div>
      </section>

      <section className="stats-grid">
        {data?.stats?.map((stat) => (
          <SurfaceCard key={stat.label} className={`stat-card stat-card--${stat.tone}`}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </SurfaceCard>
        ))}
      </section>

      <section className="reports-grid">
        <SurfaceCard>
          <h3>Spend by category</h3>
          <div className="category-bars">
            {data?.categorySpend?.map((item) => (
              <div key={item.name} className="category-bars__item">
                <div className="category-bars__label">
                  <span>{item.name}</span>
                  <strong>{formatCurrency(item.amount)}</strong>
                </div>
                <div className="category-bars__track">
                  <div
                    className={`category-bars__fill category-bars__fill--${item.tone}`}
                    style={{ width: `${(item.amount / maxCategoryAmount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <h3>Top vendors by spend</h3>
          <div className="data-table">
            <div className="data-table__row data-table__row--head data-table__row--top-vendors">
              <span>Vendor</span>
              <span>Spend</span>
              <span>POs</span>
            </div>
            {data?.topVendors?.map((vendor) => (
              <div key={vendor.vendor} className="data-table__row data-table__row--top-vendors">
                <span>{vendor.vendor}</span>
                <span>{formatCurrency(vendor.spend)}</span>
                <span>{vendor.poCount}</span>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="reports-grid__wide">
          <h3>Monthly procurement trend</h3>
          <div className="mini-chart mini-chart--wide">
            {data?.monthlyTrend?.map((item) => (
              <div key={item.month} className="mini-chart__bar-group">
                <div className="mini-chart__bar-track">
                  <div
                    className="mini-chart__bar mini-chart__bar--blue"
                    style={{ height: `${(item.value / maxTrendAmount) * 100}%` }}
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
