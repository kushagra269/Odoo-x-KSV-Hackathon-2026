import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Clock3, FileText, ReceiptText, Users } from "lucide-react";
import { activityApi } from "../../api/activityApi";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { formatDate } from "../../utils/formatters";

const tabs = [
  { key: "all", label: "All", icon: Activity },
  { key: "rfq", label: "RFQ", icon: FileText },
  { key: "approval", label: "Approvals", icon: Clock3 },
  { key: "invoice", label: "Invoices", icon: ReceiptText },
  { key: "vendor", label: "Vendors", icon: Users },
];

export function ActivityPage() {
  const [filter, setFilter] = useState("all");
  const { data } = useQuery({
    queryKey: ["activity", filter],
    queryFn: () => activityApi.getAll(filter),
  });

  return (
    <div className="page-stack">
      <section className="page-header-card">
        <div>
          <h2>Activity & Logs</h2>
          <p>Procurement audit trail across RFQs, approvals, invoices, and vendor updates.</p>
        </div>
      </section>

      <SurfaceCard>
        <div className="filter-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                className={`filter-tabs__item ${filter === tab.key ? "filter-tabs__item--active" : ""}`}
                onClick={() => setFilter(tab.key)}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="timeline">
          {data?.map((item) => (
            <article key={item.id} className="timeline__item">
              <div className={`timeline__dot timeline__dot--${item.tone}`} />
              <div>
                <strong>{item.action}</strong>
                <p>{formatDate(item.created_at, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</p>
              </div>
            </article>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
