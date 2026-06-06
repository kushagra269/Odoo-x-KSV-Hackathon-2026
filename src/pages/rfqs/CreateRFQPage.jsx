import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, Upload, X } from "lucide-react";
import { rfqApi } from "../../api/rfqApi";
import { vendorsApi } from "../../api/vendorsApi";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Stepper } from "../../components/ui/Stepper";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { useUiStore } from "../../store/uiStore";

const defaultDraft = {
  title: "Office Furniture procurement Q2",
  category: "Furniture",
  deadline: "2026-06-15",
  description: "Ergonomic chairs and standing desks for the 3rd floor workspace.",
  line_items: [
    { item_name: "Ergonomic chair", quantity: 25, unit: "NOS" },
    { item_name: "Standing desk", quantity: 10, unit: "NOS" },
  ],
  vendor_ids: ["ven-001", "ven-002"],
  attachments: ["workspace-layout.pdf"],
};

export function CreateRFQPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [draft, setDraft] = useState(defaultDraft);
  const pushToast = useUiStore((state) => state.pushToast);
  const { data: vendorResponse } = useQuery({
    queryKey: ["vendor-assignments"],
    queryFn: () => vendorsApi.getAll({ status: "active", search: "" }),
  });

  const saveMutation = useMutation({
    mutationFn: rfqApi.save,
    onSuccess: () => {
      pushToast({
        tone: "success",
        title: "RFQ saved",
        description: "The RFQ draft is ready to share with selected vendors.",
      });
    },
  });

  const toggleVendor = (vendorId) => {
    setDraft((current) => {
      const exists = current.vendor_ids.includes(vendorId);
      return {
        ...current,
        vendor_ids: exists ? current.vendor_ids.filter((id) => id !== vendorId) : [...current.vendor_ids, vendorId],
      };
    });
  };

  return (
    <div className="page-stack">
      <section className="page-header-card">
        <div>
          <h2>Create RFQ</h2>
          <p>Shape a clean request for quotation and keep the vendor invitation process structured.</p>
        </div>
      </section>

      <SurfaceCard>
        <Stepper
          currentStep={currentStep}
          steps={[
            { label: "Basic info" },
            { label: "Line items & vendors" },
            { label: "Attachments" },
          ]}
        />

        <div className="rfq-layout">
          <div className="rfq-layout__main">
            <Field label="RFQ title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            <Field label="Category" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} />
            <Field label="Deadline" type="date" value={draft.deadline} onChange={(event) => setDraft({ ...draft, deadline: event.target.value })} />
            <Field
              label="Description"
              textarea
              rows={4}
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />

            <div className="line-items-card">
              <div className="section-heading">
                <div>
                  <p className="section-heading__eyebrow">Step 2</p>
                  <h3>Line items</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      line_items: [...current.line_items, { item_name: "", quantity: 1, unit: "NOS" }],
                    }))
                  }
                >
                  <Plus size={14} />
                  Add line item
                </Button>
              </div>

              {draft.line_items.map((item, index) => (
                <div className="line-item-row" key={`${item.item_name}-${index}`}>
                  <Field
                    label="Item"
                    value={item.item_name}
                    onChange={(event) => {
                      const next = [...draft.line_items];
                      next[index].item_name = event.target.value;
                      setDraft({ ...draft, line_items: next });
                    }}
                  />
                  <Field
                    label="Qty"
                    type="number"
                    value={item.quantity}
                    onChange={(event) => {
                      const next = [...draft.line_items];
                      next[index].quantity = Number(event.target.value);
                      setDraft({ ...draft, line_items: next });
                    }}
                  />
                  <Field
                    label="Unit"
                    value={item.unit}
                    onChange={(event) => {
                      const next = [...draft.line_items];
                      next[index].unit = event.target.value;
                      setDraft({ ...draft, line_items: next });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rfq-layout__side">
            <SurfaceCard className="stacked-card">
              <div className="section-heading">
                <div>
                  <p className="section-heading__eyebrow">Step 2</p>
                  <h3>Assign vendors</h3>
                </div>
              </div>
              <div className="vendor-picker">
                {vendorResponse?.items?.map((vendor) => (
                  <button
                    key={vendor.id}
                    className={`vendor-pill ${draft.vendor_ids.includes(vendor.id) ? "vendor-pill--selected" : ""}`}
                    onClick={() => toggleVendor(vendor.id)}
                  >
                    <span>{vendor.vendor_name}</span>
                    {draft.vendor_ids.includes(vendor.id) ? <X size={14} /> : <Plus size={14} />}
                  </button>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard className="stacked-card">
              <div className="section-heading">
                <div>
                  <p className="section-heading__eyebrow">Step 3</p>
                  <h3>Attachments</h3>
                </div>
              </div>
              <div className="upload-zone">
                <Upload size={18} />
                <p>Drag & drop files or click to upload</p>
                <small>Specification sheets, layouts, approvals, or supporting documents</small>
              </div>
            </SurfaceCard>
          </div>
        </div>

        <div className="page-actions">
          <Button variant="secondary" onClick={() => saveMutation.mutate({ ...draft, status: "draft" })}>
            Save as Draft
          </Button>
          <Button onClick={() => saveMutation.mutate({ ...draft, status: "published" })}>Save & Send to Vendors</Button>
        </div>
      </SurfaceCard>
    </div>
  );
}
