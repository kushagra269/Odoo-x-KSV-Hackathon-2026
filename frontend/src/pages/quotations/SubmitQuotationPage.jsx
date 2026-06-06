import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { quotationsApi } from "../../api/quotationsApi";
import { rfqApi } from "../../api/rfqApi";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { useUiStore } from "../../store/uiStore";
import { formatCurrency } from "../../utils/formatters";

export function SubmitQuotationPage() {
  const pushToast = useUiStore((state) => state.pushToast);
  const { data: rfq } = useQuery({
    queryKey: ["rfq-submit"],
    queryFn: rfqApi.getOne,
  });

  const [draft, setDraft] = useState({
    gst_percentage: 18,
    payment_terms: "20 days net",
    notes: "Flexible delivery slots available.",
    line_items: [
      { item_name: "Ergonomic chair", quantity: 25, unit_price: 3500, delivery_days: 7 },
      { item_name: "Standing desk", quantity: 10, unit_price: 8200, delivery_days: 14 },
    ],
  });

  const totals = useMemo(() => {
    const subtotal = draft.line_items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const gstAmount = subtotal * (draft.gst_percentage / 100);
    return {
      subtotal,
      gstAmount,
      grandTotal: subtotal + gstAmount,
    };
  }, [draft]);

  const submitMutation = useMutation({
    mutationFn: quotationsApi.submit,
    onSuccess: () => {
      pushToast({
        tone: "success",
        title: "Quotation submitted",
        description: "The vendor response is now ready for comparison and approvals.",
      });
    },
  });

  return (
    <div className="page-stack">
      <section className="page-header-card">
        <div>
          <h2>Submit Quotation</h2>
          <p>Respond to the RFQ with precise pricing, delivery timing, and commercial notes.</p>
        </div>
      </section>

      <SurfaceCard className="quote-summary">
        <h3>RFQ Summary</h3>
        <p>{rfq?.line_items?.map((item) => `${item.item_name} x ${item.quantity}`).join(", ")} · Deadline {rfq?.deadline}</p>
      </SurfaceCard>

      <SurfaceCard className="page-stack">
        <div className="data-table">
          <div className="data-table__row data-table__row--head data-table__row--quote">
            <span>Item</span>
            <span>Qty</span>
            <span>Unit price</span>
            <span>Total</span>
            <span>Delivery (days)</span>
          </div>
          {draft.line_items.map((item, index) => (
            <div className="data-table__row data-table__row--quote" key={item.item_name}>
              <span>{item.item_name}</span>
              <span>{item.quantity}</span>
              <span>
                <input
                  className="table-input"
                  type="number"
                  value={item.unit_price}
                  onChange={(event) => {
                    const next = [...draft.line_items];
                    next[index].unit_price = Number(event.target.value);
                    setDraft({ ...draft, line_items: next });
                  }}
                />
              </span>
              <span>{formatCurrency(item.quantity * item.unit_price)}</span>
              <span>
                <input
                  className="table-input"
                  type="number"
                  value={item.delivery_days}
                  onChange={(event) => {
                    const next = [...draft.line_items];
                    next[index].delivery_days = Number(event.target.value);
                    setDraft({ ...draft, line_items: next });
                  }}
                />
              </span>
            </div>
          ))}
        </div>

        <div className="two-column">
          <div className="page-stack">
            <Field
              label="Tax / GST %"
              type="number"
              value={draft.gst_percentage}
              onChange={(event) => setDraft({ ...draft, gst_percentage: Number(event.target.value) })}
            />
            <Field
              label="Notes / terms"
              textarea
              rows={5}
              value={draft.notes}
              onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
            />
          </div>

          <SurfaceCard className="totals-card">
            <div className="totals-card__row">
              <span>Subtotal</span>
              <strong>{formatCurrency(totals.subtotal)}</strong>
            </div>
            <div className="totals-card__row">
              <span>GST ({draft.gst_percentage}%)</span>
              <strong>{formatCurrency(totals.gstAmount)}</strong>
            </div>
            <div className="totals-card__divider" />
            <div className="totals-card__row">
              <span>Grand total</span>
              <strong>{formatCurrency(totals.grandTotal)}</strong>
            </div>
          </SurfaceCard>
        </div>

        <div className="page-actions">
          <Button
            variant="secondary"
            onClick={() =>
              pushToast({
                tone: "success",
                title: "Draft saved",
                description: "Your quotation draft is stored in the frontend flow and ready to submit later.",
              })
            }
          >
            Save Draft
          </Button>
          <Button onClick={() => submitMutation.mutate(draft)}>Submit Quotation</Button>
        </div>
      </SurfaceCard>
    </div>
  );
}
