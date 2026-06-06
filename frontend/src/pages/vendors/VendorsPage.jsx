import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus } from "lucide-react";
import { vendorsApi } from "../../api/vendorsApi";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useUiStore } from "../../store/uiStore";

const vendorDefaults = {
  vendor_name: "",
  category: "",
  gst_number: "",
  contact_name: "",
  contact_number: "",
  email: "",
  address: "",
  country: "India",
};

export function VendorsPage() {
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState(vendorDefaults);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const queryClient = useQueryClient();
  const pushToast = useUiStore((state) => state.pushToast);

  const { data } = useQuery({
    queryKey: ["vendors", status, search],
    queryFn: () => vendorsApi.getAll({ status, search }),
  });

  const createMutation = useMutation({
    mutationFn: vendorsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setDrawerOpen(false);
      setDraft(vendorDefaults);
      pushToast({
        tone: "success",
        title: "Vendor created",
        description: "The new vendor profile is ready for verification.",
      });
    },
  });

  const tabs = useMemo(
    () => [
      { key: "all", label: `All (${data?.counts.all ?? 0})` },
      { key: "active", label: `Active (${data?.counts.active ?? 0})` },
      { key: "pending", label: `Pending (${data?.counts.pending ?? 0})` },
      { key: "blocked", label: `Blocked (${data?.counts.blocked ?? 0})` },
    ],
    [data]
  );

  return (
    <div className="page-stack">
      <section className="page-header-card">
        <div>
          <h2>Vendors</h2>
          <p>Manage supplier profiles, status health, and onboarding quality from one place.</p>
        </div>
        <Button onClick={() => setDrawerOpen(true)}>
          <UserPlus size={16} />
          Add Vendor
        </Button>
      </section>

      <SurfaceCard>
        <label className="search-input">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by vendor name, GST number, or category..."
          />
        </label>

        <div className="filter-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`filter-tabs__item ${status === tab.key ? "filter-tabs__item--active" : ""}`}
              onClick={() => setStatus(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="data-table">
          <div className="data-table__row data-table__row--head data-table__row--vendors">
            <span>Vendor Name</span>
            <span>Category</span>
            <span>GST No.</span>
            <span>Contact</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {data?.items?.map((vendor) => (
            <div key={vendor.id} className="data-table__row data-table__row--vendors">
              <span>
                <strong>{vendor.vendor_name}</strong>
                <small>{vendor.contact_name}</small>
              </span>
              <span>{vendor.category}</span>
              <span>{vendor.gst_number}</span>
              <span>{vendor.contact_number}</span>
              <StatusBadge status={vendor.status}>{vendor.status}</StatusBadge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  pushToast({
                    tone: "info",
                    title: vendor.vendor_name,
                    description: "Vendor detail interaction is active and ready for API-backed deep views.",
                  })
                }
              >
                View
              </Button>
            </div>
          ))}
        </div>
      </SurfaceCard>

      <aside className={`drawer ${drawerOpen ? "drawer--open" : ""}`}>
        <div className="drawer__panel">
          <div className="drawer__header">
            <div>
              <h3>Add vendor</h3>
              <p>Capture the supplier details your backend expects from day one.</p>
            </div>
            <button className="drawer__close" onClick={() => setDrawerOpen(false)}>
              ×
            </button>
          </div>

          <div className="drawer__body">
            <Field label="Vendor name" value={draft.vendor_name} onChange={(event) => setDraft({ ...draft, vendor_name: event.target.value })} />
            <Field label="Category" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} />
            <Field label="GST number" value={draft.gst_number} onChange={(event) => setDraft({ ...draft, gst_number: event.target.value })} />
            <Field label="Contact name" value={draft.contact_name} onChange={(event) => setDraft({ ...draft, contact_name: event.target.value })} />
            <Field label="Contact number" value={draft.contact_number} onChange={(event) => setDraft({ ...draft, contact_number: event.target.value })} />
            <Field label="Email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
            <Field label="Country" value={draft.country} onChange={(event) => setDraft({ ...draft, country: event.target.value })} />
            <Field label="Address" textarea rows={4} value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} />
          </div>

          <div className="drawer__footer">
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => createMutation.mutate(draft)} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Create Vendor"}
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
