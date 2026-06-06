import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Clock3 } from "lucide-react";
import { approvalsApi } from "../../api/approvalsApi";
import { quotationsApi } from "../../api/quotationsApi";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Stepper } from "../../components/ui/Stepper";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { useUiStore } from "../../store/uiStore";
import { formatCurrency, formatDate } from "../../utils/formatters";

export function ApprovalsPage() {
  const pushToast = useUiStore((state) => state.pushToast);
  const { data: approval } = useQuery({
    queryKey: ["approval"],
    queryFn: approvalsApi.getOne,
  });
  const { data: quotations } = useQuery({
    queryKey: ["approval-quotations"],
    queryFn: quotationsApi.getAll,
  });

  const selectedQuotation = quotations?.find((item) => item.id === approval?.quotation_id);

  const approvalMutation = useMutation({
    mutationFn: approvalsApi.act,
    onSuccess: (_, variables) => {
      pushToast({
        tone: variables.action === "approve" ? "success" : "warning",
        title: variables.action === "approve" ? "Approval submitted" : "Request rejected",
        description: "The workflow state has been updated in the UI flow.",
      });
    },
  });

  return (
    <div className="page-stack">
      <section className="page-header-card">
        <div>
          <h2>Approval Workflow</h2>
          <p>
            RFQ: office furniture Q2 · Vendor: {selectedQuotation?.vendor_name} · Amount:{" "}
            {formatCurrency(selectedQuotation?.grand_total)}
          </p>
        </div>
      </section>

      <SurfaceCard>
        <Stepper
          currentStep={approval?.current_step || 1}
          steps={[
            { label: "Submitted" },
            { label: "L1 Review" },
            { label: "L2 Approval" },
            { label: "Generate PO" },
          ]}
        />

        <div className="two-column approval-layout">
          <div className="page-stack">
            <SurfaceCard className="nested-card">
              <h3>Approval chain</h3>
              <div className="approval-chain">
                {approval?.steps?.map((step) => (
                  <article key={step.id} className="approval-chain__item">
                    <div className={`approval-chain__icon approval-chain__icon--${step.status}`}>
                      {step.status === "approved" ? <Check size={18} /> : <Clock3 size={18} />}
                    </div>
                    <div>
                      <strong>
                        {step.approver_name} ({step.approver_role})
                      </strong>
                      <p>
                        {step.status === "approved" ? "Approved" : "Awaiting"} ·{" "}
                        {formatDate(step.acted_at || step.assigned_at, { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </SurfaceCard>

            <Field label="Approval remarks" textarea rows={5} placeholder="Add your comments or conditions..." />
          </div>

          <SurfaceCard className="nested-card">
            <h3>Quotation summary</h3>
            <div className="summary-list">
              <div>
                <span>Vendor</span>
                <strong>{selectedQuotation?.vendor_name}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatCurrency(selectedQuotation?.grand_total)}</strong>
              </div>
              <div>
                <span>Delivery</span>
                <strong>{selectedQuotation?.delivery_days} days</strong>
              </div>
              <div>
                <span>Rating</span>
                <strong>{selectedQuotation?.rating}/5</strong>
              </div>
            </div>

            <div className="page-actions page-actions--inline">
              <Button
                onClick={() =>
                  approvalMutation.mutate({
                    id: approval.id,
                    stepId: approval.current_step_id,
                    action: "approve",
                  })
                }
              >
                Approve
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  approvalMutation.mutate({
                    id: approval.id,
                    stepId: approval.current_step_id,
                    action: "reject",
                  })
                }
              >
                Reject
              </Button>
            </div>
          </SurfaceCard>
        </div>
      </SurfaceCard>
    </div>
  );
}
