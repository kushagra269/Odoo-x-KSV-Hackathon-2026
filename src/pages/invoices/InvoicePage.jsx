import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, Mail, Printer } from "lucide-react";
import { invoicesApi } from "../../api/invoicesApi";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { useUiStore } from "../../store/uiStore";
import { downloadTextFile } from "../../utils/downloads";
import { formatCurrency, formatDate } from "../../utils/formatters";

export function InvoicePage() {
  const pushToast = useUiStore((state) => state.pushToast);
  const { data: invoice } = useQuery({
    queryKey: ["invoice"],
    queryFn: invoicesApi.getOne,
  });

  const markPaidMutation = useMutation({
    mutationFn: () => invoicesApi.markPaid(invoice.id),
    onSuccess: () => {
      pushToast({
        tone: "success",
        title: "Invoice status updated",
        description: "This invoice is now marked as paid in the frontend flow.",
      });
    },
  });

  return (
    <div className="page-stack">
      <section className="page-header-card invoice-header">
        <div>
          <h2>Purchase Order & Invoice</h2>
          <p>{invoice?.po_number} · Auto-generated after approval · Print-ready and API-ready for PDF/email actions</p>
        </div>
        <div className="page-actions page-actions--inline">
          <Button
            variant="secondary"
            onClick={() =>
              downloadTextFile(
                `${invoice?.invoice_number || "invoice"}.txt`,
                [
                  `Invoice: ${invoice?.invoice_number}`,
                  `PO: ${invoice?.po_number}`,
                  `Vendor: ${invoice?.vendor_name}`,
                  `Grand Total: ${formatCurrency(invoice?.grand_total)}`,
                ].join("\n")
              )
            }
          >
            <Download size={16} />
            Download PDF
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer size={16} />
            Print
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              pushToast({
                tone: "success",
                title: "Invoice email queued",
                description: "This button is ready to call the backend invoice email endpoint.",
              })
            }
          >
            <Mail size={16} />
            Email invoice
          </Button>
        </div>
      </section>

      <SurfaceCard className="page-stack">
        <div className="two-column invoice-meta">
          <div>
            <h3>Bill to</h3>
            <p>{invoice?.bill_to_name}</p>
            <p>{invoice?.bill_to_address}</p>
            <p>GSTIN: {invoice?.bill_to_gstin}</p>
          </div>
          <div>
            <h3>Vendor</h3>
            <p>{invoice?.vendor_name}</p>
            <p>{invoice?.vendor_address}</p>
            <p>GSTIN: {invoice?.vendor_gstin}</p>
          </div>
        </div>

        <div className="two-column invoice-meta invoice-meta--secondary">
          <div>
            <p>PO Number: {invoice?.po_number}</p>
            <p>PO Date: {invoice?.po_date ? formatDate(invoice.po_date) : ""}</p>
          </div>
          <div>
            <p>Invoice Date: {invoice?.invoice_date ? formatDate(invoice.invoice_date) : ""}</p>
            <p>Due Date: {invoice?.due_date ? formatDate(invoice.due_date) : ""}</p>
          </div>
        </div>

        <div className="data-table">
          <div className="data-table__row data-table__row--head data-table__row--invoice">
            <span>Item</span>
            <span>Qty</span>
            <span>Unit price</span>
            <span>Total</span>
          </div>
          {invoice?.items?.map((item) => (
            <div key={item.item_name} className="data-table__row data-table__row--invoice">
              <span>{item.item_name}</span>
              <span>{item.quantity}</span>
              <span>{formatCurrency(item.unit_price)}</span>
              <span>{formatCurrency(item.total_price)}</span>
            </div>
          ))}
        </div>

        <SurfaceCard className="totals-card">
          <div className="totals-card__row">
            <span>Subtotal</span>
            <strong>{formatCurrency(invoice?.subtotal)}</strong>
          </div>
          <div className="totals-card__row">
            <span>CGST (9%)</span>
            <strong>{formatCurrency(invoice?.cgst_amount)}</strong>
          </div>
          <div className="totals-card__row">
            <span>SGST (9%)</span>
            <strong>{formatCurrency(invoice?.sgst_amount)}</strong>
          </div>
          <div className="totals-card__divider" />
          <div className="totals-card__row">
            <span>Grand total</span>
            <strong>{formatCurrency(invoice?.grand_total)}</strong>
          </div>
        </SurfaceCard>

        <div className="invoice-status">
          <div className="invoice-status__meta">
            <span>Status</span>
            <StatusBadge status={invoice?.status}>Pending Payment</StatusBadge>
          </div>
          <Button onClick={() => markPaidMutation.mutate()}>Mark as Paid</Button>
        </div>
      </SurfaceCard>
    </div>
  );
}
