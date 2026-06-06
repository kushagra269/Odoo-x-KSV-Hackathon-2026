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

  return (
    <div className="page-stack">
      <section className="page-header-card">
        <div>
          <h2>Quotation Comparison</h2>
          <p>Review vendor quotations side by side and approve the preferred option.</p>
        </div>
      </section>

      <SurfaceCard className="comparison-card">
        <div className="quote-rail" aria-label="Vendor quotation comparison">
          {data?.map((quotation) => (
            <article key={quotation.id} className="quote-card">
              <div className="quote-card__header">
                <div>
                  <span>{quotation.quotation_number}</span>
                  <h3>{quotation.vendor_name}</h3>
                </div>
                <strong>{formatCurrency(quotation.grand_total)}</strong>
              </div>

              <div className="quote-card__details">
                <div>
                  <span>GST</span>
                  <strong>{quotation.gst_percentage}%</strong>
                </div>
                <div>
                  <span>Delivery</span>
                  <strong>{quotation.delivery_days} days</strong>
                </div>
                <div>
                  <span>Rating</span>
                  <strong>{quotation.rating}/5</strong>
                </div>
                <div>
                  <span>Terms</span>
                  <strong>{quotation.payment_terms}</strong>
                </div>
              </div>

              <div className="quote-card__items">
                {quotation.line_items?.map((item) => (
                  <div key={item.id}>
                    <span>{item.item_name}</span>
                    <strong>{formatCurrency(item.total_price)}</strong>
                  </div>
                ))}
              </div>

              <Button variant="secondary" onClick={() => navigate("/approvals")}>
                Approve
              </Button>
            </article>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
