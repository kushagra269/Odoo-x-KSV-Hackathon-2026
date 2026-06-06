import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { quotationsApi } from "../../api/quotationsApi";
import { Button } from "../../components/ui/Button";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { formatCurrency } from "../../utils/formatters";

export function QuotationComparisonPage() {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["quotation-comparison"],
    queryFn: quotationsApi.getAll,
  });

  const lowest = [...(data || [])].sort((a, b) => a.grand_total - b.grand_total)[0];

  const rows = [
    { label: "Grand Total", key: "grand_total", formatter: formatCurrency },
    { label: "GST %", key: "gst_percentage", formatter: (value) => `${value}%` },
    { label: "Delivery (days)", key: "delivery_days", formatter: (value) => value },
    { label: "Vendor rating", key: "rating", formatter: (value) => `${value}/5` },
    { label: "Payment terms", key: "payment_terms", formatter: (value) => value },
  ];

  return (
    <div className="page-stack">
      <section className="page-header-card">
        <div>
          <h2>Quotation Comparison</h2>
          <p>Compare commercial strength, delivery velocity, and vendor trust before you lock approval.</p>
        </div>
      </section>

      <SurfaceCard className="comparison-card">
        <div className="comparison-grid">
          <div className="comparison-grid__criteria">
            <div className="comparison-grid__header">Criteria</div>
            {rows.map((row) => (
              <div className="comparison-grid__cell" key={row.label}>
                {row.label}
              </div>
            ))}
          </div>

          {data?.map((quotation) => {
            const isLowest = quotation.id === lowest?.id;
            return (
              <div key={quotation.id} className={`comparison-grid__vendor ${isLowest ? "comparison-grid__vendor--best" : ""}`}>
                <div className="comparison-grid__header">
                  {quotation.vendor_name}
                  {isLowest ? <span>Lowest</span> : null}
                </div>
                {rows.map((row) => (
                  <div className="comparison-grid__cell" key={`${quotation.id}-${row.key}`}>
                    {row.formatter(quotation[row.key])}
                  </div>
                ))}
                <Button
                  variant={isLowest ? "primary" : "secondary"}
                  onClick={() => navigate("/approvals")}
                >
                  {isLowest ? "Select & Approve" : "Select"}
                </Button>
              </div>
            );
          })}
        </div>
        <p className="comparison-note">
          Green highlights the lowest landed cost. Selecting a vendor launches the approval workflow.
        </p>
      </SurfaceCard>
    </div>
  );
}
