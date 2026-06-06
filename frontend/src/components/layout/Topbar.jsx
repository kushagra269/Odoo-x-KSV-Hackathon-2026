import { Bell, Search } from "lucide-react";
import { useUiStore } from "../../store/uiStore";

export function Topbar() {
  const pushToast = useUiStore((state) => state.pushToast);

  return (
    <header className="topbar">
      <div className="topbar__actions">
        <label className="topbar__search">
          <Search size={16} />
          <input
            placeholder="Search vendor, RFQ, PO..."
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                pushToast({
                  tone: "info",
                  title: "Search ready",
                  description: `Global search is ready to query "${event.currentTarget.value}".`,
                });
              }
            }}
          />
        </label>
        <button
          className="topbar__icon"
          aria-label="Notifications"
          onClick={() =>
            pushToast({
              tone: "info",
              title: "No new alerts",
              description: "Approval, RFQ, and invoice alerts will appear here.",
            })
          }
        >
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
